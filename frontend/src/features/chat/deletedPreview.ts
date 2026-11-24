export const DELETED_TEXT = 'This message was deleted';

/** Older rooms saved the preview with a red emoji in front; both forms count. */
export const isDeletedPreview = (text?: string) => !!text && text.endsWith(DELETED_TEXT);
