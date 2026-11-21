import type { ChatMessage } from '../chat.types';

type TickStatus = 'sent' | 'delivered' | 'read';

const getTickStatus = (message: ChatMessage): TickStatus => {
  if (message.isRead) return 'read';
  return message.deliveredAt ? 'delivered' : 'sent';
};

const LABELS: Record<TickStatus, string> = {
  sent: 'Sent',
  delivered: 'Delivered',
  read: 'Read',
};

/** ✓ sent, ✓✓ delivered, blue ✓✓ read */
export function MessageTicks({ message }: { message: ChatMessage }) {
  const status = getTickStatus(message);
  return (
    <span
      role="img"
      aria-label={LABELS[status]}
      title={LABELS[status]}
      data-tick-status={status}
      className={`inline-flex shrink-0 ${status === 'read' ? 'text-sky-500' : 'text-muted-foreground'}`}
    >
      <svg
        viewBox="0 0 18 12"
        className="h-3 w-[18px]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M1.5 6.5 5 10l6-8" />
        {status !== 'sent' && <path d="M8.5 9.2 9.3 10l6-8" />}
      </svg>
    </span>
  );
}
