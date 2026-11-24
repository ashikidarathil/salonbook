import { useCallback, useEffect } from 'react';
import { endOfDay, parseISO, startOfDay, startOfYear, subDays } from 'date-fns';
import { CalendarClock, CheckCircle, Lock, RefreshCw, Search, Wallet, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchAdminEscrows } from '@/features/escrow/escrow.thunks';
import { EscrowStatus } from '@/features/escrow/escrow.types';
import { Loader } from '@/components/common/Loader';
import { EscrowCard } from '@/components/wallet/EscrowCard';
import { PageHeader } from '@/components/common/PageHeader';
import Pagination from '@/components/pagination/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { useListParams } from '@/hooks/useListParams';
import { cn } from '@/lib/utils';

const LIMIT = 10;
const PERIODS = [
  { value: 'ALL', label: 'All' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
] as const;
const TABS = [
  { value: 'ALL', label: 'Escrowed Funds' },
  { value: 'released', label: 'Release History' },
] as const;

const rupees = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;
const isDay = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
function dateRange(period: string, day: string) {
  const now = new Date();
  if (period === 'day') {
    return {
      startDate: startOfDay(parseISO(day)).toISOString(),
      endDate: endOfDay(parseISO(day)).toISOString(),
    };
  }
  const starts: Record<string, Date> = {
    today: startOfDay(now),
    week: startOfDay(subDays(now, 6)),
    month: startOfDay(subDays(now, 29)),
    year: startOfYear(now),
  };
  const start = starts[period];
  return start
    ? { startDate: start.toISOString(), endDate: endOfDay(now).toISOString() }
    : { startDate: undefined, endDate: undefined };
}

export default function AdminWalletPage() {
  const dispatch = useAppDispatch();
  const { escrows, pagination, loading } = useAppSelector((state) => state.escrow);

  // Filters live in the address, so a refresh or coming back keeps them
  const list = useListParams();
  const debouncedSearch = useDebounce(list.search, 500);
  const released = list.value('tab') === 'released';
  const day = isDay(list.value('day')) ? list.value('day') : '';
  const period = day ? 'day' : list.value('period');
  const page = list.page;
  const pageTotal = escrows.reduce((sum, escrow) => sum + escrow.amount, 0);

  const loadEscrows = useCallback(() => {
    dispatch(
      fetchAdminEscrows({
        page,
        limit: LIMIT,
        search: debouncedSearch.trim() || undefined,
        status: released ? EscrowStatus.RELEASED : EscrowStatus.HELD,
        ...dateRange(period, day),
      }),
    );
  }, [dispatch, page, debouncedSearch, released, period, day]);

  useEffect(() => {
    loadEscrows();
  }, [loadEscrows]);

  const summary = [
    {
      label: released ? 'Released on this page' : 'Held on this page',
      value: rupees(pageTotal),
      note: `${escrows.length} of ${pagination?.totalItems ?? escrows.length} records`,
      icon: released ? CheckCircle : Lock,
      accent: true,
    },
    {
      label: released ? 'Total releases' : 'Total held records',
      value: String(pagination?.totalItems ?? escrows.length),
      note: 'For the chosen period and search',
      icon: Wallet,
    },
    {
      label: 'Automatic release',
      value: 'Every 2 minutes',
      note: 'Held funds move to stylist wallets automatically',
      icon: CalendarClock,
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Platform Wallet"
        description="Monitor escrowed funds and releases to stylists."
        breadcrumbs={[{ label: 'Platform Wallet' }]}
        actions={
          <Button variant="outline" className="h-10 w-full gap-2 sm:w-auto" onClick={loadEscrows}>
            {loading ? <Loader size="xs" /> : <RefreshCw className="size-4" />}
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-1 rounded-xl border bg-muted/40 p-1 sm:inline-grid">
        {TABS.map((tab) => {
          const active = (tab.value === 'released') === released;
          return (
            <button
              key={tab.value}
              type="button"
              aria-pressed={active}
              onClick={() => list.update({ tab: tab.value })}
              className={cn(
                'h-9 min-w-0 rounded-lg px-3 text-sm font-semibold transition-colors',
                active ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground',
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {summary.map((item) => (
          <div
            key={item.label}
            className={cn(
              'min-w-0 rounded-2xl border p-4 shadow-sm sm:p-5',
              item.accent ? 'border-primary bg-primary text-primary-foreground' : 'bg-white',
            )}
          >
            <p
              className={cn(
                'flex items-center gap-2 text-sm font-medium',
                item.accent ? 'opacity-90' : 'text-muted-foreground',
              )}
            >
              <item.icon className="size-4 shrink-0" />
              <span className="min-w-0 break-words">{item.label}</span>
            </p>
            <p className="mt-2 break-words text-2xl font-bold">{item.value}</p>
            <p className={cn('mt-1 text-xs', item.accent ? 'opacity-80' : 'text-muted-foreground')}>
              {item.note}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto_12rem]">
        <div className="relative min-w-0">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search by booking number"
            placeholder="Search booking number..."
            value={list.search}
            onChange={(event) => list.update({ q: event.target.value })}
            className="h-10 pl-9 pr-10"
          />
          {list.search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => list.update({ q: undefined })}
              className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem] xl:contents">
          <div
            className="grid grid-cols-5 gap-1 rounded-xl border bg-muted/40 p-1"
            role="group"
            aria-label="Filter by period"
          >
            {PERIODS.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={period === item.value}
                onClick={() => list.update({ period: item.value, day: undefined })}
                className={cn(
                  'h-8 min-w-0 rounded-lg px-1 text-xs font-semibold transition-colors xl:px-3',
                  period === item.value
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <Input
            type="date"
            aria-label="Choose a day"
            value={day}
            onChange={(event) =>
              list.update({ day: event.target.value || undefined, period: undefined })
            }
            className={cn('h-10 min-w-0', period === 'day' && 'border-primary')}
          />
        </div>
      </div>

      {loading && escrows.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader label="Loading wallet" />
        </div>
      ) : escrows.length === 0 ? (
        <div className="rounded-2xl border bg-white px-6 py-12 text-center text-muted-foreground shadow-sm">
          {released ? (
            <CheckCircle className="mx-auto mb-3 size-10 opacity-30" />
          ) : (
            <Lock className="mx-auto mb-3 size-10 opacity-30" />
          )}
          <p className="text-sm">
            {released ? 'No releases found.' : 'No funds in escrow for these filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <ul className="grid gap-3 lg:grid-cols-2">
            {escrows.map((escrow) => (
              <EscrowCard
                key={escrow.id}
                escrow={escrow}
                bookingHref={(item) =>
                  item.bookingId?.id ? `/admin/bookings/${item.bookingId.id}` : undefined
                }
              />
            ))}
          </ul>
          {pagination && pagination.totalPages > 1 && (
            <Pagination
              className="mt-2"
              currentPage={page}
              totalPages={pagination.totalPages}
              onPageChange={(next) => list.update({}, next)}
            />
          )}
        </div>
      )}
    </div>
  );
}
