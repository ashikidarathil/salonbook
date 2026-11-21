import { useEffect, useState, useRef } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { showError } from '@/common/utils/swal.utils';
import { MessageType, SenderType } from '../chat.types';
import type { MediaSendItem, SendMessagePayload } from '../chat.types';
import { RecordingWave } from './RecordingWave';
import { PhotoComposer } from './PhotoComposer';
import type { PhotoDraft } from './PhotoComposer';
import { CameraCapture } from './CameraCapture';
import { waveformFromBlob } from '../waveform';

const MAX_PHOTOS = 10;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const currentTimeMs = () => Date.now();

interface ChatInputProps {
  isConnected: boolean;
  activeRoomId: string | null;
  userId: string;
  isStylist: boolean;
  isClosed: boolean;
  onSendMessage: (payload: SendMessagePayload) => void;
  onSendMedia: (items: MediaSendItem[]) => void;
}

export function ChatInput({
  isConnected,
  activeRoomId,
  userId,
  isStylist,
  isClosed,
  onSendMessage,
  onSendMedia,
}: ChatInputProps) {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const [drafts, setDrafts] = useState<PhotoDraft[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const draftsRef = useRef<PhotoDraft[]>([]);

  const libraryInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const recordingStartRef = useRef(0);
  const cancelledRef = useRef(false);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);

  const updateDrafts = (next: PhotoDraft[]) => {
    draftsRef.current = next;
    setDrafts(next);
  };

  useEffect(
    () => () => draftsRef.current.forEach((draft) => URL.revokeObjectURL(draft.previewUrl)),
    [],
  );

  // Leaving the chat mid-recording discards it and releases the microphone
  useEffect(
    () => () => {
      cancelledRef.current = true;
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      const recorder = mediaRecorderRef.current;
      if (recorder?.state === 'recording') recorder.stop();
    },
    [],
  );

  const handleSend = () => {
    if (!inputText.trim() || isClosed || !activeRoomId) return;
    onSendMessage({
      chatRoomId: activeRoomId,
      senderId: userId,
      senderType: isStylist ? SenderType.STYLIST : SenderType.USER,
      messageType: MessageType.TEXT,
      content: inputText.trim(),
    });
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  const closeComposerNotice = (message: string) => {
    if (draftsRef.current.length) setPhotoError(message);
    else showError('Photos', message);
  };

  const addPhotos = (files: File[]) => {
    if (!files.length) return;
    const room = MAX_PHOTOS - draftsRef.current.length;
    const valid = files.filter(
      (file) => ALLOWED_PHOTO_TYPES.includes(file.type) && file.size <= MAX_PHOTO_BYTES,
    );
    const accepted = valid.slice(0, Math.max(0, room));
    let notice: string | null = null;
    if (valid.length < files.length) {
      notice = 'Some files were skipped. Use JPG, PNG, WebP or GIF photos up to 10 MB.';
    } else if (accepted.length < valid.length) {
      notice = `You can send up to ${MAX_PHOTOS} photos at once.`;
    }
    const added = accepted.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      caption: '',
    }));
    if (added.length) updateDrafts([...draftsRef.current, ...added]);
    setPhotoError(null);
    if (notice) closeComposerNotice(notice);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    addPhotos(Array.from(e.target.files ?? []));
    e.target.value = '';
  };

  const openCamera = () => {
    // Phones open their own camera app; laptops use the webcam screen
    if (window.matchMedia('(pointer: coarse)').matches) cameraInputRef.current?.click();
    else setIsCameraOpen(true);
  };

  const removeDraft = (id: string) => {
    const draft = draftsRef.current.find((item) => item.id === id);
    if (draft) URL.revokeObjectURL(draft.previewUrl);
    updateDrafts(draftsRef.current.filter((item) => item.id !== id));
  };

  const discardDrafts = () => {
    draftsRef.current.forEach((draft) => URL.revokeObjectURL(draft.previewUrl));
    updateDrafts([]);
    setPhotoError(null);
  };

  const sendPhotos = () => {
    if (!activeRoomId) return;
    onSendMedia(
      draftsRef.current.map((draft) => ({
        file: draft.file,
        payload: {
          chatRoomId: activeRoomId,
          senderId: userId,
          senderType: isStylist ? SenderType.STYLIST : SenderType.USER,
          messageType: MessageType.IMAGE,
          content: draft.caption.trim() || undefined,
        },
      })),
    );
    discardDrafts();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Chrome/Firefox record webm; Safari (Mac + iPhone) only records mp4
      const preferred = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find(
        (t) => MediaRecorder.isTypeSupported?.(t),
      );
      const mediaRecorder = new MediaRecorder(stream, preferred ? { mimeType: preferred } : {});
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      recordingStartRef.current = currentTimeMs();
      cancelledRef.current = false;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        if (cancelledRef.current) return;
        const mimeType = (mediaRecorder.mimeType || preferred || 'audio/webm').split(';')[0];
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        // Measured here: the recordingDuration state captured by this closure is stale (0)
        const duration = Math.max(
          1,
          Math.round((currentTimeMs() - recordingStartRef.current) / 1000),
        );
        if (audioBlob.size === 0) {
          showError('Recording Failed', 'No audio was captured. Please try again.');
          return;
        }
        const waveform = await waveformFromBlob(audioBlob);
        sendVoice(audioBlob, mimeType, duration, waveform);
      };

      mediaRecorder.start();
      setRecordingStream(stream);
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch {
      showError('Microphone Error', 'Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingStream(null);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const cancelRecording = () => {
    cancelledRef.current = true;
    stopRecording();
  };

  const sendVoice = (blob: Blob, mimeType: string, duration: number, waveform?: number[]) => {
    if (!activeRoomId) return;
    const ext = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm';
    onSendMedia([
      {
        file: new File([blob], `voice_${Date.now()}.${ext}`, { type: mimeType }),
        payload: {
          chatRoomId: activeRoomId,
          senderId: userId,
          senderType: isStylist ? SenderType.STYLIST : SenderType.USER,
          messageType: MessageType.VOICE,
          duration,
          waveform,
        },
      },
    ]);
  };

  if (isClosed) {
    return (
      <div className="p-4 bg-background/80 backdrop-blur border-t border-border/50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon icon="solar:lock-bold-duotone" className="size-4" />
          <span>This chat is closed — messaging is disabled.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-4 bg-background/95 backdrop-blur-md border-t border-border/50 sticky bottom-0 shrink-0 w-full pb-safe-offset-2 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] z-20">
      <div className="flex items-end gap-2 max-w-4xl mx-auto w-full">
        <input
          ref={libraryInputRef}
          data-photo-library
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotoSelect}
          className="hidden"
        />
        <input
          ref={filesInputRef}
          data-photo-files
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.gif"
          multiple
          onChange={handlePhotoSelect}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoSelect}
          className="hidden"
        />
        {isRecording ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete recording"
            className="shrink-0 h-11 w-11 rounded-full text-red-500 hover:bg-red-50 hover:text-red-600 active:scale-95 transition-all"
            onClick={cancelRecording}
          >
            <Icon icon="solar:trash-bin-trash-bold" className="size-5" />
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Attach"
                className="shrink-0 h-11 w-11 rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground active:scale-95 transition-all"
                disabled={!isConnected}
              >
                <Icon icon="solar:paperclip-linear" className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-44">
              <DropdownMenuItem onSelect={() => libraryInputRef.current?.click()}>
                <Icon icon="solar:gallery-bold" className="mr-2 size-4" />
                Photos
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={openCamera}>
                <Icon icon="solar:camera-bold" className="mr-2 size-4" />
                Camera
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => filesInputRef.current?.click()}>
                <Icon icon="solar:folder-bold" className="mr-2 size-4" />
                Files
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className="flex-1 min-w-0 relative bg-muted/30 rounded-2xl border border-border/50 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-sm">
          {isRecording ? (
            <div className="w-full flex items-center gap-3 px-4 py-2.5 text-sm">
              <div className="size-2 shrink-0 rounded-full bg-red-500 animate-pulse" />
              <span className="shrink-0 text-muted-foreground font-mono tabular-nums">
                {Math.floor(recordingDuration / 60)}:
                {(recordingDuration % 60).toString().padStart(2, '0')}
              </span>
              <span className="sr-only">Recording</span>
              {recordingStream && <RecordingWave stream={recordingStream} />}
            </div>
          ) : (
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
              className="w-full bg-transparent border-none min-h-[44px] px-4 py-3 placeholder:text-muted-foreground/60 shadow-none focus-visible:ring-0"
              disabled={!isConnected}
            />
          )}
        </div>

        {isRecording ? (
          <Button
            size="icon"
            aria-label="Send voice message"
            onClick={stopRecording}
            className="shrink-0 h-11 w-11 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm active:scale-95 transition-all animate-in zoom-in"
          >
            <Icon icon="solar:plain-bold" className="size-5 transform rotate-45 mr-0.5 mt-0.5" />
          </Button>
        ) : inputText.trim() ? (
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!isConnected}
            className="shrink-0 h-11 w-11 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm active:scale-95 transition-all animate-in zoom-in"
          >
            <Icon icon="solar:plain-bold" className="size-5 transform rotate-45 mr-0.5 mt-0.5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Record a voice message"
            className="shrink-0 h-11 w-11 rounded-full text-muted-foreground hover:bg-muted/50 hover:text-primary active:scale-95 transition-all"
            onClick={startRecording}
            disabled={!isConnected}
          >
            <Icon icon="solar:microphone-bold" className="size-5" />
          </Button>
        )}
      </div>

      {drafts.length > 0 && (
        <PhotoComposer
          drafts={drafts}
          maxPhotos={MAX_PHOTOS}
          error={photoError}
          onCaptionChange={(id, caption) =>
            updateDrafts(
              draftsRef.current.map((draft) => (draft.id === id ? { ...draft, caption } : draft)),
            )
          }
          onRemove={(id) => {
            setPhotoError(null);
            removeDraft(id);
          }}
          onAddMore={() => libraryInputRef.current?.click()}
          onSend={sendPhotos}
          onClose={discardDrafts}
        />
      )}
      {isCameraOpen && (
        <CameraCapture
          onClose={() => setIsCameraOpen(false)}
          onCapture={(file) => {
            setIsCameraOpen(false);
            addPhotos([file]);
          }}
        />
      )}
    </div>
  );
}
