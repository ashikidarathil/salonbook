import { Loader } from '@/components/common/Loader';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchMyWallet, fetchTransactionHistory } from '@/features/wallet/wallet.thunks';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { type WalletTransaction, TransactionType } from '@/features/wallet/wallet.types';

const typeConfig: Record<
  TransactionType,
  { icon: string; color: string; bg: string; label: string }
> = {
  [TransactionType.CREDIT]: {
    icon: 'solar:arrow-down-bold',
    color: 'text-green-600',
    bg: 'bg-green-50',
    label: 'Credit',
  },
  [TransactionType.DEBIT]: {
    icon: 'solar:arrow-up-bold',
    color: 'text-red-500',
    bg: 'bg-red-50',
    label: 'Debit',
  },
};

const refTypeConfig: Record<string, { label: string; icon: string; color: string }> = {
  DEPOSIT: { label: 'Top-Up', icon: 'solar:wallet-money-bold', color: 'text-primary' },
  REFUND: { label: 'Refund', icon: 'solar:refresh-bold', color: 'text-blue-600' },
  BOOKING: { label: 'Booking', icon: 'solar:calendar-bold', color: 'text-amber-600' },
  ESCROW: { label: 'Escrow', icon: 'solar:shield-bold', color: 'text-slate-500' },
  WITHDRAWAL: { label: 'Withdrawal', icon: 'solar:card-send-bold', color: 'text-orange-500' },
};

function TransactionRow({ tx }: { tx: WalletTransaction }) {
  const type = typeConfig[tx.type];
  const refType = refTypeConfig[tx.referenceType ?? ''];
  const date = new Date(tx.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const cleanDescription = tx.description
    .replace(/[a-fA-F0-9]{24}/g, '')
    .replace(/\s*for booking\s*$/i, '')
    .replace(/\s*booking\s*$/i, '')
    .trim();

  return (
    <div className="flex items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl hover:bg-slate-50 transition-colors">
      <div
        className={`size-9 sm:size-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0 ${type.bg}`}
      >
        <Icon icon={type.icon} className={`size-4 sm:size-5 ${type.color}`} />
      </div>
      <div className="flex-1 min-w-0 pr-2">
        <p className="font-medium text-slate-800 text-[13px] sm:text-sm truncate">{cleanDescription}</p>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1 sm:mt-0.5">
          <span className="text-[10px] sm:text-[11px] text-slate-400">{date}</span>
          {refType && (
            <span
              className={`text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 ${refType.color} whitespace-nowrap`}
            >
              <Icon icon={refType.icon} className="size-2 sm:size-2.5 inline mr-0.5 relative -top-[0.5px]" />
              {refType.label}
            </span>
          )}
        </div>
      </div>
      <p className={`font-bold text-sm sm:text-base flex-shrink-0 whitespace-nowrap mt-1 sm:mt-0 ${type.color}`}>
        {tx.type === TransactionType.CREDIT ? '+' : '−'}₹{tx.amount.toLocaleString('en-IN')}
      </p>
    </div>
  );
}

export default function WalletPage() {
  const dispatch = useAppDispatch();
  const { wallet, transactions, isLoading } = useAppSelector((s) => s.wallet);
  useEffect(() => {
    dispatch(fetchMyWallet());
    dispatch(fetchTransactionHistory());
  }, [dispatch]);

  return (
    <div className="w-full space-y-4 p-4 sm:space-y-6 sm:p-6 lg:p-8">
      {/* Balance Card Section */}
      <div className="pt-1 sm:pt-2">
        <Card className="relative overflow-hidden border-none shadow-lg bg-primary text-primary-foreground min-w-0">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute -top-10 -right-10 size-32 sm:size-40 bg-white rounded-full" />
            <div className="absolute -bottom-16 -left-10 size-40 sm:size-48 bg-white rounded-full" />
          </div>
          <CardContent className="p-4 sm:p-8 relative z-10">
            <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
              <div className="min-w-0">
                <p className="text-primary-foreground/70 text-[10px] sm:text-xs mt-3 font-semibold uppercase tracking-wider mb-1">
                  Available Balance
                </p>
                {isLoading ? (
                  <div className="flex h-8 items-center sm:h-12">
                    <Loader size="sm" inverse label="Loading balance" />
                  </div>
                ) : (
                  <p className="text-2xl sm:text-5xl font-black tracking-tight truncate">
                    ₹{(wallet?.balance ?? 0).toLocaleString('en-IN')}
                  </p>
                )}
              </div>
              <div className="size-10 sm:size-14 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                <Icon icon="solar:wallet-bold-duotone" className="size-5 sm:size-8" />
              </div>
            </div>
            
            <div className="flex flex-row items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className={`size-2 rounded-full ${wallet?.isActive ? 'bg-green-400' : 'bg-red-400'}`}
                />
                <p className="text-primary-foreground/80 text-[11px] sm:text-xs font-medium">
                  {wallet?.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
              <Button
                asChild
                className="bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground font-bold px-3 sm:px-4 h-8 sm:h-9 text-[10px] sm:text-xs shadow-sm rounded-lg whitespace-nowrap transition-colors border border-primary-foreground/10"
              >
                <Link to="add">
                  <Icon
                    icon="solar:add-circle-bold"
                    className="size-3.5 sm:size-4 mr-1 sm:mr-1.5"
                  />
                  Add Money
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <div className="mt-4 sm:mt-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="font-bold text-lg sm:text-xl font-heading">Recent Activity</h2>
          <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/5 text-xs sm:text-sm px-2 sm:px-3 h-8">
            View All
          </Button>
        </div>
        <Card className="overflow-hidden border-none shadow-md">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader label="Loading transactions" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 sm:py-20 px-4 text-center">
                <div className="size-16 sm:size-20 rounded-full bg-muted flex items-center justify-center mb-3 sm:mb-4">
                  <Icon icon="solar:wallet-broken" className="size-8 sm:size-10 opacity-20" />
                </div>
                <h4 className="font-semibold text-base sm:text-lg text-foreground">No Transactions Yet</h4>
                <p className="text-muted-foreground text-sm max-w-xs mt-1">
                  Start using your wallet to see your transaction history here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {transactions.map((tx, idx) => (
                  <TransactionRow key={tx.id ?? idx} tx={tx} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
