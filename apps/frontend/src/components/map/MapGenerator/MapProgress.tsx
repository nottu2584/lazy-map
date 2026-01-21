import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MapProgressProps {
  progress: string;
}

export function MapProgress({ progress }: MapProgressProps) {
  if (!progress) return null;

  return (
    <Alert className="mt-4">
      <div className="flex items-center gap-3">
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertDescription className="text-sm">{progress}</AlertDescription>
      </div>
    </Alert>
  );
}
