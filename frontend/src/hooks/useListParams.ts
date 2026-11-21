import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const currentSearch = () => new URLSearchParams(window.location.search).get('q') ?? '';

/** Keeps a list's search, filters and page in the address, so returning to it restores them. */
export function useListParams() {
  const [params, setParams] = useSearchParams();
  // The box needs its own state: the address updates too late to keep up with fast typing
  const [search, setSearch] = useState(() => params.get('q') ?? '');

  const [seenParams, setSeenParams] = useState(params);

  // The address changed (back button, sidebar link): show what it now says
  if (params !== seenParams) {
    setSeenParams(params);
    setSearch(currentSearch());
  }

  const update = useCallback(
    (changes: Record<string, string | undefined>, page = 1) => {
      if ('q' in changes) setSearch(changes.q ?? '');
      // Built from the real address, so quick successive changes never lose one
      const next = new URLSearchParams(window.location.search);
      Object.entries(changes).forEach(([key, value]) => {
        if (value && value !== 'ALL') next.set(key, value);
        else next.delete(key);
      });
      if (page > 1) next.set('page', String(page));
      else next.delete('page');
      setParams(next, { replace: true });
    },
    [setParams],
  );

  return {
    search,
    page: Math.max(1, Number(params.get('page')) || 1),
    value: (key: string) => params.get(key) ?? 'ALL',
    update,
  };
}
