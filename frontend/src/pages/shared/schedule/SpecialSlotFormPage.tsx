import { useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { lastBookableDate } from '@/features/slot/slotBoard';
import { useScheduleTarget } from '@/features/schedule/useScheduleTarget';
import { slotService } from '@/services/slot.service';
import { showApiError, showSuccess } from '@/common/utils/swal.utils';
import { FormPage } from '@/components/common/FormPage';
import { InnerPageStatus } from '@/components/common/InnerPageStatus';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const TITLE = 'Create Special Slot';

export default function SpecialSlotFormPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isAdmin = pathname.startsWith('/admin');
  const self = useScheduleTarget(!isAdmin);
  const today = format(new Date(), 'yyyy-MM-dd');
  const lastDate = lastBookableDate();

  const stylistId = isAdmin ? params.get('stylist') : self.stylistId;
  const branchId = isAdmin ? params.get('branch') : self.branchId;
  const [date, setDate] = useState(params.get('date') || today);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);

  const listPath = isAdmin ? '/admin/slots' : '/stylist/slots';
  const listQuery = (slotDate: string | null) => {
    const query = new URLSearchParams({ status: 'SPECIAL' });
    if (isAdmin && branchId) query.set('branch', branchId);
    if (isAdmin && stylistId) query.set('stylist', stylistId);
    if (slotDate) query.set('date', slotDate);
    return `${listPath}?${query}`;
  };
  const backTo = listQuery(params.get('date'));
  const breadcrumbs = [{ label: isAdmin ? 'Slots' : 'My Slots', href: backTo }, { label: TITLE }];

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stylistId || !branchId) return;
    if (!date || date < today || date > lastDate) {
      setFormError('Choose a date within the next 14 days');
      return;
    }
    if (!startTime || !endTime) {
      setFormError('Please enter both start and end time');
      return;
    }
    if (startTime >= endTime) {
      setFormError('End time must be after start time');
      return;
    }
    setFormError(undefined);
    setIsSaving(true);
    try {
      await slotService.createSpecialSlot({
        stylistId,
        branchId,
        date,
        startTime,
        endTime,
        note: note.trim() || undefined,
      });
      showSuccess('Special Slot Created', `Slot added for ${startTime} – ${endTime}`);
      navigate(listQuery(date));
    } catch (error) {
      showApiError(error, 'Failed to create special slot');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAdmin && self.isLoading) {
    return <InnerPageStatus title={TITLE} breadcrumbs={breadcrumbs} backTo={backTo} />;
  }
  if (!stylistId || !branchId) {
    return (
      <InnerPageStatus
        title={TITLE}
        breadcrumbs={breadcrumbs}
        backTo={backTo}
        message={
          isAdmin ? 'Choose a branch and stylist on the Slots page first.' : 'No branch assigned.'
        }
      />
    );
  }

  return (
    <FormPage
      title={TITLE}
      description="Add a manual slot for a specific stylist and date"
      breadcrumbs={breadcrumbs}
      backTo={backTo}
      submitLabel={isSaving ? 'Creating...' : 'Create Slot'}
      isSubmitting={isSaving}
      onSubmit={save}
    >
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <div className="min-w-0 space-y-2">
          <Label htmlFor="special-date">Date *</Label>
          <Input
            id="special-date"
            type="date"
            min={today}
            max={lastDate}
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="special-start">Start Time *</Label>
          <Input
            id="special-start"
            type="time"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
          />
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="special-end">End Time *</Label>
          <Input
            id="special-end"
            type="time"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="special-note">Internal Note (why this slot?)</Label>
        <Textarea
          id="special-note"
          rows={3}
          placeholder="e.g. For VIP client or wait period"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </div>
      {formError && <p className="text-sm text-red-600">{formError}</p>}
    </FormPage>
  );
}
