import { addDays, format, parseISO } from 'date-fns';
import type { SlotItem, SlotStatus } from './slot.types';

export type SlotFilter = 'ALL' | 'AVAILABLE' | 'BOOKED' | 'BLOCKED' | 'BREAK' | 'SPECIAL';
export type SlotKind = Exclude<SlotFilter, 'ALL'>;

export const SLOT_FILTERS: { value: SlotFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'BOOKED', label: 'Booked' },
  { value: 'BLOCKED', label: 'Blocked' },
  { value: 'BREAK', label: 'Break' },
  { value: 'SPECIAL', label: 'Special' },
];

export const SLOT_KIND_LABEL: Record<SlotKind, string> = {
  AVAILABLE: 'Available',
  BOOKED: 'Booked',
  BLOCKED: 'Blocked',
  BREAK: 'Break',
  SPECIAL: 'Special',
};

const DAY_STATUSES: SlotStatus[] = ['OFF_DAY', 'NON_WORKING', 'NO_SCHEDULE', 'HOLIDAY'];
const BOOKING_WINDOW_DAYS = 14;
/** Staff can look at and plan days further ahead than customers can book. */
const VIEW_WINDOW_DAYS = 90;

/** A whole-day marker such as leave or holiday, rather than a time slot. */
export const isDayStatus = (slot: SlotItem) => DAY_STATUSES.includes(slot.status);
export const isSpecialSlot = (slot: SlotItem) => slot.id.startsWith('special_');

export const slotKind = (slot: SlotItem): SlotKind => {
  if (slot.status === 'BOOKED' || slot.status === 'BLOCKED' || slot.status === 'BREAK') {
    return slot.status;
  }
  return isSpecialSlot(slot) ? 'SPECIAL' : 'AVAILABLE';
};

export const parseSlotFilter = (value: string): SlotFilter =>
  SLOT_FILTERS.some((item) => item.value === value) ? (value as SlotFilter) : 'ALL';

export const todayString = () => format(new Date(), 'yyyy-MM-dd');

const utcDaysAhead = (days: number) => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days))
    .toISOString()
    .slice(0, 10);
};

/** Customers can book 14 days ahead, counted from the UTC date. */
export const lastBookableDate = () => utcDaysAhead(BOOKING_WINDOW_DAYS);

/** The last day the slot boards let staff open. */
export const lastViewDate = () => utcDaysAhead(VIEW_WINDOW_DAYS);

export const shiftDate = (date: string, days: number) =>
  format(addDays(parseISO(date), days), 'yyyy-MM-dd');

export const clampSlotDate = (value: string) => {
  const today = todayString();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < today || value > lastViewDate()) {
    return today;
  }
  return value;
};

export const viewDates = () => {
  const dates: string[] = [];
  const last = lastViewDate();
  for (let date = todayString(); date <= last; date = shiftDate(date, 1)) dates.push(date);
  return dates;
};

export const formatSlotTime = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  const suffix = hours >= 12 ? 'pm' : 'am';
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${suffix}`;
};

export const SLOT_PERIODS = ['Morning', 'Afternoon', 'Evening'] as const;
export type SlotPeriod = (typeof SLOT_PERIODS)[number];

export const slotPeriod = (startTime: string): SlotPeriod => {
  const hour = Number(startTime.split(':')[0]);
  if (hour < 12) return 'Morning';
  return hour < 17 ? 'Afternoon' : 'Evening';
};

export const countSlots = (slots: SlotItem[]) => {
  const counts: Record<SlotFilter, number> = {
    ALL: slots.length,
    AVAILABLE: 0,
    BOOKED: 0,
    BLOCKED: 0,
    BREAK: 0,
    SPECIAL: 0,
  };
  slots.forEach((slot) => {
    counts[slotKind(slot)] += 1;
  });
  return counts;
};
