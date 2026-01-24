import { Input } from '@/components/ui/input';
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldGroup,
} from '@/components/ui/field';

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
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="map-name">Map Name (optional)</FieldLabel>
        <Input
          id="map-name"
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Leave empty to use seed as name"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="map-width">Width</FieldLabel>
          <Input
            id="map-width"
            type="number"
            min="10"
            max="100"
            value={width}
            onChange={(e) => onWidthChange(parseInt(e.target.value))}
          />
          <FieldDescription>10-100 tiles</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="map-height">Height</FieldLabel>
          <Input
            id="map-height"
            type="number"
            min="10"
            max="100"
            value={height}
            onChange={(e) => onHeightChange(parseInt(e.target.value))}
          />
          <FieldDescription>10-100 tiles</FieldDescription>
        </Field>
      </div>
    </FieldGroup>
  );
}
