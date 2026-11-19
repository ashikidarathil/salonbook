import { useEffect, useState } from 'react';
import axios from 'axios';
import { api } from '@/services/api/api';

export interface ResolvedRef {
  id: string;
  slug?: string;
  name?: string;
}

type Refs = { branch?: string; service?: string; stylist?: string };
type Resolved = Partial<Record<keyof Refs, ResolvedRef>>;

/**
 * Turns URL parts (readable slugs like "kochi", or old ids) into ids + canonical slugs
 * via GET /api/resolve, so pages can keep calling the id-based endpoints.
 */
export function useResolveRefs(refs: Refs) {
  const key = JSON.stringify(refs);
  const [state, setState] = useState<{ key?: string; data?: Resolved; error?: string }>({});

  useEffect(() => {
    const params = Object.fromEntries(
      Object.entries(JSON.parse(key) as Refs).filter(([, v]) => Boolean(v)),
    );
    if (!Object.keys(params).length) return;
    let alive = true;
    api
      .get<{ data: Resolved }>('/resolve', { params })
      .then((res) => alive && setState({ key, data: res.data.data }))
      .catch(
        (err: unknown) =>
          alive &&
          setState({
            key,
            error: (axios.isAxiosError(err) && err.response?.data?.message) || 'Page not found',
          }),
      );
    return () => {
      alive = false;
    };
  }, [key]);

  const current = state.key === key ? state : {};
  return { data: current.data, error: current.error, loading: !current.data && !current.error };
}
