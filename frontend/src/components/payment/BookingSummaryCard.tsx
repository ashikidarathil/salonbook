import { format } from 'date-fns';
import { Icon } from '@iconify/react';
import { formatRupees } from '@/common/utils/money';
import type { BookingItem } from '@/features/booking/booking.types';

/** 24h "14:30" → "2:30 PM" */
const twelveHour = (time?: string) => {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${suffix}`;
};

interface BookingSummaryCardProps {
  booking: BookingItem;
  /** Amount rows under the services, e.g. paid now / pay at salon. */
  children?: React.ReactNode;
}

/** When, what and with whom: the part of a booking both payment result pages show. */
export function BookingSummaryCard({ booking, children }: BookingSummaryCardProps) {
  const day = booking.date ? new Date(booking.date) : null;

  return (
    <div className="overflow-hidden rounded-2xl border bg-white">
      <div className="flex items-center gap-4 border-b bg-muted/30 p-4 sm:p-5">
        {day && (
          <div className="flex size-16 shrink-0 flex-col items-center justify-center rounded-xl border bg-white text-center shadow-sm">
            <span className="text-[11px] font-semibold uppercase text-primary">
              {format(day, 'MMM')}
            </span>
            <span className="text-2xl font-bold leading-7">{format(day, 'd')}</span>
          </div>
        )}
        <div className="min-w-0">
          <p className="font-bold sm:text-lg">{day ? format(day, 'EEEE, d MMMM yyyy') : ''}</p>
          <p className="text-sm text-muted-foreground">
            {twelveHour(booking.startTime)} – {twelveHour(booking.endTime)}
          </p>
          <p className="mt-0.5 break-all font-mono text-xs text-muted-foreground">
            #{booking.bookingNumber}
          </p>
        </div>
      </div>

      <ul className="divide-y">
        {booking.items.map((item, idx) => (
          <li key={idx} className="flex items-center gap-3 p-4 sm:px-5">
            {item.serviceImageUrl ? (
              <img
                src={item.serviceImageUrl}
                alt=""
                className="size-12 shrink-0 rounded-xl bg-muted object-cover"
              />
            ) : (
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Icon icon="solar:scissors-bold-duotone" className="size-6 text-primary" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="break-words font-semibold">{item.serviceName || 'Service'}</p>
              <p className="break-words text-sm text-muted-foreground">
                {[item.stylistName, `${twelveHour(item.startTime)}`, `${item.duration} min`]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            <span className="shrink-0 font-semibold">{formatRupees(item.price)}</span>
          </li>
        ))}
      </ul>

      {children && (
        <div className="space-y-2 border-t bg-muted/20 p-4 text-sm sm:px-5">{children}</div>
      )}
    </div>
  );
}

/** One label / amount line in the summary's money section. */
export function AmountRow({
  label,
  amount,
  strong = false,
  tone,
}: {
  label: string;
  amount: number;
  strong?: boolean;
  tone?: 'green' | 'muted';
}) {
  return (
    <div
      className={
        tone === 'green'
          ? 'flex justify-between gap-3 font-semibold text-emerald-700'
          : tone === 'muted'
            ? 'flex justify-between gap-3 text-muted-foreground'
            : 'flex justify-between gap-3'
      }
    >
      <span className={strong ? 'font-bold' : undefined}>{label}</span>
      <span className={strong ? 'text-base font-bold' : 'font-semibold'}>
        {formatRupees(amount)}
      </span>
    </div>
  );
}
