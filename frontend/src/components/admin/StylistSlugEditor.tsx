import { useState } from 'react';
import axios from 'axios';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { stylistInviteService } from '@/services/stylistInvite.service';
import { slugFormField } from '@/common/utils/slug';
import { showError, showSuccess } from '@/common/utils/swal.utils';

/** Shows a stylist's public profile address and lets the admin change its URL name. */
export function StylistSlugEditor({ stylistId, slug }: { stylistId: string; slug?: string }) {
  const [current, setCurrent] = useState(slug);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(slug || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const parsed = slugFormField.safeParse(draft);
    const value = parsed.success ? parsed.data : undefined;
    if (!parsed.success || !value) {
      showError(
        'Invalid URL name',
        parsed.success ? 'Enter a URL name' : parsed.error.issues[0].message,
      );
      return;
    }
    setSaving(true);
    try {
      const res = await stylistInviteService.updateSlug(stylistId, value);
      setCurrent(res.data.data.slug);
      setEditing(false);
      showSuccess('Saved', `Profile address is now /stylists/${res.data.data.slug}`);
    } catch (err) {
      showError(
        'Could not save',
        (axios.isAxiosError(err) && err.response?.data?.message) || 'Please try again',
      );
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Icon icon="solar:link-bold" className="size-4 opacity-50" />
        <span className="break-all">
          salonbook.online/stylists/
          <span className="font-medium text-slate-700">{current || '—'}</span>
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-primary"
          onClick={() => {
            setDraft(current || '');
            setEditing(true);
          }}
        >
          Edit
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-slate-500">salonbook.online/stylists/</span>
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="h-8 w-56"
        aria-label="Stylist URL name"
        autoFocus
      />
      <Button size="sm" className="h-8" onClick={save} disabled={saving}>
        {saving ? 'Saving…' : 'Save'}
      </Button>
      <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditing(false)}>
        Cancel
      </Button>
      <p className="w-full text-xs text-amber-600">
        Old links using “{current}” will stop working after the change.
      </p>
    </div>
  );
}
