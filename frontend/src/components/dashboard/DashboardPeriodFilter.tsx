import { Icon } from '@iconify/react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PERIODS } from './dashboard.utils';

interface DashboardPeriodFilterProps {
  /** today, week, month, year, or custom for one chosen day */
  period: string;
  date?: Date;
  onPeriodChange: (period: string) => void;
  onDateChange: (date: Date | undefined) => void;
  /** Where Clear Selection goes back to */
  defaultPeriod: string;
}

/** Today / Week / Month / Year tabs plus a specific day. */
export function DashboardPeriodFilter({
  period,
  date,
  onPeriodChange,
  onDateChange,
  defaultPeriod,
}: DashboardPeriodFilterProps) {
  return (
    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center xl:w-auto xl:shrink-0">
      <div className="flex w-full min-w-0 items-center rounded-xl border border-border/30 bg-muted/40 p-1 sm:flex-1 xl:w-auto xl:flex-none">
        <Tabs
          value={period !== 'custom' ? period : ''}
          onValueChange={onPeriodChange}
          className="w-full"
        >
          <TabsList className="grid h-9 w-full grid-cols-4 gap-1 bg-transparent">
            {PERIODS.map((item) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                className="min-w-0 rounded-lg px-1 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm xl:px-4"
              >
                <Icon icon={item.icon} className="mr-2 hidden size-4 xl:block" />
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`h-10 w-full shrink-0 rounded-xl border-border/30 bg-muted/40 px-4 text-sm font-medium shadow-sm transition-all hover:bg-white sm:w-auto ${period === 'custom' ? 'border-primary bg-white text-primary' : ''}`}
          >
            <Icon icon="solar:calendar-add-bold-duotone" className="mr-2 size-4" />
            {period === 'custom' && date ? format(date, 'PPP') : 'Specific Date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto rounded-xl p-0" align="end">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(next) => {
              onDateChange(next);
              if (next) onPeriodChange('custom');
            }}
            initialFocus
            className="rounded-xl"
          />
          <div className="border-t border-border/40 bg-muted/10 p-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-full rounded-lg text-xs font-medium transition-colors hover:bg-white hover:text-primary"
              onClick={() => {
                onDateChange(new Date());
                onPeriodChange(defaultPeriod);
              }}
            >
              Clear Selection
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
