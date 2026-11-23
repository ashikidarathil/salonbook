import { useEffect, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { bookableDates, todayString } from '@/features/slot/slotBoard';

interface SlotWeekStripProps {
  value: string;
  onChange: (date: string) => void;
}

/** A swipeable row of the bookable days. */
export function SlotWeekStrip({ value, onChange }: SlotWeekStripProps) {
  const row = useRef<HTMLDivElement>(null);
  const today = todayString();

  useEffect(() => {
    const container = row.current;
    const selected = container?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!container || !selected) return;
    container.scrollTo({
      left: selected.offsetLeft - (container.clientWidth - selected.offsetWidth) / 2,
      behavior: 'smooth',
    });
  }, [value]);

  return (
    <div
      ref={row}
      className="relative flex snap-x gap-2 overflow-x-auto pb-1 [scrollbar-width:none]"
      role="group"
      aria-label="Choose a day"
    >
      {bookableDates().map((date) => {
        const day = parseISO(date);
        return (
          <button
            key={date}
            type="button"
            aria-pressed={value === date}
            aria-label={format(day, 'EEEE, d MMMM')}
            onClick={() => onChange(date)}
            className={cn(
              'flex h-[72px] w-14 shrink-0 snap-center flex-col items-center justify-center rounded-2xl border text-center transition-colors',
              value === date
                ? 'border-primary bg-primary text-primary-foreground'
                : 'bg-white hover:bg-muted',
            )}
          >
            <span className="text-[11px] font-medium opacity-80">
              {date === today ? 'Today' : format(day, 'EEE')}
            </span>
            <span className="text-lg font-bold leading-6">{format(day, 'd')}</span>
            <span className="text-[10px] opacity-70">{format(day, 'MMM')}</span>
          </button>
        );
      })}
    </div>
  );
}
