import { Icon } from '@iconify/react';
import { Card, CardContent } from '@/components/ui/card';
import { CARD_CLASS } from './dashboard.utils';

interface AnalyticsCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: string;
  bg: string;
  className?: string;
}

/** One headline number on a dashboard. */
export function AnalyticsCard({
  title,
  value,
  subtitle,
  icon,
  color,
  bg,
  className,
}: AnalyticsCardProps) {
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
