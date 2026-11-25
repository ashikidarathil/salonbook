import { useCallback, useEffect } from 'react';
import { CheckCircle, Clock, RefreshCw, Search, TrendingUp, Wallet, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchStylistWallet } from '@/features/stylistWallet/stylistWallet.thunks';
import { fetchHeldBalance, fetchStylistEscrows } from '@/features/escrow/escrow.thunks';
import { EscrowStatus } from '@/features/escrow/escrow.types';
import { Loader } from '@/components/common/Loader';
import Pagination from '@/components/pagination/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EscrowCard } from '@/components/wallet/EscrowCard';
import { useDebounce } from '@/hooks/useDebounce';
import { useListParams } from '@/hooks/useListParams';
import { cn } from '@/lib/utils';

const LIMIT = 10;
const rupees = (amount?: number) => `₹${(amount ?? 0).toLocaleString('en-IN')}`;
const TABS = [
  { value: 'ALL', label: 'All' },
  { value: EscrowStatus.HELD, label: 'Held' },
  { value: EscrowStatus.RELEASED, label: 'Released' },
];

export default function StylistWalletPage() {
  const dispatch = useAppDispatch();
  const { wallet, loading: walletLoading } = useAppSelector((s) => s.stylistWallet);
  const {
    escrows,
    heldBalance,
    pagination,
    loading: escrowLoading,
  } = useAppSelector((s) => s.escrow);

  // Filters live in the address, so a refresh or coming back keeps them
  const list = useListParams();
  const debouncedSearch = useDebounce(list.search, 500);
  const status = list.value('status');
  const page = list.page;

  const loadEscrows = useCallback(() => {
    dispatch(
      fetchStylistEscrows({
        page,
        limit: LIMIT,
        search: debouncedSearch.trim() || undefined,
        status: status === 'ALL' ? undefined : status,
      }),
    );
  }, [dispatch, page, debouncedSearch, status]);

  useEffect(() => {
    dispatch(fetchStylistWallet());
    dispatch(fetchHeldBalance());
  }, [dispatch]);

  useEffect(() => {
    loadEscrows();
  }, [loadEscrows]);

  const refresh = () => {
    dispatch(fetchStylistWallet());
    dispatch(fetchHeldBalance());
    loadEscrows();
  };

  if (walletLoading && !wallet) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader label="Loading wallet" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="break-words text-2xl font-bold sm:text-3xl">My Wallet</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your earnings and automated payouts
          </p>
        </div>
        <Button variant="outline" className="h-10 w-full gap-2 sm:w-auto" onClick={refresh}>
          {escrowLoading ? <Loader size="xs" /> : <RefreshCw className="size-4" />}
          Refresh
        </Button>
      </div>

      {/* Same balance card as the customer wallet, in the stylist colour */}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="relative min-w-0 overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground shadow-lg sm:p-8">
          <div className="pointer-events-none absolute inset-0 opacity-10">
            <div className="absolute -right-10 -top-10 size-32 rounded-full bg-white sm:size-40" />
            <div className="absolute -bottom-16 -left-10 size-40 rounded-full bg-white sm:size-48" />
          </div>
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/70">
                Available balance
              </p>
              <p className="mt-1 truncate text-3xl font-black tracking-tight sm:text-5xl">
                {rupees(wallet?.withdrawableBalance)}
              </p>
            </div>
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/10 sm:size-14">
              <Wallet className="size-6 sm:size-7" />
            </span>
          </div>
          <p className="relative mt-4 text-sm text-primary-foreground/80 sm:mt-6">
            Cleared earnings, paid out to you automatically
          </p>
        </div>

        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div className="flex min-w-0 items-center gap-3 rounded-2xl border bg-white p-4 shadow-sm">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Held (escrow)</p>
              <p className="truncate text-xl font-bold">{rupees(heldBalance)}</p>
              <p className="text-xs text-muted-foreground">Moves to your balance within minutes</p>
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-3 rounded-2xl border bg-white p-4 shadow-sm">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Lifetime earnings</p>
              <p className="truncate text-xl font-bold">{rupees(wallet?.totalEarnings)}</p>
              <p className="text-xs text-muted-foreground">Everything you have earned</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Earnings</h2>
        <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)]">
          <div
            className="grid grid-cols-3 gap-1 rounded-xl border bg-muted/40 p-1"
            role="group"
            aria-label="Filter by status"
          >
            {TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                aria-pressed={status === tab.value}
                onClick={() => list.update({ status: tab.value })}
                className={cn(
                  'h-8 min-w-0 rounded-lg px-3 text-sm font-semibold transition-colors',
                  status === tab.value
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative min-w-0 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search by booking number"
              placeholder="Search booking number..."
              value={list.search}
              onChange={(e) => list.update({ q: e.target.value })}
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
        </div>

        {escrowLoading && escrows.length === 0 ? (
          <div className="flex justify-center py-16">
            <Loader label="Loading transactions" />
          </div>
        ) : escrows.length === 0 ? (
          <div className="rounded-2xl border bg-white px-6 py-12 text-center text-muted-foreground shadow-sm">
            <CheckCircle className="mx-auto mb-3 size-10 opacity-30" />
            <p className="text-sm">No transactions found.</p>
          </div>
        ) : (
          <>
            <ul
              className={cn(
                'grid gap-3 transition-opacity lg:grid-cols-2',
                escrowLoading && 'pointer-events-none opacity-50',
              )}
              aria-busy={escrowLoading}
            >
              {escrows.map((escrow) => (
                <EscrowCard
                  key={escrow.id}
                  escrow={escrow}
                  showStylist={false}
                  bookingHref={(item) =>
                    item.bookingId?.bookingNumber
                      ? `/stylist/appointments/${item.bookingId.bookingNumber}`
                      : undefined
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
          </>
        )}
      </div>
    </div>
  );
}
