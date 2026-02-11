import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';

interface EnvironmentSheetProps {
  trigger?: React.ReactNode;
}

export function EnvironmentSheet({ trigger }: EnvironmentSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="secondary" size="sm" className="gap-2">
            <Info className="h-4 w-4" />
            Learn More
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Environment Controls</SheetTitle>
          <SheetDescription>
            Fine-tune terrain generation while maintaining deterministic results
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Terrain Ruggedness */}
          <div className="space-y-3">
            <h5 className="font-semibold">Terrain Ruggedness</h5>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Controls terrain detail and elevation variance. Affects both the complexity of terrain
              features and the height differences across the map.
            </p>

            <div className="grid grid-cols-[4.5rem,1fr] gap-x-4 gap-y-2 text-sm">
              <div className="flex items-start">
                <div className="font-mono text-sm bg-muted px-2 py-0.5 rounded">0.5-0.8</div>
              </div>
              <div className="text-muted-foreground">
                <span className="font-medium text-foreground">Gentle terrain:</span> Smooth rolling
                hills, minimal elevation changes, easy traversal for all units
              </div>

              <div className="flex items-start">
                <div className="font-mono text-sm bg-muted px-2 py-0.5 rounded">1.0</div>
              </div>
              <div className="text-muted-foreground">
                <span className="font-medium text-foreground">Normal terrain:</span> Realistic
                variation with moderate hills and valleys, balanced challenge
              </div>

              <div className="flex items-start">
                <div className="font-mono text-sm bg-muted px-2 py-0.5 rounded">1.5-2.0</div>
              </div>
              <div className="text-muted-foreground">
                <span className="font-medium text-foreground">Rugged terrain:</span> Dramatic cliffs
                and valleys, complex elevation, difficult navigation, tactical chokepoints
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-2 text-sm text-muted-foreground leading-relaxed border">
              <p className="text-sm font-medium mb-1">Technical effects:</p>
              <p className="text-sm">
                Adjusts noise octaves (2-6) and persistence (0.4-0.8) for terrain generation,
                creating more or less detailed elevation patterns
              </p>
            </div>
          </div>

          {/* Water Abundance */}
          <div className="space-y-3">
            <h5 className="font-semibold">Water Abundance</h5>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Controls frequency and density of water features including streams, springs, and
              pools.
            </p>

            <div className="grid grid-cols-[4.5rem,1fr] gap-x-4 gap-y-2 text-sm">
              <div className="flex items-start">
                <div className="font-mono text-sm bg-muted px-2 py-0.5 rounded">0.5-0.8</div>
              </div>
              <div className="text-muted-foreground">
                <span className="font-medium text-foreground">Arid:</span> Minimal water features,
                rare springs, water as tactical resource requiring careful planning
              </div>

              <div className="flex items-start">
                <div className="font-mono text-sm bg-muted px-2 py-0.5 rounded">1.0</div>
              </div>
              <div className="text-muted-foreground">
                <span className="font-medium text-foreground">Moderate:</span> Realistic water
                distribution with occasional streams and springs
              </div>

              <div className="flex items-start">
                <div className="font-mono text-sm bg-muted px-2 py-0.5 rounded">1.5-2.0</div>
              </div>
              <div className="text-muted-foreground">
                <span className="font-medium text-foreground">Abundant:</span> Dense stream
                networks, frequent springs, standing water, creates natural barriers and cover
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-2 text-sm text-muted-foreground leading-relaxed border">
              <p className="text-sm font-medium mb-1">Technical effects:</p>
              <p className="text-sm">
                Modifies stream threshold (0.5×-1.5×), spring placement (65%-95%), and pool
                formation rates to control water feature density
              </p>
            </div>
          </div>

          {/* Vegetation Density */}
          <div className="space-y-3">
            <h5 className="font-semibold">Vegetation Density</h5>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Controls forest coverage and plant density. Affects tactical cover and movement.
            </p>

            <div className="grid grid-cols-[4.5rem,1fr] gap-x-4 gap-y-2 text-sm">
              <div className="flex items-start">
                <div className="font-mono text-sm bg-muted px-2 py-0.5 rounded">0.0-0.5</div>
              </div>
              <div className="text-muted-foreground">
                <span className="font-medium text-foreground">Sparse:</span> Open terrain with
                scattered vegetation, clear sight lines, minimal cover
              </div>

              <div className="flex items-start">
                <div className="font-mono text-sm bg-muted px-2 py-0.5 rounded">1.0</div>
              </div>
              <div className="text-muted-foreground">
                <span className="font-medium text-foreground">Balanced:</span> Typical forest
                coverage with mix of open areas and wooded sections
              </div>

              <div className="flex items-start">
                <div className="font-mono text-sm bg-muted px-2 py-0.5 rounded">1.5-2.0</div>
              </div>
              <div className="text-muted-foreground">
                <span className="font-medium text-foreground">Dense:</span> Heavy forest coverage,
                limited visibility, abundant cover, difficult movement
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-2 text-sm text-muted-foreground leading-relaxed border">
              <p className="text-sm font-medium mb-1">Technical effects:</p>
              <p className="text-sm">
                Scales vegetation placement thresholds and basal area (0-30 m²/ha), affecting total
                forest coverage and tree density per tile
              </p>
            </div>
          </div>

          {/* Example Combinations */}
          <div className="space-y-3">
            <h5 className="font-semibold">Example Combinations</h5>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Try these preset combinations for different tactical scenarios:
            </p>

            <div className="space-y-3">
              <div className="rounded-lg border bg-card p-3">
                <p className="text-sm font-medium mb-1">Gentle Valley</p>
                <p className="text-sm text-muted-foreground mb-2">
                  Easy traversal, abundant resources, good for low-level encounters
                </p>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="bg-muted px-2 py-0.5 rounded">Terrain: 0.6</span>
                  <span className="bg-muted px-2 py-0.5 rounded">Water: 1.4</span>
                  <span className="bg-muted px-2 py-0.5 rounded">Vegetation: 1.6</span>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-3">
                <p className="text-sm font-medium mb-1">Mountain Pass</p>
                <p className="text-sm text-muted-foreground mb-2">
                  Challenging terrain, tactical chokepoints, resource scarcity
                </p>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="bg-muted px-2 py-0.5 rounded">Terrain: 1.8</span>
                  <span className="bg-muted px-2 py-0.5 rounded">Water: 1.3</span>
                  <span className="bg-muted px-2 py-0.5 rounded">Vegetation: 0.6</span>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-3">
                <p className="text-sm font-medium mb-1">Desert Wasteland</p>
                <p className="text-sm text-muted-foreground mb-2">
                  Sparse resources, open sight lines, water as key objective
                </p>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="bg-muted px-2 py-0.5 rounded">Terrain: 1.2</span>
                  <span className="bg-muted px-2 py-0.5 rounded">Water: 0.5</span>
                  <span className="bg-muted px-2 py-0.5 rounded">Vegetation: 0.2</span>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Note */}
          <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground leading-relaxed">
            <p className="text-sm font-medium mb-1">Deterministic Generation:</p>
            <p className="text-sm">
              All parameters maintain deterministic generation. The same seed with identical
              settings will always produce the same map. Parameters are independent and can be
              combined freely to create unique tactical scenarios.
            </p>
          </div>
        </div>

        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
