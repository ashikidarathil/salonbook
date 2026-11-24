import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { EscrowStatus } from '@/features/escrow/escrow.types';
import type { EscrowResponseDto } from '@/features/escrow/escrow.types';
import { cn } from '@/lib/utils';

const rupees = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;
/** Release dates are saved as a full date or just a month; show either readably. */
const showDate = (value?: string) =>
  value && /^\d{4}-\d{2}-\d{2}/.test(value) ? format(new Date(value), 'd MMM yyyy') : value || '—';

const STATUS: Record<EscrowStatus, { label: string; badge: string; amount: string }> = {
  [EscrowStatus.HELD]: {
    label: 'Held',
    badge: 'border-amber-200 bg-amber-50 text-amber-700',
    amount: 'text-primary',
  },
  [EscrowStatus.RELEASED]: {
    label: 'Released',
    badge: 'border-green-200 bg-green-50 text-green-700',
    amount: 'text-green-600',
  },
  [EscrowStatus.CANCELLED]: {
    label: 'Cancelled',
    badge: 'border-gray-200 bg-gray-50 text-gray-600',
    amount: 'text-muted-foreground',
  },
};

interface EscrowCardProps {
  escrow: EscrowResponseDto;
  /** Where the booking number links to, if anywhere */
  bookingHref?: (escrow: EscrowResponseDto) => string | undefined;
  /** The stylist's own wallet does not need their name on every card */
  showStylist?: boolean;
}

/** One held or released payment. */
export function EscrowCard({ escrow, bookingHref, showStylist = true }: EscrowCardProps) {
  const status = STATUS[escrow.status] ?? STATUS[EscrowStatus.HELD];
  const released = escrow.status === EscrowStatus.RELEASED;
  const href = bookingHref?.(escrow);
  const services = escrow.bookingId?.items
    ?.map((item) => item?.serviceId?.name)
    .filter(Boolean)
    .join(', ');
  const rows: [string, string | undefined][] = [
    ['Customer', escrow.bookingId?.userId?.name],
    ...(showStylist
      ? [['Stylist', escrow.stylistId?.userId?.name] as [string, string | undefined]]
      : []),
    ['Service', services],
    released
      ? ['Released', showDate(escrow.releaseDate)]
      : ['Created', format(new Date(escrow.createdAt), 'd MMM yyyy')],
  ];

  return (
    <li className="flex min-w-0 flex-col gap-4 rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn('break-all text-xl font-bold', status.amount)}>
            {rupees(escrow.amount)}
          </p>
          {escrow.bookingId?.bookingNumber ? (
            href ? (
              <Link
                to={href}
                className="mt-0.5 inline-block break-all text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
              >
                #{escrow.bookingId.bookingNumber}
              </Link>
            ) : (
              <p className="mt-0.5 break-all text-xs font-medium text-muted-foreground">
                #{escrow.bookingId.bookingNumber}
              </p>
            )
          ) : (
            <p className="mt-0.5 text-xs text-muted-foreground">No booking</p>
          )}
        </div>
        <Badge variant="outline" className={cn('shrink-0', status.badge)}>
          {status.label}
        </Badge>
      </div>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 rounded-xl bg-muted/50 p-3 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="break-words font-medium">{value || '—'}</dd>
          </div>
        ))}
      </dl>
    </li>
  );
}
