import type { ApiResponse } from '@lazy-map/application';
import axios from 'axios';
import { logger } from '.';
import type {
  GeneratedMap,
  MapSettings,
  GenerateMapRequest,
  TacticalMapResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3030/api';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Maps can be generated without authentication
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      // Redirect to login if needed
      window.location.reload();
    }
    return Promise.reject(error);
  },
);

/**
 * Convert frontend settings to backend request format
 */
function mapSettingsToRequest(settings: MapSettings): GenerateMapRequest {
  const request: GenerateMapRequest = {
    name: settings.name,
    width: settings.width,
    height: settings.height,
    seed: settings.seed || Math.floor(Math.random() * 1000000),
  };

  // Add context settings if provided
  if (settings.contextSettings) {
    const { biome, elevation, hydrology, development, season, requiredFeatures } =
      settings.contextSettings;
    if (biome) request.biome = biome;
    if (elevation) request.elevation = elevation;
    if (hydrology) request.hydrology = hydrology;
    if (development) request.development = development;
    if (season) request.season = season;
    if (requiredFeatures) request.requiredFeatures = requiredFeatures;
  }

  // Add advanced settings if provided
  if (settings.advancedSettings) {
    const { terrainRuggedness, waterAbundance, vegetationMultiplier } = settings.advancedSettings;

    if (terrainRuggedness !== undefined) {
      request.terrainRuggedness = terrainRuggedness;
    }

    if (waterAbundance !== undefined) {
      request.waterAbundance = waterAbundance;
    }

    if (vegetationMultiplier !== undefined) {
      request.vegetationMultiplier = vegetationMultiplier;
    }
  }

  return request;
}

// Convert backend response to frontend format
function mapResponseToGeneratedMap(
  response: TacticalMapResponse,
  seed?: string | number,
): GeneratedMap {
  const { layers } = response.map;
  const width = response.width;
  const height = response.height;

  // Build tiles from layer data for backward compat with MapCanvas
  const tiles: GeneratedMap['tiles'] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const features: string[] = [];

      // Extract vegetation type
      const vegTile = layers?.vegetation?.tiles?.[y]?.[x];
      if (vegTile?.vegetationType && vegTile.vegetationType !== 'none') {
        features.push(vegTile.vegetationType);
      }

      // Extract structure type
      const structTile = layers?.structures?.tiles?.[y]?.[x];
      if (structTile?.hasStructure && structTile.structureType) {
        features.push(structTile.structureType);
      }

      // Extract tactical features
      const featTile = layers?.features?.tiles?.[y]?.[x];
      if (featTile?.hasFeature && featTile.featureType) {
        features.push(featTile.featureType);
      }

      // Derive terrain from geology rock type
      const geoTile = layers?.geology?.tiles?.[y]?.[x];
      const topoTile = layers?.topography?.tiles?.[y]?.[x];
      const hydroTile = layers?.hydrology?.tiles?.[y]?.[x];

      let terrain = 'grass';
      if (hydroTile?.waterDepth && hydroTile.waterDepth > 0) {
        terrain = 'water';
      } else if (hydroTile?.moisture === 'saturated' || hydroTile?.moisture === 'wet') {
        terrain = 'marsh';
      } else if (geoTile?.formation?.rockType === 'evaporite') {
        terrain = 'sand';
      } else if (topoTile?.slope && topoTile.slope > 45) {
        terrain = 'stone';
      } else if (geoTile?.soilDepth !== undefined && geoTile.soilDepth < 0.5) {
        terrain = 'stone';
      } else if (vegTile?.vegetationType === 'none' && geoTile?.soilDepth !== undefined && geoTile.soilDepth < 1) {
        terrain = 'dirt';
      }

      tiles.push({
        x,
        y,
        terrain,
        elevation: topoTile?.elevation ?? 0,
        features,
      });
    }
  }

  return {
    id: `tactical-${Date.now()}`,
    name: response.context || 'Tactical Map',
    width,
    height,
    cellSize: 5,
    seed,
    metadata: response.map.context,
    tiles,
    layers,
  };
}

export const apiService = {
  async login(email: string, password: string): Promise<ApiResponse<{ user: any; token: string }>> {
    try {
      const response = await apiClient.post<ApiResponse<{ user: any; token: string }>>(
        '/auth/login',
        { email, password },
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error || 'Login failed',
        };
      }
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  },

  async generateMap(settings: MapSettings): Promise<GeneratedMap> {
    try {
      const request = mapSettingsToRequest(settings);

      const response = await apiClient.post<ApiResponse<TacticalMapResponse>>(
        '/maps/generate',
        request,
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to generate map');
      }

      return mapResponseToGeneratedMap(response.data.data, request.seed);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.error) {
          throw new Error(error.response.data.error);
        }
        if (error.code === 'ECONNREFUSED') {
          throw new Error(
            'Cannot connect to the map generation service. Please ensure the backend is running on port 3030.',
          );
        }
        if (error.code === 'ECONNABORTED') {
          throw new Error(
            'Map generation timed out. Please try with smaller dimensions or simpler settings.',
          );
        }
      }
      throw new Error(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  },

  async saveMap(
    map: GeneratedMap,
    name?: string,
    description?: string,
  ): Promise<{ success: boolean; mapId?: string; error?: string }> {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required to save maps');
      }

      const response = await apiClient.post<
        ApiResponse<{ success: boolean; mapId?: string; message?: string }>
      >(
        '/maps/save',
        {
          id: map.id,
          width: map.width,
          height: map.height,
          seed: String(map.seed || 'default'), // Convert to string as backend expects string
          tiles: map.tiles,
          name: name || map.name,
          description,
          metadata: map.metadata || {},
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to save map');
      }

      return {
        success: true,
        mapId: response.data.data?.mapId,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Please login to save maps');
        }
        if (error.response?.data?.error) {
          throw new Error(error.response.data.error);
        }
      }
      throw new Error(error instanceof Error ? error.message : 'Failed to save map');
    }
  },

  async getMap(id: string): Promise<GeneratedMap> {
    try {
      const response = await apiClient.get<ApiResponse<TacticalMapResponse>>(`/maps/${id}`);

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Map not found');
      }

      // When retrieving a saved map, we don't have the original seed
      return mapResponseToGeneratedMap(response.data.data, undefined);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Map not found');
        }
        if (error.response?.data?.error) {
          throw new Error(error.response.data.error);
        }
      }
      throw new Error(error instanceof Error ? error.message : 'Failed to retrieve map');
    }
  },

  async getUserMaps(): Promise<GeneratedMap[]> {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        return [];
      }

      const response = await apiClient.get<ApiResponse<TacticalMapResponse[]>>('/maps/my-maps', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.data.success || !response.data.data) {
        return [];
      }

      return response.data.data.map((mapData) => mapResponseToGeneratedMap(mapData, undefined));
    } catch (error) {
      logger.error(
        'Failed to get user maps',
        { component: 'ApiService', operation: 'getUserMaps' },
        { error },
      );
      return [];
    }
  },

  async checkHealth(): Promise<string> {
    try {
      const response = await apiClient.get<ApiResponse<string>>('/maps/health');
      return response.data.data || 'OK';
    } catch (error) {
      throw new Error(
        `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  },

  async validateSeed(seed: string | number): Promise<{
    valid: boolean;
    normalizedSeed?: number;
    error?: string;
    warnings?: string[];
    metadata: {
      originalValue: string | number;
      inputType: 'string' | 'number';
      wasNormalized: boolean;
      algorithmVersion: string;
      timestamp: string;
    };
  }> {
    try {
      const response = await apiClient.post<
        ApiResponse<{
          valid: boolean;
          normalizedSeed?: number;
          error?: string;
          warnings?: string[];
          metadata: {
            originalValue: string | number;
            inputType: 'string' | 'number';
            wasNormalized: boolean;
            algorithmVersion: string;
            timestamp: string;
          };
        }>
      >('/maps/seeds/validate', { seed });

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to validate seed');
      }

      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.error) {
          throw new Error(error.response.data.error);
        }
      }
      throw new Error(error instanceof Error ? error.message : 'Failed to validate seed');
    }
  },
};
