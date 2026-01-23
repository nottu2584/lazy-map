import type { ApiResponse } from '@lazy-map/application';
import axios from 'axios';
import type { GeneratedMap, MapSettings } from '../types';
import { logger } from './';

// API configuration from environment variables
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
  }
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
  }
);

export interface GenerateMapRequest {
  name?: string;
  width?: number;
  height?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  seed?: string | number;
  cellSize?: number;

  // Advanced settings
  elevationVariance?: number;
  elevationMultiplier?: number;
  addHeightNoise?: boolean;
  heightVariance?: number;
  inclinationChance?: number;

  forestSettings?: {
    forestDensity?: number;
    treeDensity?: number;
    treeClumping?: number;
    underbrushDensity?: number;
    allowTreeOverlap?: boolean;
    enableInosculation?: boolean;
    preferredSpecies?: string[];
  };

  terrainDistribution?: {
    grassland?: number;
    forest?: number;
    mountain?: number;
    water?: number;
    desert?: number;
    swamp?: number;
  };

  generateForests?: boolean;
  generateRivers?: boolean;
  generateRoads?: boolean;
  generateBuildings?: boolean;

  biomeType?: string;
}

export interface TacticalMapResponse {
  map: {
    width: number;
    height: number;
    tiles: Array<{
      position: {
        x: number;
        y: number;
      };
      terrain: {
        type: string;
        movementCost: number;
        isPassable: boolean;
      };
      elevation: number;
      layers: {
        geology?: any;
        topography?: any;
        hydrology?: any;
        vegetation?: any;
        structures?: any;
        features?: any;
      };
    }>;
    context?: {
      biome: string;
      elevation: string;
      development: string;
      description?: string;
    };
  };
  width: number;
  height: number;
  context?: string;
  totalTime: number;
}

// Convert frontend settings to backend request format
function mapSettingsToRequest(settings: MapSettings): GenerateMapRequest {
  const request: GenerateMapRequest = {
    name: settings.name,
    width: settings.width,
    height: settings.height,
    seed: settings.seed || Math.floor(Math.random() * 1000000),
    cellSize: settings.cellSize,
  };

  // Add advanced settings if provided
  if (settings.advancedSettings) {
    const { elevation, vegetation, terrainDistribution, features, biomeOverride } = settings.advancedSettings;

    // Elevation settings
    if (elevation) {
      if (elevation.variance !== undefined) request.elevationVariance = elevation.variance;
      if (elevation.multiplier !== undefined) request.elevationMultiplier = elevation.multiplier;
      if (elevation.addNoise !== undefined) request.addHeightNoise = elevation.addNoise;
      if (elevation.heightVariance !== undefined) request.heightVariance = elevation.heightVariance;
      if (elevation.inclinationChance !== undefined) request.inclinationChance = elevation.inclinationChance;
    }

    // Vegetation settings
    if (vegetation) {
      request.forestSettings = {
        forestDensity: vegetation.forestDensity,
        treeDensity: vegetation.treeDensity,
        treeClumping: vegetation.treeClumping,
        underbrushDensity: vegetation.underbrushDensity,
        allowTreeOverlap: vegetation.allowTreeOverlap,
        enableInosculation: vegetation.enableInosculation,
        preferredSpecies: vegetation.preferredSpecies,
      };
    }

    // Terrain distribution
    if (terrainDistribution) {
      request.terrainDistribution = terrainDistribution;
    }

    // Feature toggles
    if (features) {
      if (features.generateForests !== undefined) request.generateForests = features.generateForests;
      if (features.generateRivers !== undefined) request.generateRivers = features.generateRivers;
      if (features.generateRoads !== undefined) request.generateRoads = features.generateRoads;
      if (features.generateBuildings !== undefined) request.generateBuildings = features.generateBuildings;
    }

    // Biome override
    if (biomeOverride) {
      request.biomeType = biomeOverride;
    }
  }

  return request;
}

// Convert backend response to frontend format
function mapResponseToGeneratedMap(response: TacticalMapResponse, seed?: string | number): GeneratedMap {
  const tiles = response.map.tiles.map(tile => {
    // Extract features from layers
    const features: string[] = [];

    // Add vegetation features
    if (tile.layers.vegetation?.type) {
      features.push(tile.layers.vegetation.type);
    }

    // Add structure features
    if (tile.layers.structures?.type) {
      features.push(tile.layers.structures.type);
    }

    // Add tactical features
    if (tile.layers.features?.cover) {
      features.push(`cover_${tile.layers.features.cover}`);
    }

    return {
      x: tile.position.x,
      y: tile.position.y,
      terrain: tile.terrain.type,
      elevation: tile.elevation,
      features,
    };
  });

  return {
    id: `tactical-${Date.now()}`, // Generate temporary ID
    name: response.context || 'Tactical Map',
    width: response.width,
    height: response.height,
    cellSize: 5, // Default cell size for tactical maps
    seed,
    metadata: response.map.context,
    tiles,
  };
}

export const apiService = {
  async login(email: string, password: string): Promise<ApiResponse<{ user: any; token: string }>> {
    try {
      const response = await apiClient.post<ApiResponse<{ user: any; token: string }>>(
        '/auth/login',
        { email, password }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error || 'Login failed'
        };
      }
      return {
        success: false,
        error: 'An unexpected error occurred'
      };
    }
  },

  async generateMap(settings: MapSettings): Promise<GeneratedMap> {
    try {
      const request = mapSettingsToRequest(settings);

      const response = await apiClient.post<ApiResponse<TacticalMapResponse>>(
        '/maps/generate',
        request
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
          throw new Error('Cannot connect to the map generation service. Please ensure the backend is running on port 3030.');
        }
        if (error.code === 'ECONNABORTED') {
          throw new Error('Map generation timed out. Please try with smaller dimensions or simpler settings.');
        }
      }
      throw new Error(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  },

  async saveMap(map: GeneratedMap, name?: string, description?: string): Promise<{ success: boolean; mapId?: string; error?: string }> {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required to save maps');
      }

      const response = await apiClient.post<ApiResponse<{ success: boolean; mapId?: string; message?: string }>>(
        '/maps/save',
        {
          id: map.id,
          width: map.width,
          height: map.height,
          seed: String(map.seed || 'default'), // Convert to string as backend expects string
          tiles: map.tiles,
          name: name || map.name,
          description,
          metadata: map.metadata || {}
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to save map');
      }

      return {
        success: true,
        mapId: response.data.data?.mapId
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

      const response = await apiClient.get<ApiResponse<TacticalMapResponse[]>>(
        '/maps/my-maps',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.data.success || !response.data.data) {
        return [];
      }

      return response.data.data.map(mapData => mapResponseToGeneratedMap(mapData, undefined));
    } catch (error) {
      logger.error('Failed to get user maps', { component: 'ApiService', operation: 'getUserMaps' }, { error });
      return [];
    }
  },

  async checkHealth(): Promise<string> {
    try {
      const response = await apiClient.get<ApiResponse<string>>('/maps/health');
      return response.data.data || 'OK';
    } catch (error) {
      throw new Error(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      const response = await apiClient.post<ApiResponse<{
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
      }>>('/maps/seeds/validate', { seed });

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