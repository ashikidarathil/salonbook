import { useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Icon } from '@iconify/react';

export interface PhotoDraft {
  id: string;
  file: File;
  previewUrl: string;
  caption: string;
}

interface PhotoComposerProps {
  drafts: PhotoDraft[];
  maxPhotos: number;
  error: string | null;
  onCaptionChange: (id: string, caption: string) => void;
  onRemove: (id: string) => void;
  onAddMore: () => void;
  onSend: () => void;
  onClose: () => void;
}

/** Full-screen preview of the chosen photos, each with its own caption. */
export function PhotoComposer({
  drafts,
  maxPhotos,
  error,
  onCaptionChange,
  onRemove,
  onAddMore,
  onSend,
  onClose,
}: PhotoComposerProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = drafts.find((draft) => draft.id === activeId) ?? drafts[0];

  if (!active) return null;

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          data-photo-composer
          aria-describedby={undefined}
          className="fixed inset-0 z-[60] flex flex-col bg-neutral-950 text-white outline-none"
        >
          <DialogPrimitive.Title className="sr-only">Send photos</DialogPrimitive.Title>
          <div className="flex shrink-0 items-center gap-2 px-2 py-2">
            <button
              type="button"
              aria-label="Discard photos"
              onClick={onClose}
              className="flex size-10 items-center justify-center rounded-full hover:bg-white/15 disabled:opacity-40"
            >
              <Icon icon="solar:close-circle-linear" className="size-6" />
            </button>
            <span className="text-sm opacity-80">
              {drafts.length} {drafts.length === 1 ? 'photo' : 'photos'}
            </span>
            <button
              type="button"
              aria-label="Remove this photo"
              onClick={() => onRemove(active.id)}
              className="ml-auto flex size-10 items-center justify-center rounded-full hover:bg-white/15 disabled:opacity-40"
            >
              <Icon icon="solar:trash-bin-trash-linear" className="size-5" />
            </button>
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center px-3">
            <img
              src={active.previewUrl}
              alt={`Preview of ${active.file.name}`}
              className="max-h-full max-w-full rounded-md object-contain"
            />
          </div>

          <div className="shrink-0 space-y-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
            {error && (
              <p role="alert" className="rounded-md bg-red-500/20 px-3 py-2 text-sm text-red-100">
                {error}
              </p>
            )}

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {drafts.map((draft, i) => (
                <button
                  key={draft.id}
                  type="button"
                  aria-label={`Show photo ${i + 1}`}
                  aria-pressed={draft.id === active.id}
                  onClick={() => setActiveId(draft.id)}
                  className={`size-14 shrink-0 overflow-hidden rounded-md border-2 ${
                    draft.id === active.id ? 'border-white' : 'border-transparent opacity-70'
                  }`}
                >
                  <img src={draft.previewUrl} alt="" className="size-full object-cover" />
                </button>
              ))}
              {drafts.length < maxPhotos && (
                <button
                  type="button"
                  aria-label="Add more photos"
                  onClick={onAddMore}
                  className="flex size-14 shrink-0 items-center justify-center rounded-md border border-dashed border-white/50 hover:bg-white/10 disabled:opacity-40"
                >
                  <Icon icon="solar:add-circle-linear" className="size-6" />
                </button>
              )}
            </div>

            <div className="mx-auto flex w-full max-w-3xl items-center gap-2">
              <input
                value={active.caption}
                maxLength={1000}
                placeholder="Add a caption..."
                aria-label="Photo caption"
                onChange={(e) => onCaptionChange(active.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSend();
                }}
                className="h-11 min-w-0 flex-1 rounded-full bg-white/10 px-4 text-base outline-none placeholder:text-white/50 focus:ring-2 focus:ring-white/40 md:text-sm"
              />
              <button
                type="button"
                aria-label={`Send ${drafts.length} ${drafts.length === 1 ? 'photo' : 'photos'}`}
                onClick={onSend}
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                <Icon icon="solar:plain-bold" className="size-5 rotate-45" />
              </button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
