import { format, isValid, parse } from 'date-fns';

export const PERIODS = [
  { label: 'Today', value: 'today', icon: 'solar:calendar-date-bold-duotone' },
  { label: 'Week', value: 'week', icon: 'solar:calendar-minimalistic-bold-duotone' },
  { label: 'Month', value: 'month', icon: 'solar:calendar-bold-duotone' },
  { label: 'Year', value: 'year', icon: 'solar:calendar-line-duotone' },
];

export const LEGEND_STYLE = { fontSize: 12, paddingTop: 8 };
export const TICK_STYLE = { fontSize: 11, fill: '#94a3b8' };
export const TOOLTIP_STYLE = {
  borderRadius: '8px',
  border: '1px solid #f1f5f9',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
};
export const CARD_CLASS = 'min-w-0 overflow-hidden border-border/40 shadow-sm';
export const CARD_HEADER_CLASS = 'border-b bg-gray-50/30 !p-4 sm:!px-6';
export const CARD_TITLE_CLASS = 'flex items-center gap-2 text-base font-semibold sm:text-lg';

export const money = (value: number) => `₹${value.toLocaleString('en-IN')}`;

/** Short axis labels: 28 Oct instead of 2026-10-28. */
export const shortLabel = (label: string) => {
  const pattern = /^\d{4}-\d{2}-\d{2}$/.test(label)
    ? ['yyyy-MM-dd', 'd MMM']
    : /^\d{4}-\d{2}$/.test(label)
      ? ['yyyy-MM', 'MMM']
      : null;
  if (!pattern) return label;
  const date = parse(label, pattern[0], new Date());
  return isValid(date) ? format(date, pattern[1]) : label;
};

export const compactNumber = (value: number) =>
  new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

/** What the chart is grouped by for a period. */
export const trendUnit = (period: string) =>
  period === 'today' || period === 'custom' ? 'Hourly' : period === 'year' ? 'Monthly' : 'Daily';
