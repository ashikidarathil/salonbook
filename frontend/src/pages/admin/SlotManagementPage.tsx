import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { SlotDatePicker } from '@/components/slots/SlotDatePicker';
import { SlotDayPanel } from '@/components/slots/SlotDayPanel';
import { StylistPicker } from '@/components/slots/StylistPicker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { showApiError } from '@/common/utils/swal.utils';
import { clampSlotDate, parseSlotFilter } from '@/features/slot/slotBoard';
import { useDaySlots } from '@/features/slot/useDaySlots';
import { useSlotActions } from '@/features/slot/useSlotActions';
import type { Branch } from '@/features/branch/branch.types';
import type { StylistListItem } from '@/features/stylistInvite/stylistInvite.types';
import { useListParams } from '@/hooks/useListParams';
import { branchService } from '@/services/branch.service';
import { slotService } from '@/services/slot.service';
import { stylistInviteService } from '@/services/stylistInvite.service';

export default function SlotManagementPage() {
  const list = useListParams();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [stylistList, setStylistList] = useState<{ branchId: string; items: StylistListItem[] }>({
    branchId: '',
    items: [],
  });

  // Filters live in the address, so a refresh or coming back keeps them
  const branchParam = list.value('branch');
  const branchId = branchParam !== 'ALL' ? branchParam : (branches[0]?.id ?? '');
  const date = clampSlotDate(list.value('date'));
  const stylistId = list.value('stylist');
  const filter = parseSlotFilter(list.value('status'));
  const stylists = stylistList.branchId === branchId ? stylistList.items : [];

  useEffect(() => {
    branchService
      .list()
      .then((response) => setBranches(response.data.data))
      .catch((error) => showApiError(error, 'Failed to load branches'));
  }, []);

  useEffect(() => {
    if (!branchId) return;
    let active = true;
    stylistInviteService
      .getPublicStylists({ branchId, limit: 100 })
      .then((response) => {
        if (active) setStylistList({ branchId, items: response.data.data.data });
      })
      .catch((error) => {
        if (active) showApiError(error, 'Failed to load stylists');
      });
    return () => {
      active = false;
    };
  }, [branchId]);

  const load = useCallback(
    async () =>
      (
        await slotService.adminListSlots({
          branchId,
          date,
          stylistId: stylistId === 'ALL' ? undefined : stylistId,
        })
      ).data.data,
    [branchId, date, stylistId],
  );
  const { slots, loading, failed, reload } = useDaySlots(
    branchId ? load : null,
    `${branchId}|${date}|${stylistId}`,
  );
  const onSelect = useSlotActions(reload);

  const specialHref = (slotStylistId: string) => {
    const stylist = stylists.find((item) => item.id === slotStylistId);
    const query = new URLSearchParams({
      branch: branchId,
      stylist: stylist?.userId ?? slotStylistId,
      date,
    });
    return `special/new?${query}`;
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Slot Management"
        description="See and manage each stylist's day."
        breadcrumbs={[{ label: 'Slots' }]}
      />

      <div className="grid gap-3 rounded-2xl border bg-white p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,1fr)]">
        <Select
          value={branchId}
          onValueChange={(value) => list.update({ branch: value, stylist: undefined })}
        >
          <SelectTrigger aria-label="Filter by branch" className="h-10 min-w-0">
            <SelectValue placeholder="Select branch" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="min-w-0 sm:order-last sm:col-span-2 xl:order-none xl:col-span-1">
          <SlotDatePicker value={date} onChange={(value) => list.update({ date: value })} />
        </div>
        <StylistPicker
          stylists={stylists}
          value={stylistId}
          disabled={!branchId}
          onChange={(value) => list.update({ stylist: value })}
        />
      </div>

      <SlotDayPanel
        slots={slots}
        loading={loading || (!branchId && !branches.length)}
        failed={failed}
        onRefresh={reload}
        filter={filter}
        onFilterChange={(value) => list.update({ status: value })}
        bookingHref={(bookingId) => `/admin/bookings/${bookingId}`}
        onSelect={onSelect}
        perspective="admin"
        specialHref={specialHref}
      />
    </div>
  );
}
