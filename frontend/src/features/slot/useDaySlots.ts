import { useCallback, useEffect, useRef, useState } from 'react';
import type { SlotItem } from './slot.types';

interface DayResult {
  key: string;
  slots: SlotItem[];
  failed: boolean;
}

/** Loads one day's slots. A slower, older request can never replace the current filter's result. */
export function useDaySlots(load: (() => Promise<SlotItem[]>) | null, key: string) {
  const [result, setResult] = useState<DayResult | null>(null);
  const latest = useRef(0);

  const fetchDay = useCallback(async (): Promise<DayResult> => {
    try {
      return { key, slots: load ? await load() : [], failed: false };
    } catch {
      return { key, slots: [], failed: true };
    }
  }, [load, key]);

  const reload = useCallback(async () => {
    const request = ++latest.current;
    const next = await fetchDay();
    if (request === latest.current) setResult(next);
  }, [fetchDay]);

  useEffect(() => {
    if (!load) return;
    const request = ++latest.current;
    fetchDay().then((next) => {
      if (request === latest.current) setResult(next);
    });
  }, [load, fetchDay]);

  const ready = result?.key === key;
  return {
    slots: ready ? result.slots : [],
    loading: !!load && !ready,
    failed: ready && result.failed,
    reload,
  };
}
