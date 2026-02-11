import { Slider } from '@/components/ui/slider';
import { Field, FieldLabel, FieldGroup } from '@/components/ui/field';
import { TooltipHelp } from '@/components/ui/TooltipHelp';
import { Button } from '@/components/ui/button';

interface SliderControlProps {
  label: string;
  tooltip: string;
  value: number;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  onReset: () => void;
  getLabelText: (value: number) => string;
  minLabel: string;
  centerLabel: string;
  maxLabel: string;
  disabled?: boolean;
}

export function SliderControl({
  label,
  tooltip,
  value,
  defaultValue,
  min,
  max,
  step,
  onChange,
  onReset,
  getLabelText,
  minLabel,
  centerLabel,
  maxLabel,
  disabled = false,
}: SliderControlProps) {
  const handleValueChange = (newValue: number[]) => {
    onChange(newValue[0]);
  };

  const hasChanged = value !== defaultValue;

  return (
    <FieldGroup>
      <Field>
        <div className="flex items-center justify-between mb-2">
          <TooltipHelp content={tooltip}>
            <FieldLabel className="text-sm font-medium mb-0">{label}</FieldLabel>
          </TooltipHelp>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">{getLabelText(value)}</span>
            <span className="text-sm font-mono text-muted-foreground">{value.toFixed(1)}x</span>
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={onReset}
              disabled={disabled || !hasChanged}
            >
              Reset
            </Button>
          </div>
        </div>

        <Slider
          value={[value]}
          onValueChange={handleValueChange}
          min={min}
          max={max}
          step={step}
          className="w-full"
          disabled={disabled}
        />

        <ul className="grid grid-cols-3 text-sm text-muted-foreground mt-1">
          <li className="text-left">{minLabel}</li>
          <li className="text-center">{centerLabel}</li>
          <li className="text-right">{maxLabel}</li>
        </ul>
      </Field>
    </FieldGroup>
  );
}
