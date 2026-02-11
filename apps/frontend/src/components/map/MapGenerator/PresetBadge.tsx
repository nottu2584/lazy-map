interface PresetBadgeProps {
  value: string;
}

export function PresetBadge({ value }: PresetBadgeProps) {
  return (
    <div className="font-mono text-sm bg-muted px-1.5 py-0.5 rounded mt-0.5 min-w-[3.5rem] text-center">
      {value}
    </div>
  );
}
