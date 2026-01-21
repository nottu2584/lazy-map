import { X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface MapErrorProps {
  error: string | null;
  onClear: () => void;
}

export function MapError({ error, onClear }: MapErrorProps) {
  if (!error) return null;

  return (
    <Alert variant="destructive" className="mt-4">
      <div className="flex items-center justify-between">
        <AlertDescription>{error}</AlertDescription>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClear}
          className="ml-3 h-6 w-6 hover:bg-destructive/20"
          aria-label="Close error"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}
