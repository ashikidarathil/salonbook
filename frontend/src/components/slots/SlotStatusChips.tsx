import { cn } from '@/lib/utils';
import { SLOT_FILTERS } from '@/features/slot/slotBoard';
import type { SlotFilter } from '@/features/slot/slotBoard';

interface SlotStatusChipsProps {
  value: SlotFilter;
  counts: Record<SlotFilter, number>;
  onChange: (value: SlotFilter) => void;
}

/** A summary of the day that also filters it. */
export function SlotStatusChips({ value, counts, onChange }: SlotStatusChipsProps) {
  return (
    <div
      className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap"
      role="group"
      aria-label="Filter by status"
    >
      {SLOT_FILTERS.map((item) => (
        <button
          key={item.value}
          type="button"
          aria-pressed={value === item.value}
          onClick={() => onChange(item.value)}
          className={cn(
            'flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-semibold transition-colors sm:px-3',
            value === item.value
              ? 'border-primary bg-primary text-primary-foreground'
              : 'bg-white text-foreground hover:bg-muted',
          )}
        >
          <span className="truncate">{item.label}</span>
          <span className={value === item.value ? 'opacity-90' : 'text-muted-foreground'}>
            {counts[item.value]}
          </span>
        </button>
      ))}
    </div>
  );
}
