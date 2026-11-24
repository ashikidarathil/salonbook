import { Loader } from '@/components/common/Loader';
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchMyOffDays, requestOffDay, deleteOffDay } from '@/features/offDay/offDay.thunks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Icon } from '@iconify/react';
import { addDays, differenceInCalendarDays, format, startOfToday } from 'date-fns';
import { OffDayStatus, OffDayType } from '@/features/offDay/offDay.types';
import { Badge } from '@/components/ui/badge';
import {
  showSuccess,
  showError,
  showLoading,
  closeLoading,
  showConfirm,
} from '@/common/utils/swal.utils';
import { cn } from '@/lib/utils';
import { OFF_DAY_MESSAGES } from '@/features/offDay/offDay.constants';

const LEAVE_TYPES = [
  { id: OffDayType.PERSONAL, label: 'Personal', icon: 'solar:user-bold' },
  { id: OffDayType.SICK_LEAVE, label: 'Sick Leave', icon: 'solar:medical-kit-bold' },
  { id: OffDayType.VACATION, label: 'Vacation', icon: 'solar:umbrella-bold' },
  { id: OffDayType.EMERGENCY, label: 'Emergency', icon: 'solar:danger-bold' },
];

const typeLabel = (type: string) =>
  LEAVE_TYPES.find((item) => item.id === type)?.label ??
  type
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const STATUS_STYLE: Record<
  OffDayStatus,
  { label: string; badge: string; icon: string; tile: string }
> = {
  [OffDayStatus.APPROVED]: {
    label: 'Approved',
    badge: 'border-green-200 bg-green-50 text-green-700',
    icon: 'solar:check-circle-bold',
    tile: 'bg-green-50 text-green-600',
  },
  [OffDayStatus.REJECTED]: {
    label: 'Rejected',
    badge: 'border-red-200 bg-red-50 text-red-700',
    icon: 'solar:close-circle-bold',
    tile: 'bg-red-50 text-red-600',
  },
  [OffDayStatus.PENDING]: {
    label: 'Pending',
    badge: 'border-amber-200 bg-amber-50 text-amber-700',
    icon: 'solar:clock-circle-bold',
    tile: 'bg-amber-50 text-amber-600',
  },
};

export default function OffDayPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { myOffDays, loading } = useAppSelector((state) => state.offDay);
  const [startDate, setStartDate] = useState<Date | undefined>(addDays(startOfToday(), 3));
  const [endDate, setEndDate] = useState<Date | undefined>(addDays(startOfToday(), 3));
  const [reason, setReason] = useState('');
  const [selectedType, setSelectedType] = useState<OffDayType>(OffDayType.PERSONAL);

  useEffect(() => {
    dispatch(fetchMyOffDays());
  }, [dispatch]);

  const handleSubmit = async () => {
    if (!startDate || !endDate || !reason) {
      showError('Required Fields', 'Please fill in all fields before submitting.');
      return;
    }

    // Validation: 3-day advance notice
    const today = startOfToday();
    const minDate = addDays(today, 3);

    if (startDate < minDate) {
      showError('Notice Period', 'Leave requests must be made at least 3 days in advance.');
      return;
    }

    if (!user?.branchId) {
      showError(
        'Branch Required',
        'Your profile is not associated with a branch. Please contact Admin.',
      );
      return;
    }

    showLoading('Submitting leave request...');
    try {
      await dispatch(
        requestOffDay({
          stylistId: user.id,
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
          reason,
          branchId: user.branchId,
          type: selectedType,
        }),
      ).unwrap();
      showSuccess('Request Submitted', OFF_DAY_MESSAGES.REQUEST_SUCCESS);
      setReason('');
      setStartDate(addDays(startOfToday(), 3));
      setEndDate(addDays(startOfToday(), 3));
      setSelectedType(OffDayType.PERSONAL);
    } catch (error: unknown) {
      closeLoading();
      showError('Submission Failed', (error as string) || OFF_DAY_MESSAGES.REQUEST_ERROR);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm(
      'Cancel Request?',
      'Are you sure you want to withdraw this leave request?',
    );

    if (!confirmed) return;

    showLoading('Cancelling request...');
    try {
      await dispatch(deleteOffDay(id)).unwrap();
      showSuccess('Cancelled', OFF_DAY_MESSAGES.DELETE_SUCCESS);
    } catch (error: unknown) {
      closeLoading();
      showError('Error', (error as string) || OFF_DAY_MESSAGES.DELETE_ERROR);
    }
  };

  const firstAllowed = addDays(startOfToday(), 3);
  const dayCount = startDate && endDate ? differenceInCalendarDays(endDate, startDate) + 1 : 0;

  const datePicker = (
    id: string,
    label: string,
    value: Date | undefined,
    onSelect: (date: Date | undefined) => void,
    earliest: Date,
  ) => (
    <div className="min-w-0 space-y-1.5">
      <label htmlFor={id} className="ml-1 text-xs font-medium text-slate-500">
        {label}
      </label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className="h-11 w-full min-w-0 justify-start rounded-xl border-slate-200 text-left font-normal hover:bg-slate-50"
          >
            <Icon icon="solar:calendar-bold" className="mr-2 size-4 shrink-0 text-slate-400" />
            <span className="truncate">
              {value ? format(value, 'EEE, d MMM yyyy') : 'Pick a date'}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto rounded-xl p-0 shadow-lg" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onSelect}
            disabled={{ before: earliest }}
            className="p-3"
          />
        </PopoverContent>
      </Popover>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="break-words text-2xl font-bold sm:text-3xl">Time Off & Leave</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Plan your breaks, holidays, or emergency leaves.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-5">
          <Card className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
            <CardHeader className="!p-4 !pb-2 sm:!px-6 sm:!pt-6">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Icon icon="solar:pen-new-square-bold" className="size-5 text-primary" />
                New Request
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 !p-4 !pt-2 sm:!px-6 sm:!pb-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {datePicker(
                  'leave-start',
                  'Start Date',
                  startDate,
                  (date) => {
                    setStartDate(date);
                    // The end can never come before the start
                    if (date && endDate && endDate < date) setEndDate(date);
                  },
                  firstAllowed,
                )}
                {datePicker(
                  'leave-end',
                  'End Date',
                  endDate,
                  setEndDate,
                  startDate || firstAllowed,
                )}
              </div>
              {dayCount > 0 && (
                <p className="-mt-2 ml-1 text-xs text-muted-foreground">
                  {dayCount} {dayCount === 1 ? 'day' : 'days'} off
                </p>
              )}

              <fieldset className="space-y-1.5">
                <legend className="ml-1 text-xs font-medium text-slate-500">Leave Type</legend>
                <div className="grid grid-cols-2 gap-2">
                  {LEAVE_TYPES.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      aria-pressed={selectedType === type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={cn(
                        'flex h-11 min-w-0 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition-all',
                        selectedType === type.id
                          ? 'border-primary/30 bg-primary/10 text-primary'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                      )}
                    >
                      <Icon
                        icon={type.icon}
                        className={cn(
                          'size-4 shrink-0',
                          selectedType === type.id ? 'text-primary' : 'text-slate-400',
                        )}
                      />
                      <span className="truncate">{type.label}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="space-y-1.5">
                <label htmlFor="leave-reason" className="ml-1 text-xs font-medium text-slate-500">
                  Reason
                </label>
                <Textarea
                  id="leave-reason"
                  rows={4}
                  placeholder="Reason for your leave..."
                  className="resize-none rounded-xl"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <Button
                className="h-12 w-full gap-2 rounded-xl text-sm font-semibold shadow-sm"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <Loader size="xs" />
                ) : (
                  <Icon icon="solar:paper-plane-bold" className="size-4" />
                )}
                Submit Request
              </Button>
            </CardContent>
          </Card>

          <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <span className="shrink-0 rounded-lg border border-slate-200 bg-white p-2 text-slate-400">
              <Icon icon="solar:info-square-bold" className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="mb-1 text-sm font-semibold text-slate-700">Notice Policy</p>
              <p className="text-xs leading-relaxed text-slate-500">
                Requests must be made 3 days in advance. Approved leaves automatically block your
                calendar slots.
              </p>
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-3 xl:col-span-7">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Icon icon="solar:history-bold" className="size-5 text-primary" />
            Request History
            <span className="text-sm font-normal text-muted-foreground">({myOffDays.length})</span>
          </h2>
          {myOffDays.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border bg-white py-16 text-center text-slate-400 shadow-sm">
              <Icon icon="solar:document-text-bold-duotone" className="size-12 opacity-20" />
              <p className="text-sm font-medium">No leave requests yet</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {myOffDays.map((offDay) => {
                const style = STATUS_STYLE[offDay.status] ?? STATUS_STYLE[OffDayStatus.PENDING];
                const days =
                  differenceInCalendarDays(new Date(offDay.endDate), new Date(offDay.startDate)) +
                  1;
                return (
                  <li
                    key={offDay.id}
                    className="flex min-w-0 flex-col gap-3 rounded-2xl border bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          'flex size-10 shrink-0 items-center justify-center rounded-xl',
                          style.tile,
                        )}
                      >
                        <Icon icon={style.icon} className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 font-semibold text-slate-800">
                            {format(new Date(offDay.startDate), 'd MMM')}
                            {days > 1
                              ? ` – ${format(new Date(offDay.endDate), 'd MMM yyyy')}`
                              : format(new Date(offDay.startDate), ' yyyy')}
                          </p>
                          <Badge variant="outline" className={cn('shrink-0', style.badge)}>
                            {style.label}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {typeLabel(offDay.type)} · {days} {days === 1 ? 'day' : 'days'}
                        </p>
                      </div>
                    </div>
                    <p className="break-words text-sm italic text-slate-600">“{offDay.reason}”</p>
                    {offDay.adminRemarks && (
                      <p className="flex items-start gap-1.5 break-words rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        <Icon
                          icon="solar:chat-round-dots-bold"
                          className="mt-0.5 size-3.5 shrink-0 text-slate-400"
                        />
                        <span className="min-w-0">
                          <span className="font-semibold">Admin:</span> {offDay.adminRemarks}
                        </span>
                      </p>
                    )}
                    {offDay.status === OffDayStatus.PENDING && (
                      <Button
                        variant="outline"
                        className="h-10 w-full gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-600 sm:w-auto sm:self-end"
                        onClick={() => handleDelete(offDay.id)}
                      >
                        <Icon icon="solar:trash-bin-trash-bold" className="size-4" />
                        Withdraw Request
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
