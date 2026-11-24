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

  const summary = [
    {
      label: 'Available Balance',
      value: rupees(wallet?.withdrawableBalance),
      note: 'Cleared funds in your wallet',
      icon: Wallet,
      accent: true,
    },
    {
      label: 'Held Money (Escrow)',
      value: rupees(heldBalance),
      note: 'Moves to your balance every 2 minutes',
      icon: Clock,
    },
    {
      label: 'Lifetime Earnings',
      value: rupees(wallet?.totalEarnings),
      note: 'Total revenue generated',
      icon: TrendingUp,
    },
  ];

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
            <p className="mt-2 break-all text-2xl font-bold sm:text-3xl">{item.value}</p>
            <p className={cn('mt-1 text-xs', item.accent ? 'opacity-80' : 'text-muted-foreground')}>
              {item.note}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Escrow Transactions</h2>
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
            <ul className="grid gap-3 lg:grid-cols-2">
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
