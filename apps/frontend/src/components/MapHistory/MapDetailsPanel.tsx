import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { GeneratedMap } from '@/types';

interface MapDetailsPanelProps {
  map: GeneratedMap | null;
  onLoadMap: (map: GeneratedMap) => void;
  isLoading?: boolean;
}

export function MapDetailsPanel({ map, onLoadMap, isLoading }: MapDetailsPanelProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Map Details</CardTitle>
      </CardHeader>
      <CardContent>
        {map ? (
          <div className="space-y-4">
            <div>
              <h5 className="text-muted-foreground">Name</h5>
              <p className="mt-2">{map.name}</p>
            </div>

            {map.seed && (
              <div>
                <h5 className="text-muted-foreground">Seed</h5>
                <p className="mt-2 font-mono text-sm bg-muted p-2 rounded break-all">
                  {map.seed}
                </p>
              </div>
            )}

            <div>
              <h5 className="text-muted-foreground">Dimensions</h5>
              <p className="mt-2">
                {map.width} × {map.height} tiles
              </p>
            </div>

            {map.cellSize && (
              <div>
                <h5 className="text-muted-foreground">Cell Size</h5>
                <p className="mt-2">{map.cellSize}ft per tile</p>
              </div>
            )}

            {map.metadata && (
              <div>
                <h5 className="text-muted-foreground">Context</h5>
                <div className="mt-2 text-sm space-y-1">
                  {map.metadata.biome && (
                    <p className="text-sm">Biome: {map.metadata.biome}</p>
                  )}
                  {map.metadata.elevation && (
                    <p className="text-sm">Elevation: {map.metadata.elevation}</p>
                  )}
                  {map.metadata.development && (
                    <p className="text-sm">Development: {map.metadata.development}</p>
                  )}
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <Button className="w-full" onClick={() => onLoadMap(map)}>
                Regenerate This Map
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            Select a map from the list to view details
          </p>
        )}
      </CardContent>
    </Card>
  );
}
