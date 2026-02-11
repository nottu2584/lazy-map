import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { GeneratedMap } from '@/types';

interface MapHistoryListProps {
  maps: GeneratedMap[];
  selectedMapId: string | null;
  onSelectMap: (map: GeneratedMap) => void;
  onLoadMap: (map: GeneratedMap) => void;
  isLoading?: boolean;
}

export function MapHistoryList({
  maps,
  selectedMapId,
  onSelectMap,
  onLoadMap,
  isLoading,
}: MapHistoryListProps) {
  if (isLoading) {
    return (
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
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Your Map History ({maps.length})</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="divide-y max-h-96 overflow-y-auto">
          {maps.map((map) => (
            <li
              key={map.id}
              className={`py-4 hover:bg-muted/50 cursor-pointer transition-colors px-4 rounded ${
                selectedMapId === map.id ? 'bg-muted' : ''
              }`}
              onClick={() => onSelectMap(map)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3>{map.name}</h3>
                  <div className="mt-2 space-y-1">
                    {map.seed && (
                      <p className="text-sm text-muted-foreground">
                        Seed:{' '}
                        <code className="bg-muted px-1 rounded">{map.seed}</code>
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
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
                      onLoadMap(map);
                    }}
                  >
                    Load
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
