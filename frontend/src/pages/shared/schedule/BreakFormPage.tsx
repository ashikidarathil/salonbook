import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useAppDispatch } from '@/app/hooks';
import { createBreak } from '@/features/schedule/schedule.thunks';
import { useScheduleTarget } from '@/features/schedule/useScheduleTarget';
import { showError, showSuccess } from '@/common/utils/swal.utils';
import { FormPage } from '@/components/common/FormPage';
import { InnerPageStatus } from '@/components/common/InnerPageStatus';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const TITLE = 'Schedule Break';

export default function BreakFormPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { stylistId, branchId, isLoading, scheduleHref, parentCrumbs } = useScheduleTarget();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState('13:00');
  const [endTime, setEndTime] = useState('14:00');
  const [description, setDescription] = useState('Lunch Break');
  const [formError, setFormError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);

  const backTo = `${scheduleHref}?tab=breaks`;
  const breadcrumbs = [
    ...parentCrumbs.slice(0, -1),
    { ...parentCrumbs[parentCrumbs.length - 1], href: backTo },
    { label: TITLE },
  ];

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stylistId || !branchId) return;
    if (!date || date < today) {
      setFormError('Choose today or a future date');
      return;
    }
    if (!startTime || !endTime || startTime >= endTime) {
      setFormError('End time must be after start time');
      return;
    }
    setFormError(undefined);
    setIsSaving(true);
    try {
      await dispatch(
        createBreak({ stylistId, branchId, date, startTime, endTime, description }),
      ).unwrap();
      showSuccess('Success', 'Break added to the schedule');
      navigate(backTo);
    } catch (error) {
      showError('Error', (error as string) || 'Failed to add break');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <InnerPageStatus title={TITLE} breadcrumbs={breadcrumbs} backTo={backTo} />;
  }
  if (!branchId) {
    return (
      <InnerPageStatus
        title={TITLE}
        breadcrumbs={breadcrumbs}
        backTo={backTo}
        message="A branch must be assigned first."
      />
    );
  }

  return (
    <FormPage
      title={TITLE}
      description="Block the calendar for personal time"
      breadcrumbs={breadcrumbs}
      backTo={backTo}
      submitLabel={isSaving ? 'Saving...' : 'Confirm Break'}
      isSubmitting={isSaving}
      onSubmit={save}
    >
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <div className="min-w-0 space-y-2">
          <Label htmlFor="break-date">Date *</Label>
          <Input
            id="break-date"
            type="date"
            min={today}
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="break-start">Start Time *</Label>
          <Input
            id="break-start"
            type="time"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
          />
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="break-end">End Time *</Label>
          <Input
            id="break-end"
            type="time"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
          />
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="break-note">Reason / Note</Label>
          <Input
            id="break-note"
            placeholder="e.g. Lunch, Doctor Visit"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
      </div>
      {formError && <p className="text-sm text-red-600">{formError}</p>}
    </FormPage>
  );
}
