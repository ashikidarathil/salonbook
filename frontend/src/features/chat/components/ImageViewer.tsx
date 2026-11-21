import { useEffect, useRef, useState } from 'react';
import type { PointerEvent, WheelEvent } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Icon } from '@iconify/react';

export interface ViewerImage {
  url: string;
  caption?: string;
}

interface ImageViewerProps {
  images: ViewerImage[];
  startIndex: number;
  onClose: () => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const SWIPE_DISTANCE = 60;

const clampZoom = (zoom: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));

const toolButton =
  'size-10 rounded-full flex items-center justify-center text-white hover:bg-white/15 disabled:opacity-40 transition-colors';

/** Full-screen photo viewer: zoom, pan, swipe between photos, download. */
export function ImageViewer({ images, startIndex, onClose }: ImageViewerProps) {
  const [index, setIndex] = useState(startIndex);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDownloading, setIsDownloading] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);
  const swipeStart = useRef<number | null>(null);

  const image = images[index];
  const hasPrev = index > 0;
  const hasNext = index < images.length - 1;

  const applyZoom = (next: number) => {
    const value = clampZoom(next);
    setZoom(value);
    if (value === 1) setOffset({ x: 0, y: 0 });
  };

  const goTo = (next: number) => {
    if (next < 0 || next >= images.length) return;
    setIndex(next);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goTo(index - 1);
      if (e.key === 'ArrowRight') goTo(index + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const moveBy = (dx: number, dy: number) => {
    const box = stageRef.current?.getBoundingClientRect();
    if (!box) return;
    const maxX = (box.width * (zoom - 1)) / 2;
    const maxY = (box.height * (zoom - 1)) / 2;
    setOffset((current) => ({
      x: Math.max(-maxX, Math.min(maxX, current.x + dx)),
      y: Math.max(-maxY, Math.min(maxY, current.y + dy)),
    }));
  };

  const fingerDistance = () => {
    const [a, b] = [...pointers.current.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      pinch.current = { distance: fingerDistance(), zoom };
      swipeStart.current = null;
    } else if (zoom === 1) {
      swipeStart.current = e.clientX;
    }
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const last = pointers.current.get(e.pointerId);
    if (!last) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinch.current) {
      applyZoom((pinch.current.zoom * fingerDistance()) / pinch.current.distance);
    } else if (zoom > 1) {
      moveBy(e.clientX - last.x, e.clientY - last.y);
    }
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (swipeStart.current !== null && pointers.current.size === 0) {
      const moved = e.clientX - swipeStart.current;
      swipeStart.current = null;
      if (moved > SWIPE_DISTANCE) goTo(index - 1);
      if (moved < -SWIPE_DISTANCE) goTo(index + 1);
    }
  };

  const onWheel = (e: WheelEvent<HTMLDivElement>) => applyZoom(zoom - e.deltaY * 0.002);

  const download = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(image.url);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const extension = blob.type.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `salonbook-photo-${Date.now()}.${extension}`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      window.open(image.url, '_blank', 'noopener,noreferrer');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          data-image-viewer
          aria-describedby={undefined}
          className="fixed inset-0 z-[60] flex flex-col bg-black/95 outline-none"
        >
          <DialogPrimitive.Title className="sr-only">Photo viewer</DialogPrimitive.Title>
          <div className="flex shrink-0 items-center gap-1 px-2 py-2 text-white">
            <DialogPrimitive.Close className={toolButton} aria-label="Close photo">
              <Icon icon="solar:close-circle-linear" className="size-6" />
            </DialogPrimitive.Close>
            {images.length > 1 && (
              <span className="ml-1 text-sm tabular-nums opacity-80">
                {index + 1} of {images.length}
              </span>
            )}
            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                className={toolButton}
                aria-label="Zoom out"
                disabled={zoom <= MIN_ZOOM}
                onClick={() => applyZoom(zoom - 0.5)}
              >
                <Icon icon="solar:magnifer-zoom-out-linear" className="size-5" />
              </button>
              <button
                type="button"
                className={toolButton}
                aria-label="Zoom in"
                disabled={zoom >= MAX_ZOOM}
                onClick={() => applyZoom(zoom + 0.5)}
              >
                <Icon icon="solar:magnifer-zoom-in-linear" className="size-5" />
              </button>
              <button
                type="button"
                className={toolButton}
                aria-label="Download photo"
                disabled={isDownloading}
                onClick={download}
              >
                <Icon
                  icon={isDownloading ? 'solar:spinner-bold-duotone' : 'solar:download-linear'}
                  className={`size-5 ${isDownloading ? 'animate-spin' : ''}`}
                />
              </button>
            </div>
          </div>

          <div
            ref={stageRef}
            className={`relative min-h-0 flex-1 touch-none select-none overflow-hidden ${
              zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
            }`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={onWheel}
            onDoubleClick={() => applyZoom(zoom > 1 ? 1 : 2.5)}
          >
            <img
              key={image.url}
              src={image.url}
              alt={image.caption || 'Chat photo'}
              draggable={false}
              className="size-full object-contain"
              style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
            />
            {hasPrev && (
              <button
                type="button"
                aria-label="Previous photo"
                className={`${toolButton} absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 max-md:hidden`}
                onPointerDown={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                onClick={() => goTo(index - 1)}
              >
                <Icon icon="solar:alt-arrow-left-linear" className="size-6" />
              </button>
            )}
            {hasNext && (
              <button
                type="button"
                aria-label="Next photo"
                className={`${toolButton} absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 max-md:hidden`}
                onPointerDown={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                onClick={() => goTo(index + 1)}
              >
                <Icon icon="solar:alt-arrow-right-linear" className="size-6" />
              </button>
            )}
          </div>

          {image.caption && (
            <p className="max-h-24 shrink-0 overflow-y-auto whitespace-pre-wrap break-words px-4 py-3 text-center text-sm text-white">
              {image.caption}
            </p>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
