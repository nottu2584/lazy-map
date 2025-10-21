import axios from 'axios';
import type { ApiResponse } from '@lazy-map/application';
import type { MapSettings, GeneratedMap } from '../components/MapGenerator';

// API configuration from environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
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
  name: string;
  description?: string;
  width: number;
  height: number;
  cellSize: number;
  seed?: string | number;
  tags?: string[];
  author?: string;
  terrainDistribution: {
    grassland: number;
    forest: number;
    mountain: number;
    water: number;
  };
  elevationVariance?: number;
  elevationMultiplier?: number;
  addHeightNoise?: boolean;
  heightVariance?: number;
  inclinationChance?: number;
  generateRivers: boolean;
  generateRoads: boolean;
  generateBuildings: boolean;
  generateForests: boolean;
  forestSettings: {
    forestDensity: number;
    treeDensity: number;
    treeClumping: number;
    preferredSpecies?: string[];
    allowTreeOverlap?: boolean;
    enableInosculation?: boolean;
    underbrushDensity?: number;
  };
  biomeType?: string;
}

export interface MapGridResponse {
  id: string;
  name: string;
  dimensions: {
    width: number;
    height: number;
  };
  cellSize: number;
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
    heightMultiplier: number;
    primaryFeatureId?: string;
    mixedFeatureIds: string[];
  }>;
  metadata: {
    createdAt: string;
    updatedAt: string;
    author?: string;
    description?: string;
    tags: string[];
  };
}

// Convert frontend settings to backend request format
function mapSettingsToRequest(settings: MapSettings): GenerateMapRequest {
  return {
    name: settings.name,
    width: settings.width,
    height: settings.height,
    cellSize: settings.cellSize,
    seed: settings.seed || Math.floor(Math.random() * 1000000),
    terrainDistribution: settings.terrainDistribution,
    generateRivers: settings.generateRivers,
    generateRoads: settings.generateRoads,
    generateBuildings: settings.generateBuildings,
    generateForests: settings.generateForests,
    forestSettings: {
      forestDensity: settings.forestSettings.forestDensity,
      treeDensity: settings.forestSettings.treeDensity,
      treeClumping: settings.forestSettings.treeClumping,
      preferredSpecies: ['oak', 'pine'], // Default species
      allowTreeOverlap: true,
      enableInosculation: true,
      underbrushDensity: 0.4,
    },
    biomeType: 'temperate',
  };
}

// Convert backend response to frontend format
function mapResponseToGeneratedMap(response: MapGridResponse): GeneratedMap {
  const tiles = response.tiles.map(tile => ({
    x: tile.position.x,
    y: tile.position.y,
    terrain: tile.terrain.type,
    elevation: tile.heightMultiplier * 100, // Convert to 0-100 scale
    features: [
      ...(tile.primaryFeatureId ? [tile.primaryFeatureId] : []),
      ...tile.mixedFeatureIds,
    ],
  }));

  return {
    id: response.id,
    name: response.name,
    width: response.dimensions.width,
    height: response.dimensions.height,
    cellSize: response.cellSize,
    tiles,
  };
}

export const apiService = {
  async generateMap(settings: MapSettings): Promise<GeneratedMap> {
    try {
      const request = mapSettingsToRequest(settings);

      const response = await apiClient.post<ApiResponse<MapGridResponse>>(
        '/maps/generate',
        request
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to generate map');
      }

      return mapResponseToGeneratedMap(response.data.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.error) {
          throw new Error(error.response.data.error);
        }
        if (error.code === 'ECONNREFUSED') {
          throw new Error('Cannot connect to the map generation service. Please ensure the backend is running.');
        }
        if (error.code === 'ECONNABORTED') {
          throw new Error('Map generation timed out. Please try with smaller dimensions or simpler settings.');
        }
      }
      throw new Error(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  },

  async getMap(id: string): Promise<GeneratedMap> {
    try {
      const response = await apiClient.get<ApiResponse<MapGridResponse>>(`/maps/${id}`);

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Map not found');
      }

      return mapResponseToGeneratedMap(response.data.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Map not found');
        }
        if (error.response?.data?.error) {
          throw new Error(error.response.data.error);
        }
      }
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch map');
    }
  },

  async getUserMaps(): Promise<GeneratedMap[]> {
    try {
      const response = await apiClient.get<ApiResponse<MapGridResponse[]>>('/maps/my-maps');

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to fetch maps');
      }

      return response.data.data.map(mapResponseToGeneratedMap);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.error) {
          throw new Error(error.response.data.error);
        }
      }
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch user maps');
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