import { Slider } from '@/components/ui/slider';
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldGroup,
} from '@/components/ui/field';
import { TooltipHelp } from '@/components/ui/TooltipHelp';
import type { AdvancedMapSettings } from '@/types';

interface VegetationDensityControlProps {
  settings?: AdvancedMapSettings;
  onChange: (settings: AdvancedMapSettings) => void;
}

export function VegetationDensityControl({ settings = {}, onChange }: VegetationDensityControlProps) {
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

  // Get density label
  const getDensityLabel = (value: number): string => {
    if (value === 0) return 'None (Desert)';
    if (value < 0.5) return 'Sparse';
    if (value < 1.0) return 'Light';
    if (value === 1.0) return 'Normal';
    if (value < 1.5) return 'Dense';
    if (value < 2.0) return 'Very Dense';
    return 'Maximum (Jungle)';
  };

  // Get description
  const getDescription = (value: number): string => {
    if (value === 0) return 'No vegetation - bare ground, desert conditions';
    if (value < 0.5) return '~20% forest coverage, scattered trees 30-50ft apart';
    if (value < 1.0) return '~30% forest coverage, trees 20-30ft apart';
    if (value === 1.0) return '~40% forest coverage, trees 15-20ft apart (realistic)';
    if (value < 1.5) return '~50% forest coverage, trees 12-15ft apart';
    if (value < 2.0) return '~70% forest coverage, trees 10-12ft apart, heavy understory';
    return '~80% forest coverage, trees 8-10ft apart, dense undergrowth';
  };

  return (
    <FieldGroup>
      <Field>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FieldLabel className="text-base font-medium mb-0">Vegetation Density</FieldLabel>
            <TooltipHelp content="Controls forest coverage and tree density. Based on real forestry metrics (basal area)." />
          </div>
          {density !== 1.0 && (
            <button
              type="button"
              onClick={handleReset}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Reset to Normal
            </button>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {getDensityLabel(density)}
            </span>
            <span className="text-sm font-mono text-muted-foreground">
              {density.toFixed(1)}x
            </span>
          </div>

          <Slider
            value={[density]}
            onValueChange={handleDensityChange}
            min={0}
            max={2}
            step={0.1}
            className="w-full"
          />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>None</span>
            <span>Normal</span>
            <span>Maximum</span>
          </div>

          <FieldDescription className="leading-relaxed">
            {getDescription(density)}
          </FieldDescription>
        </div>

        <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground mt-4">
          <p className="font-medium mb-1">How it works:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Controls both forest extent (% of map) and density (trees per area)</li>
            <li>Uses realistic forestry metrics (basal area in ft²/acre)</li>
            <li>1.0x = normal forest (~100 ft²/acre, trees 15-20ft apart)</li>
            <li>Trees placed probabilistically for natural distribution</li>
          </ul>
        </div>
      </Field>
    </FieldGroup>
  );
}
