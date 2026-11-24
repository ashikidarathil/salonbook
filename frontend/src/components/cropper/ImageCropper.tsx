'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import 'react-easy-crop/react-easy-crop.css';

interface ImageCropperProps {
  open: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedFile: File) => void;
  /** Ratio picked when the cropper opens; 'original' keeps the photo's own shape. */
  defaultAspect?: AspectKey;
}

export type AspectKey = 'original' | '1:1' | '4:3' | '3:4' | '3:2' | '16:9' | '9:16';

const ASPECTS: { key: AspectKey; label: string; value?: number }[] = [
  { key: 'original', label: 'Original' },
  { key: '1:1', label: '1:1', value: 1 },
  { key: '4:3', label: '4:3', value: 4 / 3 },
  { key: '3:4', label: '3:4', value: 3 / 4 },
  { key: '3:2', label: '3:2', value: 3 / 2 },
  { key: '16:9', label: '16:9', value: 16 / 9 },
  { key: '9:16', label: '9:16', value: 9 / 16 },
];

interface CroppedAreaPixels {
  width: number;
  height: number;
  x: number;
  y: number;
}

const getRadianAngle = (degreeValue: number): number => {
  return (degreeValue * Math.PI) / 180;
};

/** Size of the box that holds the image once rotated. */
const rotatedSize = (width: number, height: number, rotation: number) => {
  const rad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rad) * width) + Math.abs(Math.sin(rad) * height),
    height: Math.abs(Math.sin(rad) * width) + Math.abs(Math.cos(rad) * height),
  };
};

export function ImageCropper({
  open,
  onClose,
  imageSrc,
  onCropComplete,
  defaultAspect = '4:3',
}: ImageCropperProps) {
  const [aspectKey, setAspectKey] = useState<AspectKey>(defaultAspect);
  const [originalAspect, setOriginalAspect] = useState(4 / 3);
  const aspect =
    ASPECTS.find((item) => item.key === aspectKey)?.value ?? originalAspect;
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropMove = useCallback((location: Point) => {
    setCrop(location);
  }, []);

  const onCropAreaChange = useCallback(
    (_croppedArea: Area, croppedAreaPixels: CroppedAreaPixels) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const handleZoomChange = (value: number[]): void => {
    setZoom(value[0] ?? 1);
  };

  const handleRotationChange = (value: number[]): void => {
    setRotation(value[0] ?? 0);
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (err) => reject(err));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (): Promise<void> => {
    if (!croppedAreaPixels) return;

    try {
      setIsProcessing(true);
      const image = await createImage(imageSrc);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas context not found');
      }

      // Draw the whole rotated photo, then cut out the chosen area.
      // croppedAreaPixels is already in photo pixels, so zoom needs no extra scaling.
      const box = rotatedSize(image.width, image.height, rotation);
      canvas.width = box.width;
      canvas.height = box.height;
      ctx.translate(box.width / 2, box.height / 2);
      ctx.rotate(getRadianAngle(rotation));
      ctx.translate(-image.width / 2, -image.height / 2);
      ctx.drawImage(image, 0, 0);

      const area = ctx.getImageData(
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
      );
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      ctx.putImageData(area, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            throw new Error('Canvas blob not created');
          }

          const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
          onCropComplete(file);
          handleClose();
          setIsProcessing(false);
        },
        'image/jpeg',
        0.95,
      );
    } catch (error) {
      console.error('Error cropping image:', error);
      setIsProcessing(false);
    }
  };

  const handleClose = (): void => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    setAspectKey(defaultAspect);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="theme-admin sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
          <DialogDescription className="sr-only">
            Choose a shape, then drag and zoom to frame the photo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Shape */}
          <div className="flex flex-wrap gap-2" role="group" aria-label="Crop shape">
            {ASPECTS.map((item) => (
              <button
                key={item.key}
                type="button"
                aria-pressed={aspectKey === item.key}
                onClick={() => setAspectKey(item.key)}
                className={cn(
                  'h-9 rounded-full border px-3 text-sm font-medium transition-colors',
                  aspectKey === item.key
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-white hover:bg-muted',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Cropper Container */}
          <div className="relative h-72 w-full overflow-hidden rounded-lg bg-gray-900 sm:h-96">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspect}
              cropShape="rect"
              showGrid
              onCropChange={onCropMove}
              onCropAreaChange={onCropAreaChange}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onMediaLoaded={(media) => setOriginalAspect(media.naturalWidth / media.naturalHeight)}
            />
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Zoom */}
            <div>
              <Label>Zoom: {zoom.toFixed(1)}x</Label>
              <Slider
                value={[zoom]}
                onValueChange={handleZoomChange}
                min={1}
                max={3}
                step={0.1}
                className="mt-2"
              />
            </div>

            {/* Rotation */}
            <div>
              <Label>Rotation: {rotation}°</Label>
              <Slider
                value={[rotation]}
                onValueChange={handleRotationChange}
                min={0}
                max={360}
                step={1}
                className="mt-2"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={getCroppedImg} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Crop & Upload'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
