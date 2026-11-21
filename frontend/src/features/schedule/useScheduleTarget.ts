import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import StylistBranchService from '@/services/stylistBranch.service';

/** Whose schedule an inner page edits: the stylist in the address (admin) or the logged-in one. */
export function useScheduleTarget(enabled = true) {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);
  const [fetched, setFetched] = useState<{ key: string; branchId: string | null } | null>(null);

  const stylistId = id || user?.id;
  const knownBranchId = id ? undefined : user?.branchId;
  const needsLookup = enabled && !knownBranchId && !!stylistId;

  useEffect(() => {
    if (!needsLookup || !stylistId) return;
    let active = true;
    StylistBranchService.getStylistBranches(stylistId)
      .then((response) => {
        if (!active) return;
        const branches = response.data.data;
        const branch = branches.find((item) => item.isActive) ?? branches[0];
        setFetched({ key: stylistId, branchId: branch?.branchId ?? null });
      })
      .catch(() => active && setFetched({ key: stylistId, branchId: null }));
    return () => {
      active = false;
    };
  }, [needsLookup, stylistId]);

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
    branchId: knownBranchId ?? (fetched?.key === stylistId ? fetched?.branchId : null) ?? null,
    isLoading: needsLookup && fetched?.key !== stylistId,
    scheduleHref,
    parentCrumbs,
    stylistName,
  };
}
