import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/** Keeps a list's search, filters and page in the address, so returning to it restores them. */
export function useListParams() {
  const [params, setParams] = useSearchParams();

  const update = useCallback(
    (changes: Record<string, string | undefined>, page = 1) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          Object.entries(changes).forEach(([key, value]) => {
            if (value && value !== 'ALL') next.set(key, value);
            else next.delete(key);
          });
          if (page > 1) next.set('page', String(page));
          else next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  return {
    search: params.get('q') ?? '',
    page: Math.max(1, Number(params.get('page')) || 1),
    value: (key: string) => params.get(key) ?? 'ALL',
    update,
  };
}
