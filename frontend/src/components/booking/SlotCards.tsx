import type { ReactNode } from 'react';
import type { SlotItem } from '@/features/slot/slot.types';
import { Loader } from '@/components/common/Loader';
import { Button } from '@/components/ui/button';

interface SlotCardsProps {
  slots: SlotItem[];
  loading: boolean;
  emptyMessage: string;
  showStylist?: boolean;
  renderStatus: (status: SlotItem['status']) => ReactNode;
  onToggleBlock: (slot: SlotItem) => void;
}

/** The slot table as cards, for phones and tablets. */
export function SlotCards({
  slots,
  loading,
  emptyMessage,
  showStylist,
  renderStatus,
  onToggleBlock,
}: SlotCardsProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12 lg:hidden">
        <Loader label="Loading slots" />
      </div>
    );
  }
  if (!slots.length) {
    return (
      <p className="p-8 text-center text-sm text-muted-foreground lg:hidden">{emptyMessage}</p>
    );
  }
  return (
    <ul className="divide-y border-t lg:hidden">
      {slots.map((slot) => (
        <li key={slot.id} className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0 space-y-1">
            <p className="font-medium">
              {slot.startTime} - {slot.endTime}
            </p>
            {showStylist && (
              <p className="break-words text-sm text-muted-foreground">
                {slot.stylistName || 'Unknown'}
              </p>
            )}
            {slot.note && <p className="break-words text-xs italic text-red-600">{slot.note}</p>}
            {renderStatus(slot.status)}
          </div>
          <Button
            size="sm"
            variant={slot.status === 'BLOCKED' ? 'outline' : 'destructive'}
            className="shrink-0"
            disabled={!['AVAILABLE', 'BLOCKED'].includes(slot.status)}
            onClick={() => onToggleBlock(slot)}
          >
            {slot.status === 'BLOCKED' ? 'Unblock' : 'Block'}
          </Button>
        </li>
      ))}
    </ul>
  );
}
