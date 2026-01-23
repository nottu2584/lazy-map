import { Slider } from './';
import { Label } from './';

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
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium text-gray-700">{label}</Label>
          {tooltip && (
            <div className="group relative">
              <svg
                className="h-4 w-4 text-gray-400 cursor-help"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                {tooltip}
              </div>
            </div>
          )}
        </div>
        <span className="text-sm font-semibold text-gray-900 min-w-[3rem] text-right">
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
