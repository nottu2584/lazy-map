import { Slider } from './';
import { Label } from './';
import { TooltipHelp } from './TooltipHelp';

export interface SliderInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  showPercentage?: boolean;
  tooltip?: string;
  decimals?: number;
  disabled?: boolean;
}

export function SliderInput({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  showPercentage = false,
  tooltip,
  decimals = 2,
  disabled = false,
}: SliderInputProps) {
  const formatValue = (val: number): string => {
    if (showPercentage) {
      return `${Math.round(val * 100)}%`;
    }
    return val.toFixed(decimals);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        {tooltip ? (
          <TooltipHelp content={tooltip}>
            <Label className="text-sm font-medium text-foreground">{label}</Label>
          </TooltipHelp>
        ) : (
          <Label className="text-sm font-medium text-foreground">{label}</Label>
        )}
        <span className="text-sm font-semibold text-foreground min-w-[3rem] text-right">
          {formatValue(value)}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={(values) => onChange(values[0])}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
      />
    </div>
  );
}
