import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface MapBasicSettingsProps {
  name: string;
  width: number;
  height: number;
  onNameChange: (name: string) => void;
  onWidthChange: (width: number) => void;
  onHeightChange: (height: number) => void;
}

export function MapBasicSettings({
  name,
  width,
  height,
  onNameChange,
  onWidthChange,
  onHeightChange,
}: MapBasicSettingsProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="map-name">Map Name</Label>
        <Input
          id="map-name"
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="mt-1.5"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="map-width">Width</Label>
          <Input
            id="map-width"
            type="number"
            min="10"
            max="100"
            value={width}
            onChange={(e) => onWidthChange(parseInt(e.target.value))}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="map-height">Height</Label>
          <Input
            id="map-height"
            type="number"
            min="10"
            max="100"
            value={height}
            onChange={(e) => onHeightChange(parseInt(e.target.value))}
            className="mt-1.5"
          />
        </div>
      </div>
    </div>
  );
}
