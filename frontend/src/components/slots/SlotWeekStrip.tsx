import { useEffect, useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Icon } from '@iconify/react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { lastViewDate, todayString, viewDates } from '@/features/slot/slotBoard';

interface SlotWeekStripProps {
  value: string;
  onChange: (date: string) => void;
}

/** A swipeable row of days, with a calendar to jump straight to any day. */
export function SlotWeekStrip({ value, onChange }: SlotWeekStripProps) {
  const row = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const today = todayString();
  const last = lastViewDate();

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
    <div className="flex min-w-0 items-stretch gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Pick a date"
            className="flex h-[72px] w-14 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-primary/30 bg-primary/5 text-primary transition-colors hover:bg-primary/10"
          >
            <Icon icon="solar:calendar-search-bold-duotone" className="size-6" />
            <span className="text-[11px] font-semibold">Pick</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto rounded-xl p-0" align="start" collisionPadding={8}>
          <Calendar
            mode="single"
            selected={parseISO(value)}
            defaultMonth={parseISO(value)}
            disabled={[{ before: parseISO(today) }, { after: parseISO(last) }]}
            onSelect={(next) => {
              if (!next) return;
              onChange(format(next, 'yyyy-MM-dd'));
              setOpen(false);
            }}
            initialFocus
            className="rounded-xl"
          />
        </PopoverContent>
      </Popover>

      <div
        ref={row}
        className="relative flex min-w-0 flex-1 snap-x gap-2 overflow-x-auto pb-1 [scrollbar-width:none]"
        role="group"
        aria-label="Choose a day"
      >
        {viewDates().map((date) => {
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
              <span className="text-[11px] opacity-70">{format(day, 'MMM')}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
