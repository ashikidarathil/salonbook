import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { format, isSameDay, parseISO } from 'date-fns';
import { ChevronRight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/features/notification/state/notification.thunks';
import type { INotification } from '@/features/notification/types/notification.types';
import { NotificationType } from '@/features/notification/types/notification.types';
import { LoadingGate } from '@/components/common/LoadingGate';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useListParams } from '@/hooks/useListParams';
import { cn } from '@/lib/utils';

const STATUS_TABS = [
  { value: 'ALL', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
] as const;

const TYPE_STYLE: Partial<Record<NotificationType, { icon: string; color: string }>> = {
  [NotificationType.CHAT_MESSAGE]: { icon: 'solar:chat-round-line-bold', color: '' },
  [NotificationType.BOOKING_CANCELLED]: {
    icon: 'solar:calendar-minimalistic-bold',
    color: 'bg-red-50 text-red-500',
  },
  [NotificationType.BOOKING_COMPLETED]: {
    icon: 'solar:check-circle-bold',
    color: 'bg-blue-50 text-blue-500',
  },
};

const isDay = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

/** The notifications page for customers, stylists and admins. */
export default function NotificationsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { notifications, isLoading, error, unreadCount } = useAppSelector(
    (state) => state.notification,
  );

  // Filters live in the address, so a refresh or coming back keeps them
  const list = useListParams();
  const status = list.value('status');
  const day = isDay(list.value('day')) ? list.value('day') : '';

  useEffect(() => {
    dispatch(fetchNotifications({ limit: 50 }));
  }, [dispatch]);

  const visible = notifications.filter((notification) => {
    if (status === 'unread' && notification.isRead) return false;
    if (status === 'read' && !notification.isRead) return false;
    if (day && !isSameDay(new Date(notification.createdAt), parseISO(day))) return false;
    return true;
  });

  const openNotification = (notification: INotification) => {
    if (!notification.isRead) dispatch(markNotificationAsRead(notification.id));
    if (notification.link) navigate(notification.link);
  };

  return (
    <div className={cn('w-full space-y-5', pathname.startsWith('/profile') && 'p-4 sm:p-6 lg:p-8')}>
      <PageHeader
        title="Notifications"
        description="Stay updated with your latest activities."
        breadcrumbs={[{ label: 'Notifications' }]}
        actions={
          unreadCount > 0 ? (
            <Button
              variant="outline"
              className="h-10 w-full gap-2 sm:w-auto"
              onClick={() => dispatch(markAllNotificationsAsRead())}
            >
              <Icon icon="solar:check-read-linear" className="size-4" />
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-3 sm:grid-cols-[minmax(0,20rem)_minmax(0,12rem)] sm:justify-between">
        <div
          className="grid grid-cols-3 gap-1 rounded-xl border bg-muted/40 p-1"
          role="group"
          aria-label="Filter by status"
        >
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              aria-pressed={status === tab.value}
              onClick={() => list.update({ status: tab.value })}
              className={cn(
                'h-8 min-w-0 whitespace-nowrap rounded-lg px-1 text-xs font-semibold transition-colors sm:text-sm',
                status === tab.value
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
              {tab.value === 'unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
            </button>
          ))}
        </div>
        <Input
          type="date"
          aria-label="Filter by day"
          value={day}
          onChange={(event) => list.update({ day: event.target.value || undefined })}
          className={cn('h-10 min-w-0', day && 'border-primary')}
        />
      </div>

      <LoadingGate
        loading={isLoading}
        error={error}
        data={visible}
        emptyMessage="No notifications found for the selected filters."
        emptyIcon="solar:bell-off-bold-duotone"
      >
        <ul className="space-y-3">
          {visible.map((notification) => {
            const style = TYPE_STYLE[notification.type];
            return (
              <li key={notification.id}>
                <button
                  type="button"
                  onClick={() => openNotification(notification)}
                  className={cn(
                    'flex w-full min-w-0 items-start gap-3 rounded-2xl border p-4 text-left shadow-sm transition-shadow hover:shadow-md sm:gap-4',
                    notification.isRead ? 'bg-white' : 'border-primary/20 bg-primary/5',
                  )}
                >
                  <span
                    className={cn(
                      'shrink-0 rounded-full p-2.5',
                      style?.color || 'bg-primary/10 text-primary',
                    )}
                  >
                    <Icon icon={style?.icon || 'solar:bell-bold'} className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                      <span
                        className={cn(
                          'min-w-0 break-words font-semibold',
                          notification.isRead ? 'text-muted-foreground' : 'text-foreground',
                        )}
                      >
                        {notification.title}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {format(new Date(notification.createdAt), 'd MMM, h:mm a')}
                      </span>
                    </span>
                    <span className="block break-words text-sm leading-relaxed text-muted-foreground">
                      {notification.message}
                    </span>
                    {!notification.isRead && (
                      <Badge className="h-5 text-[10px] uppercase tracking-wider">New</Badge>
                    )}
                  </span>
                  {notification.link && (
                    <ChevronRight className="mt-1 size-5 shrink-0 text-muted-foreground/40" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </LoadingGate>
    </div>
  );
}
