import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useUserMaps } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Lock, Map } from 'lucide-react';
import type { GeneratedMap } from '@/types';
import { MapHistoryList } from './MapHistoryList';
import { MapDetailsPanel } from './MapDetailsPanel';

interface MapHistoryProps {
  onLoadMap?: (seed: string, name: string) => void;
  onOpenLogin?: () => void;
}

export function MapHistory({ onLoadMap, onOpenLogin }: MapHistoryProps) {
  const { user } = useAuth();
  const { data: maps = [], isLoading, error } = useUserMaps();
  const [selectedMap, setSelectedMap] = useState<GeneratedMap | null>(null);

  const handleLoadMap = (map: GeneratedMap) => {
    if (onLoadMap && map.seed) {
      onLoadMap(String(map.seed), map.name);
    }
  };

  // Not logged in - show sign in prompt
  if (!user) {
    return (
      <div className="text-center py-12">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Lock className="size-6" />
            </EmptyMedia>
            <EmptyTitle>Sign in to view your map history</EmptyTitle>
            <EmptyDescription>
              Your generated maps will be saved here when you're logged in.
            </EmptyDescription>
          </EmptyHeader>
          {onOpenLogin && (
            <EmptyContent>
              <Button onClick={onOpenLogin}>Sign In</Button>
            </EmptyContent>
          )}
        </Empty>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Alert variant="destructive">
          <AlertDescription>Failed to load map history: {error.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Empty state - no maps yet
  if (!isLoading && maps.length === 0) {
    return (
      <div className="text-center py-12">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Map className="size-6" />
            </EmptyMedia>
            <EmptyTitle>No maps generated yet</EmptyTitle>
            <EmptyDescription>
              Start generating maps and they'll appear here!
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* History List */}
      <div className="lg:col-span-2">
        <MapHistoryList
          maps={maps}
          selectedMapId={selectedMap?.id ?? null}
          onSelectMap={setSelectedMap}
          onLoadMap={handleLoadMap}
          isLoading={isLoading}
        />
      </div>

      {/* Selected Map Details */}
      <div className="lg:col-span-1">
        <MapDetailsPanel
          map={selectedMap}
          onLoadMap={handleLoadMap}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
