import { Icon } from '@iconify/react';

import { DELETED_TEXT } from '../deletedPreview';

/** A quiet gray line for a chat whose last message was deleted. */
export function DeletedPreview() {
  return (
    <span className="flex min-w-0 items-center gap-1 italic text-muted-foreground">
      <Icon icon="solar:forbidden-circle-linear" className="size-3.5 shrink-0" />
      <span className="truncate">{DELETED_TEXT}</span>
    </span>
  );
}
