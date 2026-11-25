import { useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { getThemeColorByRole } from '@/features/wallet/wallet.constants';
import { topUpWallet } from '@/features/wallet/wallet.thunks';
import { FormPage } from '@/components/common/FormPage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];
const MIN_AMOUNT = 100;
const WALLET = '/profile/wallet';

export default function WalletTopupPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  // "Try again" from a failed top-up brings the amount back
  const retryAmount = (useLocation().state as { amount?: number } | null)?.amount;
  const [quickAmount, setQuickAmount] = useState(
    retryAmount && QUICK_AMOUNTS.includes(retryAmount) ? retryAmount : 500,
  );
  const [customAmount, setCustomAmount] = useState(
    retryAmount && !QUICK_AMOUNTS.includes(retryAmount) ? String(retryAmount) : '',
  );
  const [amountError, setAmountError] = useState<string>();
  const [isPaying, setIsPaying] = useState(false);
  const amount = customAmount ? Number(customAmount) : quickAmount;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!Number.isFinite(amount) || amount < MIN_AMOUNT) {
      setAmountError(`Minimum top-up is ₹${MIN_AMOUNT}`);
      return;
    }
    setIsPaying(true);
    const result = await dispatch(
      topUpWallet({ amount, themeColor: getThemeColorByRole(user?.role) }),
    );
    setIsPaying(false);

    if (topUpWallet.fulfilled.match(result)) {
      navigate(`${WALLET}/add/success`, { state: { amount } });
    } else if (result.payload !== 'DISMISSED') {
      // Closing the Razorpay window on purpose just leaves the user here
      navigate(`${WALLET}/add/failed`, { state: { amount, reason: result.payload } });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <FormPage
        title="Add Money"
        description="Top up your wallet balance"
        breadcrumbs={[{ label: 'Wallet', href: WALLET }, { label: 'Add Money' }]}
        backTo={WALLET}
        submitLabel={
          isPaying
            ? 'Processing...'
            : `Top-Up ₹${(Number.isFinite(amount) ? amount : 0).toLocaleString('en-IN')}`
        }
        isSubmitting={isPaying}
        onSubmit={submit}
      >
        <div className="space-y-3">
          <p className="text-sm font-medium">Select Amount</p>
          <div className="grid grid-cols-3 gap-2 lg:grid-cols-6">
            {QUICK_AMOUNTS.map((value) => {
              const isSelected = quickAmount === value && !customAmount;
              return (
                <Button
                  key={value}
                  type="button"
                  aria-pressed={isSelected}
                  variant={isSelected ? 'default' : 'outline'}
                  className="h-12 rounded-xl"
                  onClick={() => {
                    setQuickAmount(value);
                    setCustomAmount('');
                    setAmountError(undefined);
                  }}
                >
                  ₹{value.toLocaleString('en-IN')}
                </Button>
              );
            })}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="topup-amount">Or enter custom amount</Label>
          <div className="relative md:max-w-sm">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
              ₹
            </span>
            <Input
              id="topup-amount"
              type="number"
              min={MIN_AMOUNT}
              className="h-12 pl-8 font-semibold"
              placeholder={`Minimum ₹${MIN_AMOUNT}`}
              value={customAmount}
              onChange={(event) => {
                setCustomAmount(event.target.value);
                setAmountError(undefined);
              }}
            />
          </div>
          {amountError && <p className="text-sm text-red-600">{amountError}</p>}
        </div>
      </FormPage>
    </div>
  );
}
