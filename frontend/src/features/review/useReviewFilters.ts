import { endOfDay, parseISO, startOfDay, subDays } from 'date-fns';
import { useDebounce } from '@/hooks/useDebounce';
import { useListParams } from '@/hooks/useListParams';

const isDay = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

/** Search, date range and day for a review list, kept in the address so a refresh keeps them. */
export function useReviewFilters() {
  const list = useListParams();
  const debouncedSearch = useDebounce(list.search, 500);
  const day = isDay(list.value('day')) ? list.value('day') : '';
  const range = day ? 'day' : list.value('range');

  let start: Date | undefined;
  let end: Date | undefined;
  const now = new Date();
  if (range === 'day') {
    start = startOfDay(parseISO(day));
    end = endOfDay(parseISO(day));
  } else if (range === 'today' || range === 'week' || range === 'month') {
    start = startOfDay(range === 'today' ? now : subDays(now, range === 'week' ? 7 : 30));
    end = endOfDay(now);
  }

  return {
    list,
    range,
    day,
    page: list.page,
    search: debouncedSearch.trim() || undefined,
    startDate: start?.toISOString(),
    endDate: end?.toISOString(),
    hasFilters: !!list.search || range !== 'ALL',
    clear: () => list.update({ q: undefined, range: undefined, day: undefined }),
  };
}
