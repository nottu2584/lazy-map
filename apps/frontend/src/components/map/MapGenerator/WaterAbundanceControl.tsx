import { SliderControl } from './SliderControl';
import type { AdvancedMapSettings } from '@/types';

interface WaterAbundanceControlProps {
  settings?: AdvancedMapSettings;
  onChange: (settings: AdvancedMapSettings) => void;
}

function getAbundanceLabel(value: number): string {
  if (value < 0.7) return 'Very Dry';
  if (value < 0.9) return 'Dry';
  if (value < 1.1) return 'Moderate';
  if (value < 1.3) return 'Wet';
  if (value < 1.7) return 'Very Wet';
  return 'Waterlogged';
}

export function WaterAbundanceControl({ settings = {}, onChange }: WaterAbundanceControlProps) {
  const abundance = settings.waterAbundance ?? 1.0;

  const handleAbundanceChange = (value: number) => {
    onChange({
      ...settings,
      waterAbundance: value,
    });
  };

  const handleReset = () => {
    onChange({
      ...settings,
      waterAbundance: 1.0,
    });
  };

  return (
    <SliderControl
      label="Water Abundance"
      tooltip="Controls frequency of streams, springs, and pools"
      value={abundance}
      defaultValue={1.0}
      min={0.5}
      max={2.0}
      step={0.1}
      onChange={handleAbundanceChange}
      onReset={handleReset}
      getLabelText={getAbundanceLabel}
      minLabel="Dry"
      centerLabel="Moderate"
      maxLabel="Waterlogged"
    />
  );
}
