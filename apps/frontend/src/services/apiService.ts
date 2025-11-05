import axios from 'axios';
import type { ApiResponse } from '@lazy-map/application';
import type { MapSettings, GeneratedMap } from '../components/MapGenerator';

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
  name?: string;
  width?: number;
  height?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  seed?: string | number;
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
  return {
    name: settings.name,
    width: settings.width,
    height: settings.height,
    seed: settings.seed || Math.floor(Math.random() * 1000000),
  };
}

// Convert backend response to frontend format
function mapResponseToGeneratedMap(response: TacticalMapResponse): GeneratedMap {
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
    tiles,
  };
}

export const apiService = {
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

      return mapResponseToGeneratedMap(response.data.data);
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

  async getMap(_id: string): Promise<GeneratedMap> {
    // Map retrieval not yet implemented - would require database storage
    throw new Error('Map persistence not yet implemented. Maps are generated on-demand.');
  },

  async getUserMaps(): Promise<GeneratedMap[]> {
    // User map history not yet implemented - would require database storage
    return [];
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