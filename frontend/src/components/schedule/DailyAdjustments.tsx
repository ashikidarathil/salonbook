import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchDailyOverrides } from '@/features/schedule/schedule.thunks';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

import { Icon } from '@iconify/react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isBefore,
  startOfToday,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { useStylistBranch } from '@/features/schedule/useStylistBranch';
import { scheduleKey } from '@/features/schedule/schedule.slice';
import { ScheduleLoadState } from './ScheduleLoadState';


interface DailyAdjustmentsProps {
  stylistId?: string;
  branchId?: string;
  stylistName?: string;
}

export default function DailyAdjustments({
  stylistId: propStylistId,
  branchId: propBranchId,
  stylistName,
}: DailyAdjustmentsProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAppSelector((state) => state.auth);
  const {
    dailyOverrides,
    loadedFor,
    error: scheduleError,
  } = useAppSelector((state) => state.schedule);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const effectiveStylistId = propStylistId || user?.id;
  const lookup = useStylistBranch(
    effectiveStylistId,
    !propBranchId && !user?.branchId && user?.role === 'STYLIST',
  );
  const effectiveBranchId = propBranchId || user?.branchId || lookup.branchId;
  const key = scheduleKey(effectiveStylistId, effectiveBranchId);
  const isLoaded = !!key && loadedFor.daily === key;

  useEffect(() => {
    if (effectiveStylistId && effectiveBranchId) {
      dispatch(fetchDailyOverrides({ stylistId: effectiveStylistId, branchId: effectiveBranchId }));
    }
  }, [dispatch, effectiveStylistId, effectiveBranchId]);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const handleDateClick = (date: Date) => {
    if (isBefore(date, startOfToday())) return;
    const base = pathname.startsWith('/admin')
      ? `/admin/stylists/${propStylistId}/schedule`
      : '/stylist/schedule';
    navigate(`${base}/day/${format(date, 'yyyy-MM-dd')}`, { state: { stylistName } });
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/40 shadow-sm overflow-hidden rounded-3xl">
        <CardHeader className="pb-6 bg-muted/30 border-b border-border/40">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <CardTitle className="text-xl font-semibold flex items-center gap-2.5 text-foreground">
                <div className="size-10 rounded-2xl bg-primary/5 flex items-center justify-center">
                  <Icon
                    icon="solar:calendar-date-bold-duotone"
                    className="size-6 text-primary/80"
                  />
                </div>
                Daily Overrides
              </CardTitle>
              <CardDescription className="text-sm font-medium text-muted-foreground/50 mt-1 md:ml-12">
                Override your standard routine for specific dates like holidays.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 bg-background p-1.5 rounded-2xl border border-border/20 shadow-sm">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="h-8 w-8 rounded-xl hover:bg-muted text-muted-foreground"
              >
                <Icon icon="solar:alt-arrow-left-bold-duotone" className="size-5" />
              </Button>
              <span className="text-sm font-bold text-foreground min-w-[120px] text-center uppercase tracking-wider">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="h-8 w-8 rounded-xl hover:bg-muted text-muted-foreground"
              >
                <Icon icon="solar:alt-arrow-right-bold-duotone" className="size-5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-2 !pt-3 sm:p-6 sm:!pt-6">
          {!isLoaded ? (
            <ScheduleLoadState
              noBranch={!lookup.isLoading && !lookup.failed && !effectiveBranchId}
              failed={lookup.failed || (!!key && !!scheduleError)}
              onRetry={() => {
                if (lookup.failed) lookup.retry();
                else if (effectiveStylistId && effectiveBranchId) {
                  dispatch(fetchDailyOverrides({ stylistId: effectiveStylistId, branchId: effectiveBranchId }));
                }
              }}
            />
          ) : (
          <div className="grid grid-cols-7 gap-1 sm:gap-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="text-center text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-wider mb-4"
              >
                {day}
              </div>
            ))}
            {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square opacity-0" />
            ))}
            {days.map((date) => {
              const override = dailyOverrides.find((o) => isSameDay(new Date(o.date), date));
              const past = isBefore(date, startOfToday());
              const isTodayDate = isToday(date);

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => handleDateClick(date)}
                  disabled={past}
                  aria-label={`Adjust ${format(date, 'MMMM d')}`}
                  className={cn(
                    'min-h-[56px] min-w-0 sm:min-h-[80px] rounded-xl sm:rounded-2xl p-1 sm:p-2 transition-all group flex flex-col items-center justify-between border overflow-hidden',
                    past
                      ? 'opacity-20 cursor-not-allowed bg-muted/10 border-transparent scale-95'
                      : 'hover:border-primary/50 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5 active:scale-95',
                    isTodayDate
                      ? 'border-primary bg-primary/[0.03]'
                      : 'bg-background border-border/40',
                    override &&
                      (override.isWorkingDay
                        ? 'border-green-500/30 bg-green-500/[0.02]'
                        : 'border-destructive/30 bg-destructive/[0.02]'),
                  )}
                >
                  <div className="w-full flex flex-col items-center justify-center gap-0.5 sm:gap-1">
                    <span
                      className={cn(
                        'text-[10px] sm:text-xs font-bold tracking-tight',
                        isTodayDate
                          ? 'text-primary'
                          : past
                            ? 'text-muted-foreground'
                            : 'text-foreground',
                        override && !override.isWorkingDay && 'text-destructive',
                      )}
                    >
                      {format(date, 'd')}
                    </span>
                    {isTodayDate && (
                      <span className="text-[6px] sm:text-[8px] font-bold uppercase tracking-tighter px-1 py-0.5 rounded bg-primary text-white leading-none">
                        Today
                      </span>
                    )}
                  </div>

                  {override ? (
                    <div className="w-full flex flex-col items-center sm:items-start gap-1">
                      <div
                        className={cn(
                          'h-1 w-4 sm:h-1.5 sm:w-8 rounded-full mb-0.5 sm:mb-1',
                          override.isWorkingDay ? 'bg-green-400' : 'bg-destructive/60',
                        )}
                      />
                      <span
                        className={cn(
                          'text-[7px] sm:text-[9px] font-semibold truncate w-full text-center sm:text-left uppercase tracking-tighter opacity-70',
                          override.isWorkingDay ? 'text-green-700' : 'text-destructive',
                        )}
                      >
                        {override.isWorkingDay ? override.shifts[0]?.startTime || 'Shift' : 'Off'}
                      </span>
                    </div>
                  ) : (
                    <div className="h-5 w-full flex items-end">
                      {!past && (
                        <div className="h-1 w-4 rounded-full bg-border/20 group-hover:bg-primary/20 transition-colors" />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
