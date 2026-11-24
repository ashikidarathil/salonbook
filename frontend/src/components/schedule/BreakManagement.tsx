import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchBreaks, deleteBreak } from '@/features/schedule/schedule.thunks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Icon } from '@iconify/react';
import { format, isBefore, isValid, startOfToday } from 'date-fns';

import { showSuccess, showError, showLoading, showConfirm } from '@/common/utils/swal.utils';
import { useStylistBranch } from '@/features/schedule/useStylistBranch';
import { scheduleKey } from '@/features/schedule/schedule.slice';
import { ScheduleLoadState } from './ScheduleLoadState';

interface BreakManagementProps {
  stylistId?: string;
  branchId?: string;
  stylistName?: string;
}

export default function BreakManagement({
  stylistId: propStylistId,
  branchId: propBranchId,
  stylistName,
}: BreakManagementProps) {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const {
    breaks,
    loadedFor,
    error: scheduleError,
  } = useAppSelector((state) => state.schedule);

  const effectiveStylistId = propStylistId || user?.id;
  const lookup = useStylistBranch(
    effectiveStylistId,
    !propBranchId && !user?.branchId && user?.role === 'STYLIST',
  );
  const effectiveBranchId = propBranchId || user?.branchId || lookup.branchId;
  const key = scheduleKey(effectiveStylistId, effectiveBranchId);
  const isLoaded = !!key && loadedFor.breaks === key;
  const { pathname } = useLocation();
  const newBreakHref = pathname.startsWith('/admin')
    ? `/admin/stylists/${propStylistId}/schedule/breaks/new`
    : '/stylist/schedule/breaks/new';

  useEffect(() => {
    if (effectiveStylistId && effectiveBranchId) {
      dispatch(fetchBreaks({ stylistId: effectiveStylistId, branchId: effectiveBranchId }));
    }
  }, [dispatch, effectiveStylistId, effectiveBranchId]);

  const handleDeleteBreak = async (breakId: string) => {
    const confirmed = await showConfirm(
      'Remove break?',
      'This time slot will become available for bookings again.',
      'Yes, remove',
    );

    if (confirmed) {
      showLoading('Removing break...');
      try {
        await dispatch(deleteBreak(breakId)).unwrap();
        showSuccess('Success', 'Break removed');
      } catch (error: unknown) {
        showError('Error', (error as string) || 'Failed to remove break');
      }
    }
  };

  const upcomingBreaks = breaks
    .filter((b) => {
      if (!b.date) return false;
      const d = new Date(b.date);
      return isValid(d) && !isBefore(d, startOfToday());
    })
    .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());

  return (
    <div className="space-y-6">
      <Card className="border-border/40 shadow-sm overflow-hidden rounded-3xl">
        <CardHeader className="pb-6 bg-muted/30 border-b border-border/40">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-semibold flex items-center gap-2.5 text-foreground">
                <div className="size-10 rounded-2xl bg-primary/5 flex items-center justify-center">
                  <Icon icon="solar:tea-cup-bold-duotone" className="size-6 text-primary/80" />
                </div>
                Break Management
              </CardTitle>
              <CardDescription className="text-sm font-medium text-muted-foreground/50 mt-1 md:ml-12">
                Schedule personal time or lunch breaks to block your calendar.
              </CardDescription>
            </div>
            <Button
              asChild
              className="h-10 w-full px-6 rounded-2xl bg-primary text-white font-semibold text-xs shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20 transition-all active:scale-95 md:w-auto"
            >
              <Link to={newBreakHref} state={{ stylistName }}>
                <Icon icon="solar:add-circle-bold-duotone" className="size-4 mr-2" />
                Schedule Break
              </Link>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-3 !pt-3 sm:p-6 sm:!pt-6">
          {!isLoaded ? (
            <ScheduleLoadState
              noBranch={!lookup.isLoading && !lookup.failed && !effectiveBranchId}
              failed={lookup.failed || (!!key && !!scheduleError)}
              onRetry={() => {
                if (lookup.failed) lookup.retry();
                else if (effectiveStylistId && effectiveBranchId) {
                  dispatch(fetchBreaks({ stylistId: effectiveStylistId, branchId: effectiveBranchId }));
                }
              }}
            />
          ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 2xl:grid-cols-3">
            {upcomingBreaks.length > 0 ? (
              upcomingBreaks.map((item) => (
                <div
                  key={item.id}
                  className="group relative flex flex-col p-4 sm:p-6 rounded-3xl border border-border/40 bg-background transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="size-12 rounded-2xl bg-muted/20 flex flex-col items-center justify-center border border-border/5">
                      <span className="text-[10px] font-bold text-primary/70 uppercase leading-none">
                        {item.date ? format(new Date(item.date), 'MMM') : ''}
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {item.date ? format(new Date(item.date), 'dd') : ''}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteBreak(item.id)}
                      className="size-10 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus-visible:opacity-100"
                      aria-label="Remove break"
                    >
                      <Icon icon="solar:trash-bin-trash-bold-duotone" className="size-4" />
                    </Button>
                  </div>

                  <div className="space-y-1 mb-4">
                    <h4 className="text-base font-bold text-foreground tracking-tight">
                      {item.date ? format(new Date(item.date), 'EEEE, MMMM do') : '—'}
                    </h4>
                    <p className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider leading-none">
                      Scheduled Break
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-primary/[0.02] border border-primary/5">
                      <Icon
                        icon="solar:clock-circle-bold-duotone"
                        className="size-5 text-primary/80"
                      />
                      <span className="text-sm font-bold text-primary/80 tracking-tight">
                        {item.startTime} - {item.endTime}
                      </span>
                    </div>

                    {item.description && (
                      <div className="flex items-start gap-2 px-3 py-1">
                        <div className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/40" />
                        <p className="line-clamp-2 break-words text-xs font-semibold italic text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-6 bg-muted/10 rounded-[3rem] border border-dashed border-border/40">
                <div className="size-24 rounded-[2.5rem] bg-background shadow-xl flex items-center justify-center text-muted-foreground/10 border border-border/5">
                  <Icon icon="solar:tea-cup-bold-duotone" className="size-12" />
                </div>
                <div className="space-y-2 max-w-sm px-6">
                  <h3 className="text-xl font-bold text-foreground tracking-tight">
                    Fully Available
                  </h3>
                  <p className="text-sm text-muted-foreground/50 font-medium">
                    You haven't scheduled any breaks yet. Your calendar is wide open for bookings!
                  </p>
                </div>
                <Button
                  variant="outline"
                  asChild
                  className="rounded-2xl font-semibold text-xs h-10 px-6"
                >
                  <Link to={newBreakHref} state={{ stylistName }}>
                    Quick Schedule
                  </Link>
                </Button>
              </div>
            )}
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
