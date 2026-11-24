import { Loader } from '@/components/common/Loader';
import { useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { format } from 'date-fns';
import { VoicePlayer } from './VoicePlayer';
import { MessageTicks } from './MessageTicks';
import { ImageViewer } from './ImageViewer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { showConfirm, showError } from '@/common/utils/swal.utils';
import { MessageType } from '../chat.types';
import type { ChatMessage, ChatRoom } from '../chat.types';

interface ChatMessageListProps {
  messages: ChatMessage[];
  activeRoom: ChatRoom | undefined;
  userId: string | undefined;
  isLoading: boolean;
  isClosed: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onImageLoad?: () => void;
  onRetry?: (clientId: string) => void;
  onDelete?: (messageId: string) => Promise<void>;
}

export function ChatMessageList({
  messages,
  activeRoom,
  userId,
  isLoading,
  isClosed,
  messagesEndRef,
  onImageLoad,
  onRetry,
  onDelete,
}: ChatMessageListProps) {
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const photos = useMemo(
    () =>
      messages
        .filter((msg) => msg.messageType === MessageType.IMAGE && msg.mediaUrl && !msg.sendState)
        .map((msg) => ({ url: msg.mediaUrl as string, caption: msg.content })),
    [messages],
  );
  const viewerIndex = photos.findIndex((photo) => photo.url === viewerUrl);

  const confirmDelete = async (messageId: string) => {
    const confirmed = await showConfirm(
      'Delete for everyone?',
      'This message will be removed for you and the other person. This cannot be undone.',
      'Delete for everyone',
      'Cancel',
      '#dc2626',
    );
    if (!confirmed) return;
    setDeletingId(messageId);
    try {
      await onDelete?.(messageId);
    } catch (error) {
      showError('Message not deleted', (error as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full gap-2">
        <Loader label="Loading chat history" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
        <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-3">
          <Icon icon="solar:chat-round-line-duotone" className="size-8 opacity-50" />
        </div>
        <p>No messages yet.</p>
        <p className="text-xs max-w-xs mt-1">
          {isClosed
            ? 'This conversation has been closed.'
            : 'Send a message to start the conversation.'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col px-4 pt-4 pb-2 md:px-6 md:pt-6 overflow-y-auto space-y-6 w-full custom-scrollbar [&>*]:shrink-0">
      {/* Pushes a short conversation down so the newest message sits above the input */}
      <div className="mt-auto" aria-hidden="true" />
      {messages.map((msg, index) => {
        const isMine = msg.senderId === userId;
        const isSystem = msg.messageType === MessageType.SYSTEM;
        const canDelete =
          isMine && !isSystem && !isClosed && !msg.sendState && !msg.deletedAt && !!onDelete;
        const showDateStamp =
          index === 0 ||
          format(new Date(msg.createdAt), 'MMM d') !==
            format(new Date(messages[index - 1].createdAt), 'MMM d');

        return (
          <div key={msg.clientId || msg.id || index} className="flex flex-col gap-4">
            {showDateStamp && (
              <div className="flex justify-center my-4 sticky top-2 z-10">
                <span className="bg-background/80 backdrop-blur shadow-sm border border-border/50 text-xs px-3 py-1 rounded-full text-muted-foreground font-medium">
                  {format(new Date(msg.createdAt), 'EEEE, MMMM d, yyyy')}
                </span>
              </div>
            )}

            {index === 0 && (activeRoom?.bookingNumber || activeRoom?.booking?.bookingNumber) && (
              <div className="flex justify-center my-6">
                <span className="text-[11px] font-bold text-muted-foreground/40 uppercase tracking-[0.3em]">
                  Booking #{activeRoom.bookingNumber || activeRoom.booking?.bookingNumber}
                </span>
              </div>
            )}

            {isSystem ? (
              <div className="flex justify-center my-1 w-full">
                <div className="bg-muted/10 px-4 py-2 rounded-xl text-[11px] text-muted-foreground/50 text-center max-w-sm border border-border/10">
                  {msg.content}
                </div>
              </div>
            ) : (
              <div
                className={`group/msg flex items-end gap-2 w-full ${isMine ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`flex flex-col max-w-[85%] md:max-w-[70%] ${
                    isMine ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                      isMine
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-background border border-border/50 text-foreground rounded-bl-none'
                    }`}
                  >
                    {msg.deletedAt ? (
                      <p className="flex items-center gap-1.5 text-sm italic opacity-75">
                        <Icon icon="solar:forbidden-circle-linear" className="size-4 shrink-0" />
                        {isMine ? 'You deleted this message' : 'This message was deleted'}
                      </p>
                    ) : msg.messageType === MessageType.IMAGE && msg.mediaUrl ? (
                      <button
                        type="button"
                        aria-label="Open photo"
                        disabled={!!msg.sendState}
                        className="relative block cursor-zoom-in text-left disabled:cursor-default"
                        onClick={() => setViewerUrl(msg.mediaUrl as string)}
                      >
                        {msg.sendState === 'sending' && (
                          <span
                            data-photo-sending
                            className="absolute left-1/2 top-1/2 z-10 flex h-9 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/55"
                          >
                            <Loader size="xs" inverse label="Sending photo" />
                          </span>
                        )}
                        <img
                          src={msg.mediaUrl}
                          alt={msg.content || 'Chat attachment'}
                          className="max-sm:max-w-48 max-w-sm rounded-lg object-contain bg-muted/20"
                          loading="lazy"
                          onLoad={onImageLoad}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://placehold.co/400x300?text=Image+Not+Found';
                            onImageLoad?.();
                          }}
                        />
                        {msg.content && (
                          <span className="mt-2 block max-w-48 sm:max-w-sm text-sm [overflow-wrap:anywhere] whitespace-pre-wrap leading-relaxed">
                            {msg.content}
                          </span>
                        )}
                      </button>
                    ) : msg.messageType === MessageType.VOICE && msg.mediaUrl ? (
                      <VoicePlayer
                        src={msg.mediaUrl}
                        duration={msg.duration}
                        waveform={msg.waveform}
                      />
                    ) : msg.messageType === MessageType.TEXT ? (
                      <p className="text-sm [overflow-wrap:anywhere] whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </p>
                    ) : null}
                  </div>
                  <span className="flex items-center gap-1 mt-1 mx-1">
                    {deletingId === msg.id ? (
                      <Loader size="xs" label="Deleting message" />
                    ) : (
                      canDelete && (
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger
                            aria-label="Message options"
                            className="flex size-8 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/msg:opacity-100"
                          >
                            <Icon icon="solar:menu-dots-bold" className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onSelect={() => confirmDelete(msg.id)}
                            >
                              <Icon icon="solar:trash-bin-trash-linear" className="size-4" />
                              Delete for everyone
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )
                    )}
                    <span className="text-[11px] text-muted-foreground opacity-60">
                      {format(new Date(msg.createdAt), 'h:mm a')}
                    </span>
                    {isMine && msg.sendState !== 'failed' && !msg.deletedAt && (
                      <MessageTicks message={msg} />
                    )}
                  </span>
                  {msg.sendState === 'failed' && msg.clientId && (
                    <button
                      type="button"
                      onClick={() => onRetry?.(msg.clientId as string)}
                      className="mx-1 mt-0.5 inline-flex min-h-6 items-center gap-1 text-xs font-medium text-red-600 hover:underline"
                    >
                      <Icon icon="solar:danger-circle-bold" className="size-3.5" />
                      Not sent · Retry
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
      <div ref={messagesEndRef} className="!mt-0 h-px" />
      {viewerIndex >= 0 && (
        <ImageViewer
          key={photos.length}
          images={photos}
          startIndex={viewerIndex}
          onClose={() => setViewerUrl(null)}
        />
      )}
    </div>
  );
}
