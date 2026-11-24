import { Icon } from '@iconify/react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CARD_CLASS, CARD_HEADER_CLASS, CARD_TITLE_CLASS, TOOLTIP_STYLE } from './dashboard.utils';

interface StatusSlice {
  name: string;
  value: number;
  color: string;
}

const EMPTY_RING = [{ name: 'No bookings', value: 1, color: '#f1f5f9' }];

/** A ring of booking statuses with the total in the middle and a list below. */
export function StatusRingCard({
  title,
  total,
  statuses,
}: {
  title: string;
  total: number;
  statuses: StatusSlice[];
}) {
  const active = statuses.filter((status) => status.value > 0);
  const ring = active.length ? active : EMPTY_RING;

  return (
    <Card className={CARD_CLASS}>
      <CardHeader className={CARD_HEADER_CLASS}>
        <CardTitle className={CARD_TITLE_CLASS}>
          <Icon icon="solar:pie-chart-bold-duotone" className="size-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 !p-4 sm:flex-row sm:!p-6 xl:flex-col">
        <div className="relative h-48 w-full shrink-0 sm:w-1/2 xl:w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={ring}
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={78}
                paddingAngle={active.length > 1 ? 5 : 0}
                dataKey="value"
                stroke="none"
                isAnimationActive={active.length > 0}
              >
                {ring.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              {active.length > 0 && <Tooltip contentStyle={TOOLTIP_STYLE} />}
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">{total}</span>
            <span className="text-[10px] font-medium text-muted-foreground">Total</span>
          </div>
        </div>

        <div className="w-full min-w-0 space-y-2">
          {statuses.map((status) => (
            <div
              key={status.name}
              className="flex items-center justify-between gap-2 rounded-lg border border-gray-100/50 bg-gray-50/30 p-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <div
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: status.color }}
                />
                <span className="truncate text-xs font-medium text-gray-600">{status.name}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs font-semibold text-gray-900">{status.value}</span>
                <span className="text-[10px] font-normal text-muted-foreground">
                  ({total > 0 ? Math.round((status.value / total) * 100) : 0}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
