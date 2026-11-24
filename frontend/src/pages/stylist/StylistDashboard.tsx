import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format } from 'date-fns';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchStylistStats } from '@/features/booking/booking.thunks';
import { LoadingGate } from '@/components/common/LoadingGate';
import { AnalyticsCard } from '@/components/dashboard/AnalyticsCard';
import { DashboardPeriodFilter } from '@/components/dashboard/DashboardPeriodFilter';
import { StatusRingCard } from '@/components/dashboard/StatusRingCard';
import {
  CARD_CLASS,
  CARD_HEADER_CLASS,
  CARD_TITLE_CLASS,
  LEGEND_STYLE,
  TICK_STYLE,
  TOOLTIP_STYLE,
  compactNumber,
  money,
  shortLabel,
  trendUnit,
} from '@/components/dashboard/dashboard.utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const QUICK_LINKS = [
  {
    to: '/stylist/appointments',
    title: 'Manage Appointments',
    text: 'View and manage all your bookings',
    icon: 'solar:calendar-search-line-duotone',
  },
  {
    to: '/stylist/slots',
    title: 'My Slots',
    text: 'See your day and block time',
    icon: 'solar:clock-circle-line-duotone',
  },
];

export default function StylistDashboard() {
  const dispatch = useAppDispatch();
  const { stats, loading, error } = useAppSelector((state) => state.booking);
  const [period, setPeriod] = useState<string>('today');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const loadStats = useCallback(() => {
    dispatch(
      fetchStylistStats({
        period: period === 'custom' ? 'today' : period,
        date: period === 'custom' && selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined,
      }),
    );
  }, [dispatch, period, selectedDate]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div>
          <h1 className="break-words text-2xl font-bold sm:text-3xl">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your performance and booking activity
          </p>
        </div>
        <DashboardPeriodFilter
          period={period}
          date={selectedDate}
          onPeriodChange={setPeriod}
          onDateChange={setSelectedDate}
          defaultPeriod="today"
        />
      </div>

      <LoadingGate
        loading={loading && !stats}
        error={error}
        data={stats}
        emptyMessage="No data available for the selected period."
        resetError={loadStats}
        role="STYLIST"
        backPath="/stylist"
      >
        {stats && (
          <div className="space-y-4 duration-500 animate-in fade-in sm:space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              <AnalyticsCard
                title="Total Revenue"
                value={money(stats.summary.revenue)}
                subtitle="Earned revenue"
                icon="solar:wad-of-money-line-duotone"
                color="text-emerald-600"
                bg="bg-emerald-50"
                className="col-span-2 sm:col-span-1"
              />
              <AnalyticsCard
                title="Total Bookings"
                value={stats.summary.total.toLocaleString('en-IN')}
                subtitle="Appointments received"
                icon="solar:calendar-mark-line-duotone"
                color="text-blue-600"
                bg="bg-blue-50"
              />
              <AnalyticsCard
                title="Completed"
                value={stats.summary.completed.toLocaleString('en-IN')}
                subtitle="Successfully served"
                icon="solar:check-circle-line-duotone"
                color="text-indigo-600"
                bg="bg-indigo-50"
              />
              <AnalyticsCard
                title="Cancellations"
                value={stats.summary.cancelled.toLocaleString('en-IN')}
                subtitle="Missed opportunities"
                icon="solar:close-circle-line-duotone"
                color="text-rose-600"
                bg="bg-rose-50"
                className="col-span-2 sm:col-span-1"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">
              <Card className={`${CARD_CLASS} xl:col-span-2`}>
                <CardHeader className={CARD_HEADER_CLASS}>
                  <div>
                    <CardTitle className={CARD_TITLE_CLASS}>
                      <Icon
                        icon="solar:chart-square-bold-duotone"
                        className="size-5 text-primary"
                      />
                      Performance Trend
                    </CardTitle>
                    <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                      {trendUnit(period)} activity
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="!p-3 !pt-4 sm:!p-6">
                  <div className="h-64 w-full sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={stats.chartData}
                        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="stylistRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="stylistBookings" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="label"
                          axisLine={false}
                          tickLine={false}
                          tick={TICK_STYLE}
                          tickFormatter={shortLabel}
                          minTickGap={24}
                          dy={8}
                        />
                        <YAxis
                          yAxisId="revenue"
                          axisLine={false}
                          tickLine={false}
                          tick={TICK_STYLE}
                          tickFormatter={compactNumber}
                          width={40}
                        />
                        {/* Bookings are far smaller than rupees, so they get their own scale */}
                        <YAxis yAxisId="bookings" orientation="right" hide />
                        <Tooltip
                          labelFormatter={(label) => shortLabel(String(label))}
                          contentStyle={TOOLTIP_STYLE}
                        />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={LEGEND_STYLE} />
                        <Area
                          yAxisId="revenue"
                          type="monotone"
                          dataKey="revenue"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#stylistRevenue)"
                          name="Revenue"
                        />
                        <Area
                          yAxisId="bookings"
                          type="monotone"
                          dataKey="bookings"
                          stroke="#10b981"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#stylistBookings)"
                          name="Bookings"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <StatusRingCard
                title="Status Distribution"
                total={stats.summary.total}
                statuses={stats.statusBreakdown}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              {QUICK_LINKS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="group flex min-w-0 items-center justify-between gap-3 rounded-xl border border-primary/10 bg-white p-4 shadow-sm transition-all hover:bg-primary/5 sm:p-5"
                >
                  <span className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <span className="shrink-0 rounded-xl bg-primary/10 p-3 text-primary transition-all group-hover:bg-primary group-hover:text-white">
                      <Icon icon={item.icon} className="size-6" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-gray-900">{item.title}</span>
                      <span className="block text-xs text-muted-foreground">{item.text}</span>
                    </span>
                  </span>
                  <Icon
                    icon="solar:alt-arrow-right-linear"
                    className="size-5 shrink-0 text-primary/40 transition-all group-hover:translate-x-1 group-hover:text-primary"
                  />
                </Link>
              ))}
            </div>
          </div>
        )}
      </LoadingGate>
    </div>
  );
}
