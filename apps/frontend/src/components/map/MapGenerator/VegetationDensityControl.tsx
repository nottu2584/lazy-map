import { SliderControl } from './SliderControl';
import type { AdvancedMapSettings } from '@/types';

interface VegetationDensityControlProps {
  settings?: AdvancedMapSettings;
  onChange: (settings: AdvancedMapSettings) => void;
}

function getDensityLabel(value: number): string {
  if (value === 0) return 'None';
  if (value < 0.5) return 'Sparse';
  if (value < 1.0) return 'Light';
  if (value === 1.0) return 'Normal';
  if (value < 1.5) return 'Dense';
  if (value < 2.0) return 'Very Dense';
  return 'Maximum';
}

export function VegetationDensityControl({
  settings = {},
  onChange,
}: VegetationDensityControlProps) {
  const density = settings.vegetationMultiplier ?? 1.0;

  const handleDensityChange = (value: number) => {
    onChange({
      ...settings,
      vegetationMultiplier: value,
    });
  };

  const handleReset = () => {
    onChange({
      ...settings,
      vegetationMultiplier: 1.0,
    });
  };

  return (
    <SliderControl
      label="Vegetation Density"
      tooltip="Controls forest coverage and tree density"
      value={density}
      defaultValue={1.0}
      min={0}
      max={2}
      step={0.1}
      onChange={handleDensityChange}
      onReset={handleReset}
      getLabelText={getDensityLabel}
      minLabel="None"
      centerLabel="Normal"
      maxLabel="Maximum"
    />
  );
}
