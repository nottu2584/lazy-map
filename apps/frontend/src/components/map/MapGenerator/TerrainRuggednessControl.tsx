import { Slider } from '@/components/ui/slider';
import { Field, FieldLabel, FieldGroup } from '@/components/ui/field';
import { TooltipHelp } from '@/components/ui/TooltipHelp';
import { Button } from '@/components/ui/button';
import type { AdvancedMapSettings } from '@/types';

interface TerrainRuggednessControlProps {
  settings?: AdvancedMapSettings;
  onChange: (settings: AdvancedMapSettings) => void;
}

export function TerrainRuggednessControl({
  settings = {},
  onChange,
}: TerrainRuggednessControlProps) {
  const ruggedness = settings.terrainRuggedness ?? 1.0;

  const handleRuggednessChange = (value: number[]) => {
    onChange({
      ...settings,
      terrainRuggedness: value[0],
    });
  };

  const handleReset = () => {
    onChange({
      ...settings,
      terrainRuggedness: 1.0,
    });
  };

  const getRuggednessLabel = (value: number): string => {
    if (value < 0.7) return 'Very Smooth';
    if (value < 0.9) return 'Smooth';
    if (value < 1.1) return 'Normal';
    if (value < 1.3) return 'Rugged';
    if (value < 1.7) return 'Very Rugged';
    return 'Extreme';
  };

  return (
    <FieldGroup>
      <Field>
        <div className="flex items-center justify-between mb-2">
          <TooltipHelp content="Controls terrain detail and elevation variance">
            <FieldLabel className="text-sm font-medium mb-0">Terrain Ruggedness</FieldLabel>
          </TooltipHelp>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">
              {getRuggednessLabel(ruggedness)}
            </span>
            <span className="text-sm font-mono text-muted-foreground">
              {ruggedness.toFixed(1)}x
            </span>
            {ruggedness !== 1.0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-auto py-0 px-2 text-xs"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        <Slider
          value={[ruggedness]}
          onValueChange={handleRuggednessChange}
          min={0.5}
          max={2.0}
          step={0.1}
          className="w-full"
        />

        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Smooth</span>
          <span>Normal</span>
          <span>Extreme</span>
        </div>
      </Field>
    </FieldGroup>
  );
}
