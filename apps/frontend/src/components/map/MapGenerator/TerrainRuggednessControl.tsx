import { SliderControl } from './SliderControl';
import type { AdvancedMapSettings } from '@/types';

interface TerrainRuggednessControlProps {
  settings?: AdvancedMapSettings;
  onChange: (settings: AdvancedMapSettings) => void;
}

function getRuggednessLabel(value: number): string {
  if (value < 0.7) return 'Very Smooth';
  if (value < 0.9) return 'Smooth';
  if (value < 1.1) return 'Normal';
  if (value < 1.3) return 'Rugged';
  if (value < 1.7) return 'Very Rugged';
  return 'Extreme';
}

export function TerrainRuggednessControl({
  settings = {},
  onChange,
}: TerrainRuggednessControlProps) {
  const ruggedness = settings.terrainRuggedness ?? 1.0;

  const handleRuggednessChange = (value: number) => {
    onChange({
      ...settings,
      terrainRuggedness: value,
    });
  };

  const handleReset = () => {
    onChange({
      ...settings,
      terrainRuggedness: 1.0,
    });
  };

  return (
    <SliderControl
      label="Terrain Ruggedness"
      tooltip="Controls terrain detail and elevation variance"
      value={ruggedness}
      defaultValue={1.0}
      min={0.5}
      max={2.0}
      step={0.1}
      onChange={handleRuggednessChange}
      onReset={handleReset}
      getLabelText={getRuggednessLabel}
      minLabel="Smooth"
      centerLabel="Normal"
      maxLabel="Extreme"
    />
  );
}
