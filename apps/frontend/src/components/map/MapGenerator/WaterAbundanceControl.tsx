import { Slider } from '@/components/ui/slider';
import { Field, FieldLabel, FieldGroup } from '@/components/ui/field';
import { TooltipHelp } from '@/components/ui/TooltipHelp';
import { Button } from '@/components/ui/button';
import type { AdvancedMapSettings } from '@/types';

interface WaterAbundanceControlProps {
  settings?: AdvancedMapSettings;
  onChange: (settings: AdvancedMapSettings) => void;
}

export function WaterAbundanceControl({ settings = {}, onChange }: WaterAbundanceControlProps) {
  const abundance = settings.waterAbundance ?? 1.0;

  const handleAbundanceChange = (value: number[]) => {
    onChange({
      ...settings,
      waterAbundance: value[0],
    });
  };

  const handleReset = () => {
    onChange({
      ...settings,
      waterAbundance: 1.0,
    });
  };

  const getAbundanceLabel = (value: number): string => {
    if (value < 0.7) return 'Very Dry';
    if (value < 0.9) return 'Dry';
    if (value < 1.1) return 'Moderate';
    if (value < 1.3) return 'Wet';
    if (value < 1.7) return 'Very Wet';
    return 'Waterlogged';
  };

  return (
    <FieldGroup>
      <Field>
        <div className="flex items-center justify-between mb-2">
          <TooltipHelp content="Controls frequency of streams, springs, and pools">
            <FieldLabel className="text-sm font-medium mb-0">Water Abundance</FieldLabel>
          </TooltipHelp>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">
              {getAbundanceLabel(abundance)}
            </span>
            <span className="text-sm font-mono text-muted-foreground">{abundance.toFixed(1)}x</span>
            {abundance !== 1.0 && (
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
          value={[abundance]}
          onValueChange={handleAbundanceChange}
          min={0.5}
          max={2.0}
          step={0.1}
          className="w-full"
        />

        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Dry</span>
          <span>Moderate</span>
          <span>Waterlogged</span>
        </div>
      </Field>
    </FieldGroup>
  );
}
