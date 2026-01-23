import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services';
import type { GeneratedMap, MapSettings } from '@/types';

// Query keys for consistency
export const mapKeys = {
  all: ['maps'] as const,
  lists: () => [...mapKeys.all, 'list'] as const,
  list: (userId?: string) => [...mapKeys.lists(), userId] as const,
  details: () => [...mapKeys.all, 'detail'] as const,
  detail: (id: string) => [...mapKeys.details(), id] as const,
};

/**
 * Hook to fetch user's map history
 */
export function useUserMaps() {
  return useQuery({
    queryKey: mapKeys.lists(),
    queryFn: () => apiService.getUserMaps(),
    staleTime: 1000 * 60 * 2, // 2 minutes - fairly dynamic data
  });
}

/**
 * Hook to fetch a specific map by ID
 */
export function useMap(mapId: string | undefined) {
  return useQuery({
    queryKey: mapKeys.detail(mapId || ''),
    queryFn: () => {
      if (!mapId) throw new Error('Map ID is required');
      return apiService.getMap(mapId);
    },
    enabled: !!mapId, // Only run if mapId exists
    staleTime: 1000 * 60 * 10, // 10 minutes - maps don't change once created
  });
}

/**
 * Hook to generate a new map
 */
export function useGenerateMap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: MapSettings) => apiService.generateMap(settings),
    onSuccess: () => {
      // Invalidate user maps list so it refetches
      queryClient.invalidateQueries({ queryKey: mapKeys.lists() });
    },
  });
}

/**
 * Hook to save a map
 */
export function useSaveMap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      map,
      name,
      description,
    }: {
      map: GeneratedMap;
      name?: string;
      description?: string;
    }) => apiService.saveMap(map, name, description),
    onSuccess: () => {
      // Invalidate user maps list to show the new saved map
      queryClient.invalidateQueries({ queryKey: mapKeys.lists() });
    },
  });
}

/**
 * Hook to validate a seed
 */
export function useValidateSeed(seed: string | number | undefined) {
  return useQuery({
    queryKey: ['seed', 'validate', seed],
    queryFn: () => {
      if (!seed) throw new Error('Seed is required');
      return apiService.validateSeed(seed);
    },
    enabled: !!seed && String(seed).trim().length > 0,
    staleTime: 1000 * 60 * 60, // 1 hour - validation results don't change
  });
}
