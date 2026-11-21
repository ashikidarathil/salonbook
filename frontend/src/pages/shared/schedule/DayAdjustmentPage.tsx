import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format, isBefore, isSameDay, isValid, parse, startOfToday } from 'date-fns';
import { useAppDispatch } from '@/app/hooks';
import {
  createDailyOverride,
  deleteDailyOverride,
  fetchDailyOverrides,
} from '@/features/schedule/schedule.thunks';
import type { Shift } from '@/features/schedule/schedule.types';
import { useScheduleTarget } from '@/features/schedule/useScheduleTarget';
import { showConfirm, showError, showSuccess } from '@/common/utils/swal.utils';
import { FormPage } from '@/components/common/FormPage';
import { InnerPageStatus } from '@/components/common/InnerPageStatus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const DEFAULT_SHIFT: Shift = { startTime: '09:00', endTime: '18:00' };

export default function DayAdjustmentPage() {
  const { date: dateParam = '' } = useParams<{ date: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { stylistId, branchId, isLoading, scheduleHref, parentCrumbs } = useScheduleTarget();
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [overrideId, setOverrideId] = useState<string | null>(null);
  const [isWorkingDay, setIsWorkingDay] = useState(true);
  const [shifts, setShifts] = useState<Shift[]>([DEFAULT_SHIFT]);
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [timeError, setTimeError] = useState<string>();

  const date = parse(dateParam, 'yyyy-MM-dd', new Date());
  const validDate = isValid(date) && !isBefore(date, startOfToday());
  const backTo = `${scheduleHref}?tab=daily`;
  const breadcrumbs = [
    ...parentCrumbs.slice(0, -1),
    { ...parentCrumbs[parentCrumbs.length - 1], href: backTo },
    { label: 'Adjust Day' },
  ];
  const loadKey = `${stylistId}-${branchId}-${dateParam}`;

  useEffect(() => {
    if (!stylistId || !branchId || !validDate) return;
    let active = true;
    const day = parse(dateParam, 'yyyy-MM-dd', new Date());
    dispatch(fetchDailyOverrides({ stylistId, branchId }))
      .unwrap()
      .then((overrides) => {
        if (!active) return;
        const existing = overrides.find((item) => isSameDay(new Date(item.date), day));
        if (existing) {
          setOverrideId(existing.id);
          setIsWorkingDay(existing.isWorkingDay);
          setShifts(existing.shifts.length ? existing.shifts : [DEFAULT_SHIFT]);
          setReason(existing.reason || '');
        }
        setLoadedKey(loadKey);
      })
      .catch(() => active && setLoadedKey(loadKey));
    return () => {
      active = false;
    };
  }, [dispatch, stylistId, branchId, dateParam, validDate, loadKey]);

  const changeTime = (key: keyof Shift, value: string) => {
    setTimeError(undefined);
    setShifts((current) =>
      current.map((shift, index) => (index === 0 ? { ...shift, [key]: value } : shift)),
    );
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stylistId || !branchId) return;
    if (isWorkingDay && shifts[0].startTime >= shifts[0].endTime) {
      setTimeError('End time must be after start time');
      return;
    }
    setIsSaving(true);
    try {
      await dispatch(
        createDailyOverride({
          stylistId,
          branchId,
          date: dateParam,
          isWorkingDay,
          shifts: isWorkingDay ? shifts : [],
          reason,
        }),
      ).unwrap();
      showSuccess('Success', 'Daily schedule adjusted');
      navigate(backTo);
    } catch (error) {
      showError('Error', (error as string) || 'Failed to save adjustment');
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async () => {
    if (!overrideId) return;
    const confirmed = await showConfirm(
      'Remove adjustment?',
      'This will revert the schedule to the standard weekly routine for this day.',
      'Yes, remove',
    );
    if (!confirmed) return;
    try {
      await dispatch(deleteDailyOverride(overrideId)).unwrap();
      showSuccess('Success', 'Adjustment removed');
      navigate(backTo);
    } catch (error) {
      showError('Error', (error as string) || 'Failed to remove adjustment');
    }
  };

  if (!validDate) {
    return (
      <InnerPageStatus
        title="Adjust Day"
        breadcrumbs={breadcrumbs}
        backTo={backTo}
        message="This date cannot be adjusted."
      />
    );
  }
  if (!isLoading && !branchId) {
    return (
      <InnerPageStatus
        title="Adjust Day"
        breadcrumbs={breadcrumbs}
        backTo={backTo}
        message="A branch must be assigned first."
      />
    );
  }
  if (isLoading || loadedKey !== loadKey) {
    return <InnerPageStatus title="Adjust Day" breadcrumbs={breadcrumbs} backTo={backTo} />;
  }

  return (
    <FormPage
      title="Adjust Day"
      description={format(date, 'EEEE, MMMM do, yyyy')}
      breadcrumbs={breadcrumbs}
      backTo={backTo}
      submitLabel={isSaving ? 'Saving...' : 'Update Schedule'}
      isSubmitting={isSaving}
      onSubmit={save}
    >
      <div className="flex items-center justify-between gap-3 rounded-lg border p-4">
        <div>
          <Label htmlFor="working-day">Working Day</Label>
          <p className="mt-1 text-sm text-muted-foreground">Available for bookings</p>
        </div>
        <Switch id="working-day" checked={isWorkingDay} onCheckedChange={setIsWorkingDay} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {isWorkingDay && (
          <>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="shift-start">Start Time</Label>
              <Input
                id="shift-start"
                type="time"
                value={shifts[0].startTime}
                onChange={(event) => changeTime('startTime', event.target.value)}
              />
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="shift-end">End Time</Label>
              <Input
                id="shift-end"
                type="time"
                value={shifts[0].endTime}
                onChange={(event) => changeTime('endTime', event.target.value)}
              />
              {timeError && <p className="text-sm text-red-600">{timeError}</p>}
            </div>
          </>
        )}
        <div className="min-w-0 space-y-2">
          <Label htmlFor="day-reason">Reason (optional)</Label>
          <Input
            id="day-reason"
            placeholder="e.g. Holiday, Anniversary, Extra Shift"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>
      </div>

      {overrideId && (
        <Button
          type="button"
          variant="outline"
          className="w-full text-red-600 sm:w-auto"
          onClick={remove}
        >
          Remove Adjustment
        </Button>
      )}
    </FormPage>
  );
}
