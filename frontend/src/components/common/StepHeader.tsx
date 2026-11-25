import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';

export interface StepInfo {
  label: string;
  /** Shown instead of the label once the step is done, e.g. the chosen date. */
  value?: string;
}

interface StepHeaderProps {
  steps: StepInfo[];
  /** 1-based number of the step on screen. */
  current: number;
  /** Finished steps are buttons that jump back to them. */
  onSelect: (step: number) => void;
  className?: string;
}

/** Numbered step bar: finished steps get a tick and can be tapped to go back. */
export function StepHeader({ steps, current, onSelect, className }: StepHeaderProps) {
  return (
    <ol
      className={cn('grid border-b bg-muted/30', className)}
      style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
    >
      {steps.map((item, index) => {
        const n = index + 1;
        const done = n < current;
        const isCurrent = n === current;
        return (
          <li key={item.label} className="min-w-0">
            <button
              type="button"
              disabled={!done}
              aria-current={isCurrent ? 'step' : undefined}
              onClick={() => onSelect(n)}
              className={cn(
                'flex w-full min-w-0 items-center gap-2 border-b-2 px-2 py-3 text-left transition-colors sm:px-4',
                isCurrent
                  ? 'border-primary bg-white'
                  : done
                    ? 'border-transparent hover:bg-white/60'
                    : 'border-transparent opacity-60',
              )}
            >
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold sm:size-8',
                  done || isCurrent
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {done ? <Icon icon="solar:check-read-linear" className="size-4" /> : n}
              </span>
              <span className="min-w-0">
                <span className="block text-xs text-muted-foreground">Step {n}</span>
                <span className="block truncate text-sm font-semibold">
                  {done && item.value ? item.value : item.label}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
