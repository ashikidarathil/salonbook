import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Loader } from '@/components/common/Loader';
import { PageHeader } from '@/components/common/PageHeader';
import { SlotDayPanel } from '@/components/slots/SlotDayPanel';
import { SlotWeekStrip } from '@/components/slots/SlotWeekStrip';
import { Button } from '@/components/ui/button';
import { useScheduleTarget } from '@/features/schedule/useScheduleTarget';
import { clampSlotDate, parseSlotFilter } from '@/features/slot/slotBoard';
import { useDaySlots } from '@/features/slot/useDaySlots';
import { useSlotActions } from '@/features/slot/useSlotActions';
import { useListParams } from '@/hooks/useListParams';
import { slotService } from '@/services/slot.service';

export default function StylistSlotManagementPage() {
  const list = useListParams();
  const { branchId, isLoading } = useScheduleTarget();
  const date = clampSlotDate(list.value('date'));
  const filter = parseSlotFilter(list.value('status'));

  const load = useCallback(
    async () => (await slotService.getStylistSlots({ branchId: branchId ?? '', date })).data.data,
    [branchId, date],
  );
  const { slots, loading, failed, reload } = useDaySlots(
    branchId ? load : null,
    `${branchId}|${date}`,
  );
  const onSelect = useSlotActions(reload);

  return (
    <div className="w-full space-y-5">
      <PageHeader
        title="My Slots"
        description="See and manage your day."
        breadcrumbs={[{ label: 'My Slots' }]}
        actions={
          branchId ? (
            <Button className="h-10 w-full gap-2 sm:w-auto" asChild>
              <Link to={`special/new?date=${date}`}>
                <Plus className="size-4" />
                Create Special Slot
              </Link>
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader label="Loading slots" />
        </div>
      ) : !branchId ? (
        <div className="rounded-2xl border bg-white px-6 py-12 text-center shadow-sm">
          <h3 className="text-lg font-semibold">No branch assigned</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            You need to be assigned to a branch to view and manage your slots.
          </p>
        </div>
      ) : (
        <>
          <SlotWeekStrip value={date} onChange={(value) => list.update({ date: value })} />
          <SlotDayPanel
            slots={slots}
            loading={loading}
            failed={failed}
            onRefresh={reload}
            filter={filter}
            onFilterChange={(value) => list.update({ status: value })}
            bookingHref={(bookingId) => `/stylist/appointments/${bookingId}`}
            onSelect={onSelect}
            perspective="self"
          />
        </>
      )}
    </div>
  );
}
