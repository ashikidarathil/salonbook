import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { lastBookableDate, shiftDate, todayString } from '@/features/slot/slotBoard';

interface SlotDatePickerProps {
  value: string;
  onChange: (date: string) => void;
}

/** Date filter with Today, Tomorrow and previous/next day. */
export function SlotDatePicker({ value, onChange }: SlotDatePickerProps) {
  const today = todayString();
  const tomorrow = shiftDate(today, 1);
  const last = lastBookableDate();
  const quick = [
    { label: 'Today', date: today },
    { label: 'Tomorrow', date: tomorrow },
  ];

  return (
    <div className="grid min-w-0 gap-2 sm:grid-cols-[auto_minmax(0,1fr)]">
      <div className="grid grid-cols-2 gap-1 rounded-xl border bg-muted/40 p-1">
        {quick.map((item) => (
          <button
            key={item.label}
            type="button"
            aria-pressed={value === item.date}
            onClick={() => onChange(item.date)}
            className={cn(
              'h-8 rounded-lg px-3 text-xs font-semibold transition-colors',
              value === item.date ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="flex min-w-0 items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 shrink-0"
          aria-label="Previous day"
          disabled={value <= today}
          onClick={() => onChange(shiftDate(value, -1))}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Input
          type="date"
          aria-label="Date"
          className="h-10 min-w-0 flex-1"
          min={today}
          max={last}
          value={value}
          onChange={(event) => event.target.value && onChange(event.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 shrink-0"
          aria-label="Next day"
          disabled={value >= last}
          onClick={() => onChange(shiftDate(value, 1))}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
