import { useEffect, useState, useRef } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { showError } from '@/common/utils/swal.utils';
import { MessageType, SenderType } from '../chat.types';
import type { SendMessagePayload } from '../chat.types';
import { RecordingWave } from './RecordingWave';
import { waveformFromBlob } from '../waveform';

interface ChatInputProps {
  isConnected: boolean;
  activeRoomId: string | null;
  userId: string;
  isStylist: boolean;
  isClosed: boolean;
  onSendMessage: (payload: SendMessagePayload) => void;
  onUploadMedia: (file: File) => Promise<string>;
}

export function ChatInput({
  isConnected,
  activeRoomId,
  userId,
  isStylist,
  isClosed,
  onSendMessage,
  onUploadMedia,
}: ChatInputProps) {
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const recordingStartRef = useRef(0);
  const cancelledRef = useRef(false);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);

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

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showError('Upload Error', 'Please select an image file');
      return;
    }
    try {
      setIsUploading(true);
      const mediaUrl = await onUploadMedia(file);
      if (!activeRoomId) return;
      onSendMessage({
        chatRoomId: activeRoomId,
        senderId: userId,
        senderType: isStylist ? SenderType.STYLIST : SenderType.USER,
        messageType: MessageType.IMAGE,
        mediaUrl,
      });
    } catch (err: unknown) {
      showError('Upload Failed', (err as Error).message || 'Image upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
      recordingStartRef.current = Date.now();
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
        const duration = Math.max(1, Math.round((Date.now() - recordingStartRef.current) / 1000));
        if (audioBlob.size === 0) {
          showError('Recording Failed', 'No audio was captured. Please try again.');
          return;
        }
        const waveform = await waveformFromBlob(audioBlob);
        await handleAudioUpload(audioBlob, mimeType, duration, waveform);
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

  const handleAudioUpload = async (
    blob: Blob,
    mimeType: string,
    duration: number,
    waveform?: number[],
  ) => {
    try {
      setIsUploading(true);
      const ext = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm';
      const file = new File([blob], `voice_${Date.now()}.${ext}`, { type: mimeType });
      const mediaUrl = await onUploadMedia(file);
      if (!activeRoomId) return;
      onSendMessage({
        chatRoomId: activeRoomId,
        senderId: userId,
        senderType: isStylist ? SenderType.STYLIST : SenderType.USER,
        messageType: MessageType.VOICE,
        mediaUrl,
        duration,
        waveform,
      });
    } catch (err: unknown) {
      showError('Upload Failed', (err as Error).message || 'Voice upload failed');
    } finally {
      setIsUploading(false);
    }
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
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          ref={fileInputRef}
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
          <Button
            variant="ghost"
            size="icon"
            aria-label="Send a photo"
            className="shrink-0 h-11 w-11 rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground active:scale-95 transition-all"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || !isConnected}
          >
            <Icon
              icon={isUploading ? 'solar:spinner-bold-duotone' : 'solar:camera-bold'}
              className={`size-5 ${isUploading ? 'animate-spin opacity-50' : ''}`}
            />
          </Button>
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
            disabled={isUploading || !isConnected}
          >
            <Icon icon="solar:microphone-bold" className="size-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
