import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Button } from '@/components/ui/button';
import { History, X } from 'lucide-react';
import type { SeedHistoryEntry } from '@/types';
import { seedHistoryService } from '@/services';

interface SeedHistorySheetProps {
  onApplySeed: (entry: SeedHistoryEntry) => void;
}

export function SeedHistorySheet({ onApplySeed }: SeedHistorySheetProps) {
  const [seedHistory, setSeedHistory] = useState<SeedHistoryEntry[]>([]);

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

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="secondary" size="sm" className="gap-2">
          <History className="h-4 w-4" />
          Recent Seeds
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Recent Seeds</SheetTitle>
          {seedHistory.length > 0 && (
            <SheetDescription>Click on a row to apply the seed to the form</SheetDescription>
          )}
        </SheetHeader>

        <div className="py-6">
          {seedHistory.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <History className="size-6" />
                </EmptyMedia>
                <EmptyTitle>No seed history</EmptyTitle>
                <EmptyDescription>
                  Generate maps to save seeds to your history. Your recent seeds will appear here
                  for quick access.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Map Name</TableHead>
                  <TableHead>Seed</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seedHistory.map((entry) => (
                  <TableRow
                    key={entry.id}
                    className="cursor-pointer"
                    onClick={() => onApplySeed(entry)}
                  >
                    <TableCell className="font-medium">{entry.mapName}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {typeof entry.seed === 'string' ? `"${entry.seed}"` : entry.seed}
                    </TableCell>
                    <TableCell className="text-sm">
                      {entry.metadata?.dimensions
                        ? `${entry.metadata.dimensions.width}×${entry.metadata.dimensions.height}`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSeedFromHistory(entry.id);
                        }}
                        aria-label="Remove from history"
                      >
                        <X />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {seedHistory.length > 0 && (
          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={clearAllHistory}
              className="w-full"
            >
              Clear All History
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
