import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from '@/components/ui/field';
import { useSeedValidation } from '@/hooks';

interface MapSeedInputProps {
  seed: string | undefined;
  onSeedChange: (seed: string) => void;
}

export function MapSeedInput({ seed, onSeedChange }: MapSeedInputProps) {
  const validation = useSeedValidation(seed);

  return (
    <Field data-invalid={!validation.valid && !validation.isValidating}>
      <FieldLabel htmlFor="map-seed">Seed (optional)</FieldLabel>
      <div className="relative">
        <Input
          id="map-seed"
          type="text"
          value={seed || ''}
          onChange={(e) => onSeedChange(e.target.value)}
          placeholder="Leave empty for random"
          aria-invalid={!validation.valid && !validation.isValidating}
          className={
            validation.isValidating
              ? 'border-warning focus-visible:ring-warning'
              : validation.valid
                ? ''
                : 'border-destructive focus-visible:ring-destructive'
          }
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          {validation.isValidating && (
            <Loader2 className="h-4 w-4 text-warning animate-spin" />
          )}
          {!validation.isValidating && !validation.valid && (
            <XCircle className="h-4 w-4 text-destructive" />
          )}
          {!validation.isValidating && validation.valid && seed && (
            <CheckCircle2 className="h-4 w-4 text-success" />
          )}
        </div>
      </div>

      {validation.error && <FieldError>{validation.error}</FieldError>}

      {validation.warnings && validation.warnings.length > 0 && (
        <div className="space-y-1">
          {validation.warnings.map((warning, index) => (
            <p key={index} className="text-sm text-warning">
              {warning}
            </p>
          ))}
        </div>
      )}

      {validation.normalizedSeed && (
        <FieldDescription>
          Normalized seed: {validation.normalizedSeed}
        </FieldDescription>
      )}
    </Field>
  );
}
