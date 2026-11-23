import { useCallback } from 'react';
import { slotService } from '@/services/slot.service';
import {
  closeLoading,
  showApiError,
  showBlockConfirm,
  showConfirm,
  showLoading,
  showSuccess,
  showUnblockConfirm,
} from '@/common/utils/swal.utils';
import type { SlotItem } from './slot.types';
import { slotKind } from './slotBoard';

/** What tapping a slot does: block it, unblock it, or delete a special slot. */
export function useSlotActions(reload: () => Promise<void>) {
  return useCallback(
    async (slot: SlotItem) => {
      const run = async (
        loading: string,
        done: string,
        failed: string,
        action: () => Promise<unknown>,
      ) => {
        showLoading(loading);
        try {
          await action();
          await reload();
          closeLoading();
          showSuccess('Success', done);
        } catch (error) {
          closeLoading();
          showApiError(error, failed);
        }
      };

      const kind = slotKind(slot);
      if (kind === 'AVAILABLE') {
        const reason = await showBlockConfirm();
        if (reason) {
          await run('Blocking slot...', 'Slot blocked', 'Failed to block slot', () =>
            slotService.blockSlot(slot.id, reason),
          );
        }
      } else if (kind === 'BLOCKED') {
        if (await showUnblockConfirm()) {
          await run('Unblocking slot...', 'Slot unblocked', 'Failed to unblock slot', () =>
            slotService.unblockSlot(slot.id),
          );
        }
      } else if (kind === 'SPECIAL') {
        const confirmed = await showConfirm(
          'Delete Special Slot?',
          'This special slot will be removed.',
          'Delete',
          'Cancel',
          '#ef4444',
        );
        if (confirmed) {
          await run(
            'Deleting special slot...',
            'Special slot deleted',
            'Failed to delete special slot',
            () => slotService.cancelSpecialSlot(slot.id.replace(/^special_/, '')),
          );
        }
      }
    },
    [reload],
  );
}
