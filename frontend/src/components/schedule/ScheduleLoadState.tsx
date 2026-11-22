import { Loader } from '@/components/common/Loader';
import { Button } from '@/components/ui/button';

interface ScheduleLoadStateProps {
  noBranch?: boolean;
  failed?: boolean;
  onRetry?: () => void;
}

/** Shown in place of schedule data until the real data has arrived. */
export function ScheduleLoadState({ noBranch, failed, onRetry }: ScheduleLoadStateProps) {
  if (failed) {
    return (
      <div role="alert" className="space-y-3 p-10 text-center">
        <p className="text-sm text-muted-foreground">Could not load the schedule.</p>
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      </div>
    );
  }
  if (noBranch) {
    return (
      <p className="p-10 text-center text-sm text-muted-foreground">
        A branch must be assigned before the schedule can be managed.
      </p>
    );
  }
  return (
    <div className="flex flex-col items-center gap-3 p-12 text-sm text-muted-foreground">
      <Loader label="Loading schedule" />
    </div>
  );
}
