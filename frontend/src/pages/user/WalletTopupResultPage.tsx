import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { Icon } from '@iconify/react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { formatRupees } from '@/common/utils/money';
import { cleanReason } from '@/features/payment/cleanReason';
import { fetchMyWallet, fetchTransactionHistory } from '@/features/wallet/wallet.thunks';
import { ResultBody, ResultHero } from '@/components/payment/ResultHero';
import { Button } from '@/components/ui/button';

const WALLET = '/profile/wallet';

/** What the Add Money page passes along when it opens this page. */
export interface TopupResultState {
  amount?: number;
  reason?: string;
}

/** Shown after a wallet top-up, whether the payment went through or not. */
export default function WalletTopupResultPage({ outcome }: { outcome: 'success' | 'failure' }) {
  const dispatch = useAppDispatch();
  const state = (useLocation().state ?? {}) as TopupResultState;
  const balance = useAppSelector((s) => s.wallet.wallet?.balance);
  const success = outcome === 'success';
  const amount = state.amount;

  useEffect(() => {
    if (!success) return;
    dispatch(fetchMyWallet());
    dispatch(fetchTransactionHistory());
  }, [dispatch, success]);

  return (
    <div className="px-4 py-8 sm:px-6 sm:py-12">
      <ResultBody>
        <ResultHero
          outcome={outcome}
          title={success ? 'Money added' : 'Top-up didn’t go through'}
          message={
            success
              ? 'Your wallet has been topped up and is ready to use for bookings.'
              : 'Nothing was added to your wallet. You can try again.'
          }
          reason={success ? null : cleanReason(state.reason)}
        />

        <div className="overflow-hidden rounded-2xl border bg-white">
          <div className="flex items-center gap-4 border-b bg-muted/30 p-4 sm:p-5">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-xl border bg-white shadow-sm">
              <Icon icon="solar:wallet-money-bold-duotone" className="size-7 text-primary" />
            </span>
            <div className="min-w-0">
              <p className="font-bold sm:text-lg">Wallet top-up</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(), 'EEEE, d MMMM yyyy · h:mm a')}
              </p>
            </div>
          </div>
          <dl className="space-y-2 p-4 text-sm sm:px-5">
            {amount !== undefined && (
              <div
                className={
                  success
                    ? 'flex justify-between gap-3 font-semibold text-emerald-700'
                    : 'flex justify-between gap-3'
                }
              >
                <dt>{success ? 'Amount added' : 'Amount tried'}</dt>
                <dd className="font-semibold">{formatRupees(amount)}</dd>
              </div>
            )}
            {success && balance !== undefined && (
              <div className="flex justify-between gap-3 border-t pt-2">
                <dt className="font-bold">New balance</dt>
                <dd className="text-base font-bold">{formatRupees(balance)}</dd>
              </div>
            )}
            {!success && (
              <p className="text-muted-foreground">Your wallet balance hasn&apos;t changed.</p>
            )}
          </dl>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {success ? (
            <>
              <Button asChild className="h-11 font-semibold">
                <Link to={WALLET}>
                  <Icon icon="solar:wallet-bold-duotone" className="mr-2 size-5" />
                  Go to wallet
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-11 font-semibold">
                <Link to="/services">
                  <Icon icon="solar:calendar-add-bold-duotone" className="mr-2 size-5" />
                  Book a service
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild className="h-11 font-semibold">
                <Link to={`${WALLET}/add`} state={{ amount }}>
                  <Icon icon="solar:refresh-bold" className="mr-2 size-5" />
                  Try again
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-11 font-semibold">
                <Link to={WALLET}>Back to wallet</Link>
              </Button>
            </>
          )}
        </div>
        {!success && (
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            If money left your account for this attempt, your bank usually returns it within 5–7
            working days.
          </p>
        )}
      </ResultBody>
    </div>
  );
}
