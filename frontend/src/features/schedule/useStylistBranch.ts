import { useCallback, useEffect, useState } from 'react';
import StylistBranchService from '@/services/stylistBranch.service';

// Remembered for this visit, so reopening a schedule page skips waiting for the branch
const remembered = new Map<string, string | null>();
const inFlight = new Map<string, Promise<string | null>>();

const lookupBranch = (stylistId: string) => {
  const running = inFlight.get(stylistId);
  if (running) return running;
  const request = StylistBranchService.getStylistBranches(stylistId)
    .then((response) => {
      const branches = response.data.data;
      const branch = branches.find((item) => item.isActive) ?? branches[0];
      const branchId = branch?.branchId ?? null;
      remembered.set(stylistId, branchId);
      return branchId;
    })
    .finally(() => inFlight.delete(stylistId));
  inFlight.set(stylistId, request);
  return request;
};

/** The stylist's branch: instantly if already known, then confirmed in the background. */
export function useStylistBranch(stylistId: string | undefined, enabled = true) {
  const [result, setResult] = useState<{
    key: string;
    branchId: string | null;
    failed: boolean;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled || !stylistId) return;
    let active = true;
    lookupBranch(stylistId)
      .then((branchId) => active && setResult({ key: stylistId, branchId, failed: false }))
      .catch(
        () =>
          active &&
          setResult({
            key: stylistId,
            branchId: remembered.get(stylistId) ?? null,
            failed: !remembered.has(stylistId),
          }),
      );
    return () => {
      active = false;
    };
  }, [enabled, stylistId, attempt]);

  const current = result?.key === stylistId ? result : null;
  const known = current ? current.branchId : stylistId ? remembered.get(stylistId) : undefined;
  const retry = useCallback(() => {
    setResult(null);
    setAttempt((value) => value + 1);
  }, []);

  return {
    branchId: known ?? null,
    isLoading: enabled && !!stylistId && known === undefined,
    failed: !!current?.failed,
    retry,
  };
}
