import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { SlotItem } from '@/features/slot/slot.types';
import {
  SLOT_KIND_LABEL,
  formatSlotTime,
  isSpecialSlot,
  slotKind,
} from '@/features/slot/slotBoard';
import type { SlotKind } from '@/features/slot/slotBoard';

const KIND_STYLES: Record<SlotKind, string> = {
  AVAILABLE: 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100',
  BOOKED: 'border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100',
  BLOCKED: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
  BREAK: 'border-slate-200 bg-slate-100 text-slate-600',
  SPECIAL: 'border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100',
};

const ACTION_LABEL: Partial<Record<SlotKind, string>> = {
  AVAILABLE: 'Block',
  BLOCKED: 'Unblock',
  SPECIAL: 'Delete special slot',
};

interface SlotTileProps {
  slot: SlotItem;
  bookingHref: (bookingId: string) => string;
  onSelect: (slot: SlotItem) => void;
  /** The board shows the time in its first column */
  hideTime?: boolean;
}

export function SlotTile({ slot, bookingHref, onSelect, hideTime }: SlotTileProps) {
  const kind = slotKind(slot);
  const special = isSpecialSlot(slot);
  const time = special
    ? `${formatSlotTime(slot.startTime)} – ${formatSlotTime(slot.endTime)}`
    : formatSlotTime(slot.startTime);
  const className = cn(
    'flex min-h-14 w-full min-w-0 flex-col justify-center rounded-xl border px-3 py-2 text-left transition-colors',
    KIND_STYLES[kind],
  );
  const body = (
    <>
      {(!hideTime || special) && <span className="text-sm font-semibold">{time}</span>}
      <span className={cn('text-xs', hideTime && !special && 'font-semibold')}>
        {SLOT_KIND_LABEL[kind]}
        {special && kind === 'BOOKED' ? ' · Special' : ''}
      </span>
      {slot.note && (
        <span className="truncate text-[11px] opacity-80" title={slot.note}>
          {slot.note}
        </span>
      )}
    </>
  );

  if (kind === 'BREAK') return <div className={className}>{body}</div>;
  if (kind === 'BOOKED') {
    if (!slot.bookingId) return <div className={className}>{body}</div>;
    return (
      <Link
        to={bookingHref(slot.bookingId)}
        aria-label={`Open booking at ${time}`}
        className={className}
      >
        {body}
      </Link>
    );
  }
  return (
    <button
      type="button"
      aria-label={`${ACTION_LABEL[kind]} ${time}`}
      className={className}
      onClick={() => onSelect(slot)}
    >
      {body}
    </button>
  );
}
