import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { useAppDispatch } from '@/app/hooks';
import { deleteServiceImage, uploadServiceImage } from '@/features/service/serviceThunks';
import type { ServiceImageKind } from '@/features/service/service.types';
import { ERROR_MESSAGES } from '@/common/constants/error.messages';
import { showConfirm, showError, showSuccess } from '@/common/utils/swal.utils';
import { ImageCropper } from '@/components/cropper/ImageCropper';
import { Button } from '@/components/ui/button';

interface ServicePhotoFieldProps {
  serviceId: string;
  kind: ServiceImageKind;
  title: string;
  hint: string;
  url?: string;
  onChanged: () => void;
}

/** One service picture: choose, crop, save or delete. Saves straight away. */
export function ServicePhotoField({
  serviceId,
  kind,
  title,
  hint,
  url,
  onChanged,
}: ServicePhotoFieldProps) {
  const dispatch = useAppDispatch();
  const fileRef = useRef<HTMLInputElement>(null);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(
    () => () => {
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    },
    [pendingPreview],
  );

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setCropSource(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearPending = () => {
    setPendingFile(null);
    setPendingPreview(null);
  };

  const save = async () => {
    if (!pendingFile) return;
    setBusy(true);
    const result = await dispatch(uploadServiceImage({ serviceId, file: pendingFile, kind }));
    setBusy(false);
    if (uploadServiceImage.fulfilled.match(result)) {
      showSuccess('Success', `${title} saved`);
      clearPending();
      onChanged();
    } else {
      showError('Failed', (result.payload as string) || ERROR_MESSAGES.UPLOAD_PICTURE_FAILED);
    }
  };

  const remove = async () => {
    const confirmed = await showConfirm(
      `Delete ${title}?`,
      'Are you sure you want to delete this picture?',
      'Delete',
      'Cancel',
      '#ef4444',
    );
    if (!confirmed) return;
    setBusy(true);
    const result = await dispatch(deleteServiceImage({ serviceId, kind }));
    setBusy(false);
    if (deleteServiceImage.fulfilled.match(result)) {
      showSuccess('Deleted', `${title} deleted`);
      onChanged();
    } else {
      showError('Failed', (result.payload as string) || ERROR_MESSAGES.DELETE_FAILED);
    }
  };

  const photo = pendingPreview ?? url;

  return (
    <div className="min-w-0 space-y-3">
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>
      </div>
      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border-2 border-dashed bg-muted/30">
        {photo ? (
          <img src={photo} alt={title} className="size-full object-cover" />
        ) : (
          <ImagePlus className="size-8 text-muted-foreground" />
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        aria-label={`Choose ${title.toLowerCase()}`}
        className="hidden"
        onChange={onPick}
      />
      <div className="grid gap-2 sm:grid-cols-2 [&>button]:h-10">
        {pendingFile ? (
          <>
            <Button type="button" disabled={busy} onClick={save}>
              {busy ? 'Uploading...' : 'Save Photo'}
            </Button>
            <Button type="button" variant="outline" disabled={busy} onClick={clearPending}>
              Discard
            </Button>
          </>
        ) : (
          <>
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
              <ImagePlus className="mr-2 size-4" />
              {url ? 'Change Photo' : 'Choose Photo'}
            </Button>
            {url && (
              <Button
                type="button"
                variant="outline"
                className="text-red-600"
                disabled={busy}
                onClick={remove}
              >
                <Trash2 className="mr-2 size-4" />
                Delete Photo
              </Button>
            )}
          </>
        )}
      </div>

      {cropSource && (
        <ImageCropper
          open
          imageSrc={cropSource}
          onClose={() => setCropSource(null)}
          onCropComplete={(file) => {
            setPendingFile(file);
            setPendingPreview(URL.createObjectURL(file));
          }}
        />
      )}
    </div>
  );
}
