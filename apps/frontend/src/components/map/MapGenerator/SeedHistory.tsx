import { useState, useEffect } from 'react';
import { ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { seedHistoryService, type SeedHistoryEntry } from '../../../services/seedHistoryService';

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
        className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 h-auto p-0"
      >
        <ChevronRight
          className={`h-4 w-4 transform transition-transform ${showSeedHistory ? 'rotate-90' : ''}`}
        />
        Recent Seeds ({seedHistory.length})
      </Button>

      {showSeedHistory && (
        <div className="mt-2 bg-muted rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
          {seedHistory.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between bg-background rounded px-3 py-2 shadow-sm"
            >
              <button
                type="button"
                onClick={() => {
                  onApplySeed(entry);
                  setShowSeedHistory(false);
                }}
                className="flex-1 text-left hover:text-primary group min-w-0"
              >
                <div className="text-sm font-medium group-hover:text-primary truncate">
                  {entry.mapName}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  Seed:{' '}
                  {typeof entry.seed === 'string'
                    ? `"${entry.seed}"`
                    : entry.seed}
                  {entry.metadata?.dimensions &&
                    ` • ${entry.metadata.dimensions.width}×${entry.metadata.dimensions.height}`}
                </div>
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeSeedFromHistory(entry.id)}
                className="ml-2 text-muted-foreground hover:text-destructive flex-shrink-0 h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {seedHistory.length > 5 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearAllHistory}
              className="w-full text-muted-foreground hover:text-destructive pt-2 border-t h-auto"
            >
              Clear All History
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
