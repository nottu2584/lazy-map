import { Slider } from '@/components/ui/slider';
import { Field, FieldLabel, FieldGroup } from '@/components/ui/field';
import { TooltipHelp } from '@/components/ui/TooltipHelp';
import { Button } from '@/components/ui/button';
import type { AdvancedMapSettings } from '@/types';

interface VegetationDensityControlProps {
  settings?: AdvancedMapSettings;
  onChange: (settings: AdvancedMapSettings) => void;
}

export function VegetationDensityControl({
  settings = {},
  onChange,
}: VegetationDensityControlProps) {
  const density = settings.vegetationMultiplier ?? 1.0;

  const handleDensityChange = (value: number[]) => {
    onChange({
      ...settings,
      vegetationMultiplier: value[0],
    });
  };

  const handleReset = () => {
    onChange({
      ...settings,
      vegetationMultiplier: 1.0,
    });
  };

  const getDensityLabel = (value: number): string => {
    if (value === 0) return 'None';
    if (value < 0.5) return 'Sparse';
    if (value < 1.0) return 'Light';
    if (value === 1.0) return 'Normal';
    if (value < 1.5) return 'Dense';
    if (value < 2.0) return 'Very Dense';
    return 'Maximum';
  };

  return (
    <FieldGroup>
      <Field>
        <div className="flex items-center justify-between mb-2">
          <TooltipHelp content="Controls forest coverage and tree density">
            <FieldLabel className="text-sm font-medium mb-0">Vegetation Density</FieldLabel>
          </TooltipHelp>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">{getDensityLabel(density)}</span>
            <span className="text-sm font-mono text-muted-foreground">{density.toFixed(1)}x</span>
            {density !== 1.0 && (
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
          value={[density]}
          onValueChange={handleDensityChange}
          min={0}
          max={2}
          step={0.1}
          className="w-full"
        />

        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>None</span>
          <span>Normal</span>
          <span>Maximum</span>
        </div>
      </Field>
    </FieldGroup>
  );
}
