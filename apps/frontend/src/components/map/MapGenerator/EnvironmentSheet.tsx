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
          <SheetTitle>Map Generation Guide</SheetTitle>
          <SheetDescription>
            Understand how context and environment controls shape your map
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Map Context */}
          <div className="space-y-3">
            <h5 className="font-semibold">Map Context</h5>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Context parameters define the map's character: what kind of terrain, water, and
              structures appear. When set to "Auto", the seed determines these values. When you
              choose a specific option, it overrides the seed for that parameter only.
            </p>

            <div className="space-y-2 text-sm">
              <div className="rounded-lg border bg-card p-3">
                <p className="font-medium mb-1">Environment</p>
                <p className="text-muted-foreground">
                  The primary environment type: forest, mountain, plains, swamp, desert, coastal, or
                  underground caves. Affects rock types, vegetation species, visibility, and overall feel.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <p className="font-medium mb-1">Elevation</p>
                <p className="text-muted-foreground">
                  Altitude zone from lowland to alpine. Controls elevation range and terrain
                  relief magnitude.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <p className="font-medium mb-1">Water</p>
                <p className="text-muted-foreground">
                  Hydrology type from arid to river/lake. Controls stream formation thresholds
                  and water feature placement.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <p className="font-medium mb-1">Development</p>
                <p className="text-muted-foreground">
                  From wilderness (no structures) to urban (dense buildings). Controls building
                  count, road networks, and bridges.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <p className="font-medium mb-1">Season</p>
                <p className="text-muted-foreground">
                  Affects vegetation appearance and water behavior. Winter reduces foliage,
                  spring increases growth.
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-2 text-sm text-muted-foreground leading-relaxed border">
              <p className="text-sm font-medium mb-1">Constraint rules:</p>
              <p className="text-sm">
                Some combinations are invalid: desert cannot have rivers or lakes, swamp must
                have wetland hydrology, coastal must have coastal hydrology. Invalid options are
                automatically disabled when you select a climate.
              </p>
            </div>
          </div>

          {/* Terrain Style & Ruggedness */}
          <div className="space-y-3">
            <h5 className="font-semibold">Terrain Style</h5>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Controls slope steepness and terrain features. Presets work with any climate - combine "Gentle" with "Mountain" for rolling foothills, or "Challenging" with "Plains" for dramatic badlands.
            </p>

            <div className="grid grid-cols-[4.5rem,1fr] gap-x-4 gap-y-2 text-sm">
              <div className="flex items-start">
                <div className="font-mono text-sm bg-muted px-2 py-0.5 rounded">0.5</div>
              </div>
              <div className="text-muted-foreground">
                <span className="font-medium text-foreground">Gentle Hills:</span> ~15° average slopes, rolling farmland, pastoral valleys. Easy traversal, suitable for all unit types.
              </div>

              <div className="flex items-start">
                <div className="font-mono text-sm bg-muted px-2 py-0.5 rounded">1.0</div>
              </div>
              <div className="text-muted-foreground">
                <span className="font-medium text-foreground">Balanced Terrain:</span> ~25° average slopes, varied features with tactical interest. Mix of gentle and challenging areas.
              </div>

              <div className="flex items-start">
                <div className="font-mono text-sm bg-muted px-2 py-0.5 rounded">1.8-2.0</div>
              </div>
              <div className="text-muted-foreground">
                <span className="font-medium text-foreground">Dramatic Cliffs:</span> ~40° average slopes, mountain faces, canyon walls. Vertical encounters, natural chokepoints, climber-friendly.
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-2 text-sm text-muted-foreground leading-relaxed border mt-3">
              <p className="text-sm">
                <span className="font-medium">Modular design:</span> Terrain style is independent of climate. "Desert + Gentle" creates rolling dunes. "Forest + Challenging" creates mountainous woods. Mix and match!
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
          </div>

          {/* Technical Note */}
          <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground leading-relaxed">
            <p className="text-sm font-medium mb-1">Deterministic generation:</p>
            <p className="text-sm">
              The same seed with identical context and environment settings always produces the
              same map. The seed controls the pseudo-random noise that shapes the terrain; the
              parameters control what kind of terrain is generated.
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
