import { Info } from 'lucide-react';
import type { ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

export interface TooltipHelpProps {
  content: string;
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function TooltipHelp({ content, children, side = 'top' }: TooltipHelpProps) {
  return (
    <div className="flex items-center gap-2">
      {children}
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
        </TooltipTrigger>
        <TooltipContent side={side}>
          <p className="text-sm max-w-xs text-inherit">{content}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
