import { useState, useEffect } from 'react';
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

const MIN_SIZE = 10;
const MAX_SIZE = 100;

function clampSize(value: string): number {
  const numValue = parseInt(value);
  if (isNaN(numValue)) return MIN_SIZE;
  return Math.max(MIN_SIZE, Math.min(MAX_SIZE, numValue));
}

export function MapBasicSettings({
  name,
  width,
  height,
  onNameChange,
  onWidthChange,
  onHeightChange,
}: MapBasicSettingsProps) {
  const [widthInput, setWidthInput] = useState(String(width));
  const [heightInput, setHeightInput] = useState(String(height));

  // Sync internal state when props change (e.g., from presets or history)
  useEffect(() => {
    setWidthInput(String(width));
  }, [width]);

  useEffect(() => {
    setHeightInput(String(height));
  }, [height]);

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWidthInput(e.target.value);
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHeightInput(e.target.value);
  };

  const handleWidthBlur = () => {
    const clampedValue = clampSize(widthInput);
    setWidthInput(String(clampedValue));
    onWidthChange(clampedValue);
  };

  const handleHeightBlur = () => {
    const clampedValue = clampSize(heightInput);
    setHeightInput(String(clampedValue));
    onHeightChange(clampedValue);
  };

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
            min={MIN_SIZE}
            max={MAX_SIZE}
            value={widthInput}
            onChange={handleWidthChange}
            onBlur={handleWidthBlur}
          />
          <FieldDescription>10-100 tiles</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="map-height">Height</FieldLabel>
          <Input
            id="map-height"
            type="number"
            min={MIN_SIZE}
            max={MAX_SIZE}
            value={heightInput}
            onChange={handleHeightChange}
            onBlur={handleHeightBlur}
          />
          <FieldDescription>10-100 tiles</FieldDescription>
        </Field>
      </div>
    </FieldGroup>
  );
}
