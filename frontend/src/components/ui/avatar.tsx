import * as React from 'react';
import { cn } from '@/lib/utils';
import type { UIProps } from '@/types/ui';

export function Avatar({ children, className }: UIProps) {
  return (
    <div className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)}>
      {children}
    </div>
  );
}

/** Covers the fallback. With no photo, or one that fails to load, the fallback shows instead. */
export function AvatarImage({ src }: { src?: string }) {
  const [failedSrc, setFailedSrc] = React.useState<string>();
  if (!src || failedSrc === src) return null;
  return (
    <img
      src={src}
      alt=""
      className="absolute inset-0 z-10 h-full w-full object-cover"
      onError={() => setFailedSrc(src)}
    />
  );
}

export function AvatarFallback({ children, className }: UIProps) {
  return (
    <div
      className={cn('flex items-center justify-center w-full h-full text-sm bg-muted', className)}
    >
      {children}
    </div>
  );
}
