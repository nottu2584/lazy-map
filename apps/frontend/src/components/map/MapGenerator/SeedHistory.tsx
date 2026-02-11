import { useState, useEffect } from 'react';
import { ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { SeedHistoryEntry } from '../../../types';
import { seedHistoryService } from '../../../services';

interface SeedHistoryProps {
  onApplySeed: (entry: SeedHistoryEntry) => void;
}

export function SeedHistory({ onApplySeed }: SeedHistoryProps) {
  const [seedHistory, setSeedHistory] = useState<SeedHistoryEntry[]>([]);
  const [showSeedHistory, setShowSeedHistory] = useState(false);

  useEffect(() => {
    setSeedHistory(seedHistoryService.getRecentSeeds(10));
  }, []);

  const removeSeedFromHistory = (id: string) => {
    seedHistoryService.removeEntry(id);
    setSeedHistory(seedHistoryService.getRecentSeeds(10));
  };

  const clearAllHistory = () => {
    seedHistoryService.clearHistory();
    setSeedHistory([]);
  };

  if (seedHistory.length === 0) {
    return null;
  }

  return (
    <div className="mt-3">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setShowSeedHistory(!showSeedHistory)}
        className="flex items-center"
      >
        <ChevronRight
          className={`transform transition-transform ${showSeedHistory ? 'rotate-90' : ''}`}
        />
        Recent Seeds ({seedHistory.length})
      </Button>

      {showSeedHistory && (
        <div className="mt-2 bg-muted rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
          {seedHistory.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between bg-background rounded-lg px-3 py-2 shadow-sm"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onApplySeed(entry);
                      setShowSeedHistory(false);
                    }}
                    className="flex-1 justify-start min-w-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {entry.mapName}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        Seed:{' '}
                        {typeof entry.seed === 'string'
                          ? `"${entry.seed}"`
                          : entry.seed}
                        {entry.metadata?.dimensions &&
                          ` • ${entry.metadata.dimensions.width}×${entry.metadata.dimensions.height}`}
                      </p>
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p className="font-medium">{entry.mapName}</p>
                  <p className="text-sm">
                    Seed: {typeof entry.seed === 'string' ? `"${entry.seed}"` : entry.seed}
                    {entry.metadata?.dimensions &&
                      ` • ${entry.metadata.dimensions.width}×${entry.metadata.dimensions.height}`}
                  </p>
                </TooltipContent>
              </Tooltip>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeSeedFromHistory(entry.id)}
                className="ml-2 flex-shrink-0"
                aria-label="Remove from history"
              >
                <X />
              </Button>
            </div>
          ))}
          {seedHistory.length > 5 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearAllHistory}
              className="w-full border-t"
            >
              Clear All History
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
