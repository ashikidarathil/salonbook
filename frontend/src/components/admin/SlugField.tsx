import type { InputHTMLAttributes } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { slugify } from '@/common/utils/slug';

interface SlugFieldProps {
  /** e.g. "/branches/" — shown in the preview */
  pathPrefix: string;
  /** Current value of the field (watch('slug')) */
  value?: string;
  /** Name the slug would be generated from when left empty */
  sourceName?: string;
  /** Already-saved slug when editing */
  savedSlug?: string;
  error?: string;
  inputProps: InputHTMLAttributes<HTMLInputElement>;
}

/** "URL name" input with a live preview of the public address. */
export function SlugField({
  pathPrefix,
  value,
  sourceName,
  savedSlug,
  error,
  inputProps,
}: SlugFieldProps) {
  const auto = savedSlug || slugify(sourceName || '');
  const shown = value?.trim() || auto || '…';
  return (
    <div>
      <Label htmlFor="slug">URL name (optional)</Label>
      <Input id="slug" placeholder={auto || 'created from the name'} {...inputProps} />
      <p className="mt-1 text-xs text-muted-foreground break-all">
        salonbook.online{pathPrefix}
        <span className="font-medium text-foreground">{shown}</span>
      </p>
      {!value?.trim() && !savedSlug && (
        <p className="text-xs text-muted-foreground">Leave empty to create it from the name.</p>
      )}
      {savedSlug && value?.trim() && value.trim() !== savedSlug && (
        <p className="text-xs text-amber-600">
          Changing this changes the page address; old links using “{savedSlug}” will stop working.
        </p>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
