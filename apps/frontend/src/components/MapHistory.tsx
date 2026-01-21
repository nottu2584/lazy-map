import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserMaps } from '@/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import type { GeneratedMap } from '@/types';

interface MapHistoryProps {
  onLoadMap?: (seed: string, name: string) => void;
}

export function MapHistory({ onLoadMap }: MapHistoryProps) {
  const { user } = useAuth();
  const { data: maps = [], isLoading, error } = useUserMaps();
  const [selectedMap, setSelectedMap] = useState<GeneratedMap | null>(null);

  const handleLoadMap = (map: GeneratedMap) => {
    if (onLoadMap && map.seed) {
      onLoadMap(String(map.seed), map.name);
    }
  };

  // Not logged in
  if (!user) {
    return (
      <div className="text-center py-12">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <svg
              className="w-16 h-16 text-muted-foreground mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <h3 className="text-lg font-medium mb-2">
              Sign in to view your map history
            </h3>
            <p className="text-muted-foreground">
              Your generated maps will be saved here when you're logged in.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="divide-y space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="py-4 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
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
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load map history: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Empty state
  if (maps.length === 0) {
    return (
      <div className="text-center py-12">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <svg
              className="w-16 h-16 text-muted-foreground mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            <h3 className="text-lg font-medium mb-2">No maps generated yet</h3>
            <p className="text-muted-foreground">
              Start generating maps and they'll appear here!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* History List */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Your Map History ({maps.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y max-h-96 overflow-y-auto">
              {maps.map((map) => (
                <div
                  key={map.id}
                  className={`py-4 hover:bg-muted/50 cursor-pointer transition-colors px-4 rounded ${
                    selectedMap?.id === map.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => setSelectedMap(map)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium">{map.name}</h3>
                      <div className="mt-1 text-sm text-muted-foreground space-y-1">
                        {map.seed && (
                          <p>
                            Seed:{' '}
                            <code className="bg-muted px-1 rounded">
                              {map.seed}
                            </code>
                          </p>
                        )}
                        <p>
                          Size: {map.width} × {map.height}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoadMap(map);
                        }}
                      >
                        Load
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected Map Details */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Map Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedMap ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Name
                  </h3>
                  <p className="mt-1">{selectedMap.name}</p>
                </div>

                {selectedMap.seed && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Seed
                    </h3>
                    <p className="mt-1 font-mono text-sm bg-muted p-2 rounded break-all">
                      {selectedMap.seed}
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Dimensions
                  </h3>
                  <p className="mt-1">
                    {selectedMap.width} × {selectedMap.height} tiles
                  </p>
                </div>

                {selectedMap.cellSize && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Cell Size
                    </h3>
                    <p className="mt-1">{selectedMap.cellSize}ft per tile</p>
                  </div>
                )}

                {selectedMap.metadata && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Context
                    </h3>
                    <div className="mt-1 text-sm space-y-1">
                      {selectedMap.metadata.biome && (
                        <p>Biome: {selectedMap.metadata.biome}</p>
                      )}
                      {selectedMap.metadata.elevation && (
                        <p>Elevation: {selectedMap.metadata.elevation}</p>
                      )}
                      {selectedMap.metadata.development && (
                        <p>Development: {selectedMap.metadata.development}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Button
                    className="w-full"
                    onClick={() => handleLoadMap(selectedMap)}
                  >
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
      </div>
    </div>
  );
}
