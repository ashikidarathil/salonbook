'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LoadingGate } from '@/components/common/LoadingGate';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icon } from '@iconify/react';
import { fetchAdminDashboardStats } from '@/features/admin/state/admin.thunks';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { format, isValid, parse } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const PERIODS = [
  { label: 'Today', value: 'today', icon: 'solar:calendar-date-bold-duotone' },
  { label: 'Week', value: 'week', icon: 'solar:calendar-minimalistic-bold-duotone' },
  { label: 'Month', value: 'month', icon: 'solar:calendar-bold-duotone' },
  { label: 'Year', value: 'year', icon: 'solar:calendar-line-duotone' },
];

const LEGEND_STYLE = { fontSize: 12, paddingTop: 8 };
const TICK_STYLE = { fontSize: 11, fill: '#94a3b8' };
const CARD_CLASS = 'min-w-0 overflow-hidden border-border/40 shadow-sm';
const CARD_HEADER_CLASS = 'border-b bg-gray-50/30 !p-4 sm:!px-6';
const CARD_TITLE_CLASS = 'flex items-center gap-2 text-base font-semibold sm:text-lg';

const money = (value: number) => `₹${value.toLocaleString('en-IN')}`;

/** Short axis labels: 28 Oct instead of 2026-10-28. */
const shortLabel = (label: string) => {
  const pattern = /^\d{4}-\d{2}-\d{2}$/.test(label)
    ? ['yyyy-MM-dd', 'd MMM']
    : /^\d{4}-\d{2}$/.test(label)
      ? ['yyyy-MM', 'MMM']
      : null;
  if (!pattern) return label;
  const date = parse(label, pattern[0], new Date());
  return isValid(date) ? format(date, pattern[1]) : label;
};

const EMPTY_RING = [{ name: 'No bookings', value: 1, color: '#f1f5f9' }];

const compactNumber = (value: number) =>
  new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

export default function DashboardContent() {
  const dispatch = useAppDispatch();
  const { stats, loading, error } = useAppSelector((state) => state.admin);
  const [period, setPeriod] = useState<string>('month');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const loadStats = useCallback(() => {
    dispatch(
      fetchAdminDashboardStats({
        period: (period === 'custom' ? 'today' : period) as 'today' | 'week' | 'month' | 'year',
        endDate: period === 'custom' ? selectedDate?.toISOString() : undefined,
      }),
    );
  }, [dispatch, period, selectedDate]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const activeStatuses = (stats?.bookingStatusBreakdown ?? []).filter(
    (status: { value: number }) => status.value > 0,
  );

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setPeriod('custom');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="break-words text-2xl font-bold sm:text-3xl">Platform Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Comprehensive business metrics and platform performance analytics
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center xl:w-auto xl:shrink-0">
          <div className="flex w-full min-w-0 items-center rounded-xl border border-border/30 bg-muted/40 p-1 sm:flex-1 xl:w-auto xl:flex-none">
            <Tabs
              value={period !== 'custom' ? period : ''}
              onValueChange={setPeriod}
              className="w-full"
            >
              <TabsList className="grid h-9 w-full grid-cols-4 gap-1 bg-transparent">
                {PERIODS.map((p) => (
                  <TabsTrigger
                    key={p.value}
                    value={p.value}
                    className="min-w-0 rounded-lg px-1 py-1.5 xl:px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-medium transition-all text-sm"
                  >
                    <Icon icon={p.icon} className="mr-2 hidden size-4 xl:block" />
                    {p.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`h-[40px] w-full shrink-0 rounded-xl px-4 font-medium sm:w-auto border-border/30 bg-muted/40 hover:bg-white transition-all shadow-sm text-sm ${period === 'custom' ? 'border-primary text-primary bg-white' : ''}`}
              >
                <Icon icon="solar:calendar-add-bold-duotone" className="mr-2 size-4" />
                {period === 'custom' && selectedDate
                  ? format(selectedDate, 'PPP')
                  : 'Specific Date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-xl" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
                className="rounded-xl theme-admin"
              />
              <div className="p-3 border-t border-border/40 bg-muted/10">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs font-medium h-8 rounded-lg hover:bg-white hover:text-primary transition-colors"
                  onClick={() => {
                    setSelectedDate(new Date());
                    setPeriod('month');
                  }}
                >
                  Clear Selection
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <LoadingGate
        loading={loading && !stats}
        error={error}
        data={stats}
        emptyMessage="No dashboard data available for the selected period."
        resetError={loadStats}
        role="ADMIN"
      >
        {stats && (
          <div className="space-y-4 animate-in fade-in duration-500 sm:space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
              <AnalyticsCard
                title="Total Revenue"
                className="col-span-2 xl:col-span-1"
                value={money(stats.summary.totalRevenue)}
                subtitle="For selected period"
                icon="solar:wad-of-money-bold-duotone"
                color="text-emerald-600"
                bg="bg-emerald-50/50"
              />
              <AnalyticsCard
                title="Bookings"
                value={stats.summary.totalBookings.toLocaleString('en-IN')}
                subtitle="In selected period"
                icon="solar:calendar-mark-bold-duotone"
                color="text-blue-600"
                bg="bg-blue-50/50"
              />
              <AnalyticsCard
                title="Customers"
                value={stats.summary.totalCustomers.toLocaleString('en-IN')}
                subtitle="Active users"
                icon="solar:users-group-rounded-bold-duotone"
                color="text-indigo-600"
                bg="bg-indigo-50/50"
              />
              <AnalyticsCard
                title="Active Stylists"
                value={stats.summary.activeStylists.toLocaleString('en-IN')}
                subtitle="Onboarded"
                icon="solar:user-speak-bold-duotone"
                color="text-purple-600"
                bg="bg-purple-50/50"
              />
              <AnalyticsCard
                title="Escrow Balance"
                value={money(stats.summary.pendingEscrow)}
                subtitle="Pending release"
                icon="solar:shield-check-bold-duotone"
                color="text-orange-600"
                bg="bg-orange-50/50"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">
              {/* Trend Chart */}
              <Card className={`${CARD_CLASS} xl:col-span-2`}>
                <CardHeader className={CARD_HEADER_CLASS}>
                  <div>
                    <CardTitle className={CARD_TITLE_CLASS}>
                      <Icon
                        icon="solar:chart-square-bold-duotone"
                        className="text-primary size-5"
                      />
                      Platform Revenue Trend
                    </CardTitle>
                    <p className="text-xs text-muted-foreground font-normal mt-0.5">
                      {period === 'today' ? 'Hourly' : period === 'year' ? 'Monthly' : 'Daily'}{' '}
                      performance
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="!p-3 !pt-4 sm:!p-6">
                  <div className="h-64 w-full sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={stats.revenueTrend}
                        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
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
                          contentStyle={{
                            borderRadius: '8px',
                            border: '1px solid #f1f5f9',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          }}
                        />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={LEGEND_STYLE} />
                        <Area
                          yAxisId="revenue"
                          type="monotone"
                          dataKey="revenue"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorRevenue)"
                          name="Revenue"
                        />
                        <Area
                          yAxisId="bookings"
                          type="monotone"
                          dataKey="bookings"
                          stroke="#10b981"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorBookings)"
                          name="Bookings"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Status Breakdown Pie Chart */}
              <Card className={CARD_CLASS}>
                <CardHeader className={CARD_HEADER_CLASS}>
                  <CardTitle className={CARD_TITLE_CLASS}>
                    <Icon icon="solar:pie-chart-bold-duotone" className="text-primary size-5" />
                    Booking Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4 !p-4 sm:flex-row sm:!p-6 xl:flex-col">
                  <div className="relative h-48 w-full shrink-0 sm:w-1/2 xl:w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={activeStatuses.length ? activeStatuses : EMPTY_RING}
                          cx="50%"
                          cy="50%"
                          innerRadius={58}
                          outerRadius={78}
                          paddingAngle={activeStatuses.length > 1 ? 5 : 0}
                          dataKey="value"
                          stroke="none"
                          isAnimationActive={activeStatuses.length > 0}
                        >
                          {(activeStatuses.length ? activeStatuses : EMPTY_RING).map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        {activeStatuses.length > 0 && (
                          <Tooltip
                            contentStyle={{
                              borderRadius: '8px',
                              border: '1px solid #f1f5f9',
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            }}
                          />
                        )}
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-bold text-gray-900">
                        {stats.summary.totalBookings}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium">Total</span>
                    </div>
                  </div>

                  <div className="w-full min-w-0 space-y-2">
                    {stats.bookingStatusBreakdown.map(
                      (status: { name: string; value: number; color: string }) => (
                        <div
                          key={status.name}
                          className="flex items-center justify-between p-2 rounded-lg bg-gray-50/30 border border-gray-100/50"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: status.color }}
                            />
                            <span className="text-xs font-medium text-gray-600">{status.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-900">
                              {status.value}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-normal">
                              (
                              {stats.summary.totalBookings > 0
                                ? Math.round((status.value / stats.summary.totalBookings) * 100)
                                : 0}
                              %)
                            </span>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">
              {/* User Growth Chart */}
              <Card className={CARD_CLASS}>
                <CardHeader className={CARD_HEADER_CLASS}>
                  <CardTitle className={CARD_TITLE_CLASS}>
                    <Icon
                      icon="solar:users-group-two-rounded-bold-duotone"
                      className="text-primary size-5"
                    />
                    User Growth
                  </CardTitle>
                </CardHeader>
                <CardContent className="!p-3 !pt-4 sm:!p-6">
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stats.userGrowth}
                        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="label"
                          axisLine={false}
                          tickLine={false}
                          tick={TICK_STYLE}
                          tickFormatter={shortLabel}
                          minTickGap={24}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={TICK_STYLE}
                          tickFormatter={compactNumber}
                          allowDecimals={false}
                          width={32}
                        />
                        <Tooltip
                          labelFormatter={(label) => shortLabel(String(label))}
                          contentStyle={{ borderRadius: '8px', border: '1px solid #f1f5f9' }}
                        />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={LEGEND_STYLE} />
                        <Bar
                          dataKey="customers"
                          fill="#6366f1"
                          maxBarSize={18}
                          radius={[4, 4, 0, 0]}
                          name="Customers"
                        />
                        <Bar
                          dataKey="stylists"
                          fill="#8b5cf6"
                          maxBarSize={18}
                          radius={[4, 4, 0, 0]}
                          name="Stylists"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Top Stylists List */}
              <Card className={CARD_CLASS}>
                <CardHeader className={CARD_HEADER_CLASS}>
                  <CardTitle className={CARD_TITLE_CLASS}>
                    <Icon icon="solar:medal-star-bold-duotone" className="text-primary size-5" />
                    Top Performing Stylists
                  </CardTitle>
                </CardHeader>
                <CardContent className="!p-0">
                  {stats.topStylists.length === 0 && (
                    <div className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground">
                      <Icon icon="solar:medal-star-linear" className="size-8 opacity-40" />
                      <p className="text-sm">No stylist bookings in this period.</p>
                    </div>
                  )}
                  <ul className="divide-y lg:hidden">
                    {stats.topStylists.map((stylist) => (
                      <li key={stylist.id} className="flex items-center gap-3 p-4">
                        <Avatar className="size-9 shrink-0 border-2 border-primary/10">
                          {stylist.avatar && <AvatarImage src={stylist.avatar} />}
                          <AvatarFallback className="bg-primary/5 text-[10px] uppercase text-primary">
                            {stylist.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="break-words text-sm font-semibold">{stylist.name}</p>
                          <p className="text-xs text-muted-foreground">
                            ★ {stylist.rating?.toFixed(1) || '0.0'} · {stylist.bookings} bookings
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-bold">{money(stylist.revenue)}</p>
                      </li>
                    ))}
                  </ul>
                  <div
                    className={`hidden overflow-x-auto ${stats.topStylists.length ? 'lg:block' : ''}`}
                  >
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-b border-border/40">
                          <TableHead className="w-[200px] text-xs font-semibold py-3">
                            Stylist
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-center py-3">
                            Bookings
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-right py-3">
                            Revenue
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stats.topStylists.map((stylist) => (
                          <TableRow
                            key={stylist.id}
                            className="border-b border-border/40 hover:bg-muted/30 transition-colors"
                          >
                            <TableCell className="py-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="size-8 border-2 border-primary/10">
                                  {stylist.avatar && <AvatarImage src={stylist.avatar} />}
                                  <AvatarFallback className="bg-primary/5 text-primary text-[10px] uppercase">
                                    {stylist.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {stylist.name}
                                  </p>
                                  <div className="flex items-center gap-1">
                                    <Icon
                                      icon="solar:star-bold"
                                      className="text-amber-400 size-3"
                                    />
                                    <span className="text-[10px] font-medium text-muted-foreground">
                                      {stylist.rating?.toFixed(1) || '0.0'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-4">
                              <Badge
                                variant="secondary"
                                className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none px-2 py-0.5 text-[10px] font-bold"
                              >
                                {stylist.bookings}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right py-4 font-bold text-gray-900 text-sm">
                              {money(stylist.revenue)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </LoadingGate>
    </div>
  );
}

interface AnalyticsCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: string;
  bg: string;
  className?: string;
}

function AnalyticsCard({ title, value, subtitle, icon, color, bg, className }: AnalyticsCardProps) {
  return (
    <Card className={`${CARD_CLASS} rounded-xl ${className ?? ''}`}>
      <CardContent className="flex h-full flex-col gap-2 !p-3 sm:!p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 text-[11px] font-medium uppercase leading-tight tracking-wide text-muted-foreground sm:text-xs">
            {title}
          </p>
          <span
            className={`flex size-8 shrink-0 items-center justify-center rounded-lg sm:size-9 ${bg}`}
          >
            <Icon icon={icon} className={`size-5 ${color}`} />
          </span>
        </div>
        <p className={`mt-auto break-all text-xl font-bold leading-tight sm:text-2xl ${color}`}>
          {value}
        </p>
        <p className="text-[11px] text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
