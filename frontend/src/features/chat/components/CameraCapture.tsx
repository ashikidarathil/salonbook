import { useEffect, useRef, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Icon } from '@iconify/react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

/** Webcam capture for laptops. Phones use their own camera app instead. */
export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((media) => {
        if (cancelled) {
          media.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = media;
        if (videoRef.current) videoRef.current.srcObject = media;
      })
      .catch(() => setError('Could not open the camera. Please check its permission.'));
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const capture = () => {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError('Could not take the photo. Please try again.');
          return;
        }
        onCapture(new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.9,
    );
  };

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          data-camera-capture
          aria-describedby={undefined}
          className="fixed inset-0 z-[60] flex flex-col bg-black text-white outline-none"
        >
          <DialogPrimitive.Title className="sr-only">Take a photo</DialogPrimitive.Title>
          <div className="shrink-0 px-2 py-2">
            <DialogPrimitive.Close
              aria-label="Close camera"
              className="flex size-10 items-center justify-center rounded-full hover:bg-white/15"
            >
              <Icon icon="solar:close-circle-linear" className="size-6" />
            </DialogPrimitive.Close>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center px-3">
            {error ? (
              <p role="alert" className="max-w-sm text-center text-sm">
                {error}
              </p>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onLoadedData={() => setIsReady(true)}
                className="max-h-full max-w-full rounded-md"
              />
            )}
          </div>
          <div className="flex shrink-0 justify-center py-5">
            <button
              type="button"
              aria-label="Take photo"
              disabled={!isReady || !!error}
              onClick={capture}
              className="size-16 rounded-full border-4 border-white bg-white/30 hover:bg-white/50 disabled:opacity-40"
            />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
