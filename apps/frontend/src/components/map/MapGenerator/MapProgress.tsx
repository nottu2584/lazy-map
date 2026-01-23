import { Progress } from '@/components/ui/progress';

interface MapProgressProps {
  progress: string;
  value: number;
}

export function MapProgress({ progress, value }: MapProgressProps) {
  if (!progress) return null;

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{progress}</span>
        <span className="font-mono text-muted-foreground">{value}%</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );
}
