import { useCallback, useRef, useSyncExternalStore } from 'react';
import { seedHistoryService } from '@/services';
import type { SeedHistoryEntry } from '@/types';

export function useSeedHistory(limit = 10): SeedHistoryEntry[] {
  const subscribe = useCallback(
    (onStoreChange: () => void) => seedHistoryService.subscribe(onStoreChange),
    [],
  );

  const cachedVersion = useRef(-1);
  const cachedData = useRef<SeedHistoryEntry[]>([]);

  const getSnapshot = useCallback(() => {
    const version = seedHistoryService.getVersion();
    if (version !== cachedVersion.current) {
      cachedVersion.current = version;
      cachedData.current = seedHistoryService.getRecentSeeds(limit);
    }
    return cachedData.current;
  }, [limit]);

  return useSyncExternalStore(subscribe, getSnapshot);
}
