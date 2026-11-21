import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { loadSelectedBranchFromStorage } from '@/features/branch/branch.slice';
import { addToCart, updateItemSlot, updateStylist } from '@/features/cart/cart.slice';
import { fetchPublicStylistById } from '@/features/stylistInvite/stylistInviteThunks';
import { useResolveRefs } from '@/hooks/useResolveRefs';
import { InnerPageStatus } from '@/components/common/InnerPageStatus';
import { PageHeader } from '@/components/common/PageHeader';
import { SlotPicker } from '@/components/booking/SlotPicker';
import { CustomerPage } from '@/components/user/CustomerPage';

/** Booking with one stylist: choose a service, then a date and time. */
export default function StylistBookPage() {
  const { stylistId: stylistRef = '', serviceId } = useParams<{
    stylistId: string;
    serviceId: string;
  }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const resolved = useResolveRefs({ stylist: stylistRef });
  const resolvedId = resolved.data?.stylist?.id;
  const { selectedStylist: stored, error } = useAppSelector((state) => state.stylistInvite);
  const { selectedBranch } = useAppSelector((state) => state.branch);
  const stylist =
    stored && (stored.id === resolvedId || stored.userId === resolvedId) ? stored : null;
  const profileHref = `/stylists/${stylistRef}`;
  const pickHref = `${profileHref}/book`;
  const service = stylist?.assignedServiceDetails?.find((item) => item.id === serviceId);

  useEffect(() => {
    dispatch(loadSelectedBranchFromStorage());
    if (!localStorage.getItem('selectedBranch')) {
      localStorage.setItem('returnPath', window.location.pathname);
      navigate('/branches');
    }
  }, [dispatch, navigate]);

  useEffect(() => {
    if (resolvedId) dispatch(fetchPublicStylistById({ stylistId: resolvedId }));
  }, [dispatch, resolvedId]);

  const baseCrumbs = [
    { label: 'Stylists', href: '/stylists' },
    { label: stylist?.name || 'Stylist', href: profileHref },
  ];

  if (!stylist) {
    const failure = resolved.error || (resolvedId ? error : null);
    return (
      <CustomerPage>
        <InnerPageStatus
          title="Book Appointment"
          breadcrumbs={[...baseCrumbs, { label: 'Book' }]}
          backTo={profileHref}
          message={failure ? 'This stylist could not be found.' : undefined}
        />
      </CustomerPage>
    );
  }

  if (!serviceId) {
    const services = stylist.assignedServiceDetails ?? [];
    return (
      <CustomerPage>
        <PageHeader
          title="Select a Service"
          description={`Choose a service to book with ${stylist.name}`}
          breadcrumbs={[...baseCrumbs, { label: 'Select Service' }]}
          backTo={profileHref}
        />
        {services.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">
            This stylist has no services available yet.
          </p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {services.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.id}
                  className="group flex h-full items-center justify-between gap-3 rounded-xl border bg-card p-4 transition-all hover:border-primary hover:bg-primary/5"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-primary">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" className="size-full object-cover" />
                      ) : (
                        <Icon icon="solar:scissors-square-bold" className="size-5" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block break-words font-semibold">{item.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {item.duration} mins
                      </span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2 font-bold text-primary">
                    ₹{item.price.toLocaleString('en-IN')}
                    <Icon
                      icon="solar:alt-arrow-right-linear"
                      className="size-4 text-muted-foreground"
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CustomerPage>
    );
  }

  const crumbs = [
    ...baseCrumbs,
    { label: 'Select Service', href: pickHref },
    { label: service?.name || 'Choose Time' },
  ];

  if (!service || !selectedBranch?.id) {
    return (
      <CustomerPage>
        <InnerPageStatus
          title="Choose Date & Time"
          breadcrumbs={crumbs}
          backTo={pickHref}
          message={!service ? 'This service is not available with this stylist.' : undefined}
        />
      </CustomerPage>
    );
  }

  const branchId = selectedBranch.id;

  return (
    <CustomerPage>
      <PageHeader
        title="Choose Date & Time"
        description={`${service.name} with ${stylist.name} · ${service.duration} mins`}
        breadcrumbs={crumbs}
        backTo={pickHref}
      />
      <SlotPicker
        branchId={branchId}
        services={[
          {
            serviceId: service.id,
            name: service.name,
            price: service.price,
            duration: service.duration,
          },
        ]}
        stylists={[
          {
            userId: stylist.userId,
            name: stylist.name,
            specialization: stylist.specialization,
            profilePicture: stylist.profilePicture,
          },
        ]}
        initialStylistId={stylist.userId}
        submitLabel="Add to Cart"
        cancelTo={pickHref}
        onConfirm={(selection) => {
          dispatch(
            addToCart({
              branchId,
              item: {
                serviceId: service.id,
                name: service.name,
                price: service.price,
                duration: service.duration,
                ...selection,
              },
            }),
          );
          // The service may already be in the cart: this choice replaces the earlier one
          dispatch(
            updateStylist({
              serviceId: service.id,
              stylistId: selection.stylistId,
              stylistName: selection.stylistName,
            }),
          );
          dispatch(
            updateItemSlot({
              serviceId: service.id,
              date: selection.date,
              startTime: selection.startTime,
              slotId: selection.slotId,
            }),
          );
          navigate('/cart');
        }}
      />
    </CustomerPage>
  );
}
