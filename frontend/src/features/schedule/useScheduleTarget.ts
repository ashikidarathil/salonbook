import { useLocation, useParams } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { useStylistBranch } from './useStylistBranch';

/** Whose schedule an inner page edits: the stylist in the address (admin) or the logged-in one. */
export function useScheduleTarget(enabled = true) {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);

  const stylistId = id || user?.id;
  const knownBranchId = id ? undefined : user?.branchId;
  const needsLookup = enabled && !knownBranchId && !!stylistId;

  const lookup = useStylistBranch(stylistId, needsLookup);

  const stylistName = (location.state as { stylistName?: string } | null)?.stylistName;
  const scheduleHref = id ? `/admin/stylists/${id}` : '/stylist/schedule';
  const parentCrumbs = id
    ? [
        { label: 'Stylists', href: '/admin/stylists' },
        { label: stylistName || 'Manage Stylist', href: scheduleHref },
      ]
    : [{ label: 'My Schedule', href: scheduleHref }];

  return {
    stylistId,
    branchId: knownBranchId ?? lookup.branchId,
    isLoading: needsLookup && lookup.isLoading,
    scheduleHref,
    parentCrumbs,
    stylistName,
  };
}
