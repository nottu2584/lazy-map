import type { ReactNode } from 'react';

export interface SettingsGroupProps {
  title: string;
  icon?: string;
  children: ReactNode;
  onReset?: () => void;
  showReset?: boolean;
}

export function SettingsGroup({
  title,
  icon,
  children,
  onReset,
  showReset = true,
}: SettingsGroupProps) {
  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          {icon && <span className="text-base">{icon}</span>}
          {title}
        </h4>
        {showReset && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Reset
          </button>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
