import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { updateItemSlot, updateStylist } from '@/features/cart/cart.slice';
import type { BranchStylist } from '@/features/stylistBranch/stylistBranch.types';
import StylistBranchService from '@/services/stylistBranch.service';
import { InnerPageStatus } from '@/components/common/InnerPageStatus';
import { PageHeader } from '@/components/common/PageHeader';
import { SlotPicker } from '@/components/booking/SlotPicker';
import { CustomerPage } from '@/components/user/CustomerPage';

const CART = '/cart';
const TITLE = 'Select Stylist & Time';

export default function CartSlotPage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, branchId } = useAppSelector((state) => state.cart);
  const item = items.find((entry) => entry.serviceId === serviceId);
  const [stylists, setStylists] = useState<BranchStylist[] | null>(null);
  const [failed, setFailed] = useState(false);
  const breadcrumbs = [{ label: 'Cart', href: CART }, { label: TITLE }];

  useEffect(() => {
    if (!serviceId || !branchId) return;
    let active = true;
    Promise.all([
      StylistBranchService.getStylistsByService(serviceId),
      StylistBranchService.listBranchStylists(branchId),
    ])
      .then(([capable, assigned]) => {
        if (!active) return;
        const capableIds = new Set(capable.data.data.map((stylist) => stylist.userId));
        setStylists(assigned.data.data.filter((stylist) => capableIds.has(stylist.userId)));
      })
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [serviceId, branchId]);

  if (!item || !branchId) return <Navigate to={CART} replace />;

  if (!stylists) {
    return (
      <CustomerPage>
        <InnerPageStatus
          title={TITLE}
          breadcrumbs={breadcrumbs}
          backTo={CART}
          message={failed ? 'Could not load stylists. Please try again.' : undefined}
        />
      </CustomerPage>
    );
  }

  return (
    <CustomerPage>
      <PageHeader
        title={TITLE}
        description={`${item.name} · ${item.duration} mins`}
        breadcrumbs={breadcrumbs}
        backTo={CART}
      />
      <SlotPicker
        branchId={branchId}
        services={[item]}
        stylists={stylists}
        initialStylistId={item.stylistId}
        submitLabel="Confirm Selection"
        cancelTo={CART}
        onConfirm={(selection) => {
          dispatch(
            updateStylist({
              serviceId: item.serviceId,
              stylistId: selection.stylistId,
              stylistName: selection.stylistName,
            }),
          );
          dispatch(
            updateItemSlot({
              serviceId: item.serviceId,
              date: selection.date,
              startTime: selection.startTime,
              slotId: selection.slotId,
            }),
          );
          navigate(CART);
        }}
      />
    </CustomerPage>
  );
}
