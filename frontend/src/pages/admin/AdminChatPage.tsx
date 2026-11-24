import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { format } from 'date-fns';
import { ArrowLeft, RefreshCw, Search } from 'lucide-react';
import { Loader } from '@/components/common/Loader';
import { PageHeader } from '@/components/common/PageHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import ChatService from '@/services/chat.service';
import { MessageType, SenderType } from '@/features/chat/chat.types';
import type { ChatRoom, ChatMessage } from '@/features/chat/chat.types';
import { ImageViewer } from '@/features/chat/components/ImageViewer';
import { VoicePlayer } from '@/features/chat/components/VoicePlayer';

const CHAT_OPEN_HOURS = 24;

const customerName = (room: ChatRoom) => room.user?.name || room.userName || 'Customer';
const stylistName = (room: ChatRoom) => room.stylist?.name || room.stylistName || 'Stylist';
const bookingNumber = (room: ChatRoom) => room.booking?.bookingNumber || room.bookingNumber;

/** A chat closes a day after its booking is completed or cancelled. */
const isChatClosed = (room: ChatRoom) => {
  if (!room.booking) return false;
  const { status, completedAt, cancelledAt } = room.booking;
  if (status !== 'COMPLETED' && status !== 'CANCELLED') return false;
  const actionAt = status === 'COMPLETED' ? completedAt : cancelledAt;
  if (!actionAt) return false;
  return Date.now() - new Date(actionAt).getTime() > CHAT_OPEN_HOURS * 60 * 60 * 1000;
};

function RoomAvatars({ room, size = 'md' }: { room: ChatRoom; size?: 'md' | 'sm' }) {
  return (
    <div className="relative shrink-0">
      <Avatar className={cn('border', size === 'md' ? 'size-11' : 'size-10')}>
        <AvatarImage src={room.user?.profilePicture || undefined} />
        <AvatarFallback>{customerName(room).charAt(0)}</AvatarFallback>
      </Avatar>
      <Avatar className="absolute -bottom-1 -right-1 size-6 border-2 border-background">
        <AvatarImage src={room.stylist?.profilePicture || undefined} />
        <AvatarFallback className="text-[10px]">{stylistName(room).charAt(0)}</AvatarFallback>
      </Avatar>
    </div>
  );
}

export default function AdminChatPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const roomId = params.get('room');

  const [rooms, setRooms] = useState<ChatRoom[] | null>(null);
  const [search, setSearch] = useState('');
  const [thread, setThread] = useState<{ roomId: string; messages: ChatMessage[] } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeRoom = rooms?.find((room) => room.id === roomId) ?? null;
  const messages = thread && thread.roomId === roomId ? thread.messages : [];
  const loadingMessages = !!roomId && thread?.roomId !== roomId;
  const photos = messages
    .filter((msg) => msg.messageType === MessageType.IMAGE && msg.mediaUrl && !msg.deletedAt)
    .map((msg) => ({ url: msg.mediaUrl as string, caption: msg.content }));
  const viewerIndex = photos.findIndex((photo) => photo.url === viewerUrl);

  const query = search.trim().toLowerCase();
  const visibleRooms = (rooms ?? []).filter((room) =>
    [customerName(room), stylistName(room), bookingNumber(room)]
      .join(' ')
      .toLowerCase()
      .includes(query),
  );

  const loadRooms = useCallback(async () => {
    try {
      setRooms(await ChatService.getAdminRooms());
    } catch {
      setRooms((current) => current ?? []);
    }
  }, []);

  const loadMessages = useCallback(async (id: string) => {
    try {
      const data = await ChatService.getRoomMessages(id);
      setThread({ roomId: id, messages: data });
    } catch {
      setThread({ roomId: id, messages: [] });
    }
  }, []);

  useEffect(() => {
    let active = true;
    ChatService.getAdminRooms()
      .then((data) => active && setRooms(data))
      .catch(() => active && setRooms((current) => current ?? []));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!roomId) return;
    let active = true;
    ChatService.getRoomMessages(roomId)
      .then((data) => active && setThread({ roomId, messages: data }))
      .catch(() => active && setThread({ roomId, messages: [] }));
    return () => {
      active = false;
    };
  }, [roomId]);

  useEffect(() => {
    // Open at the newest message without moving the page itself
    const box = scrollRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [thread]);

  const openRoom = (id: string) => setParams({ room: id }, { state: { fromList: true } });
  const closeRoom = () => {
    if ((location.state as { fromList?: boolean } | null)?.fromList) navigate(-1);
    else setParams({}, { replace: true });
  };

  const refresh = async () => {
    if (!roomId) return;
    setRefreshing(true);
    await Promise.all([loadMessages(roomId), loadRooms()]);
    setRefreshing(false);
  };

  const senderName = (message: ChatMessage) => {
    if (message.senderType === SenderType.SYSTEM) return 'System';
    if (!activeRoom) return '';
    return message.senderType === SenderType.STYLIST
      ? stylistName(activeRoom)
      : customerName(activeRoom);
  };

  const roomList = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search chats"
            placeholder="Search name or booking..."
            className="h-10 pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {rooms === null ? (
          <div className="flex justify-center py-12">
            <Loader label="Loading chats" />
          </div>
        ) : visibleRooms.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Icon
              icon="solar:chat-square-broken"
              className="mx-auto size-12 text-muted-foreground/30"
            />
            <p className="mt-2 text-sm text-muted-foreground">
              {rooms.length ? 'No chats match your search' : 'No chats yet'}
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {visibleRooms.map((room) => (
              <li key={room.id}>
                <button
                  type="button"
                  onClick={() => openRoom(room.id)}
                  aria-current={room.id === roomId ? 'true' : undefined}
                  className={cn(
                    'flex w-full min-w-0 items-center gap-3 border-l-4 border-transparent p-4 text-left transition-colors hover:bg-muted/50',
                    room.id === roomId && 'border-primary bg-primary/5',
                  )}
                >
                  <RoomAvatars room={room} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="min-w-0 truncate text-sm font-semibold">
                        {customerName(room)} & {stylistName(room)}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {room.lastMessageAt ? format(new Date(room.lastMessageAt), 'd MMM') : ''}
                      </span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="truncate">#{bookingNumber(room)}</span>
                      {isChatClosed(room) && (
                        <Badge variant="outline" className="h-5 shrink-0 px-1.5 text-[10px]">
                          Closed
                        </Badge>
                      )}
                    </span>
                    <span className="mt-1 block truncate text-xs text-foreground/80">
                      {room.lastMessage || 'No messages yet'}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  const conversation = activeRoom ? (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b p-3 sm:gap-3 sm:p-4">
        <Button
          variant="ghost"
          size="icon"
          className="size-10 shrink-0 lg:hidden"
          aria-label="Back to chats"
          onClick={closeRoom}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <RoomAvatars room={activeRoom} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold sm:text-base">
            {customerName(activeRoom)} & {stylistName(activeRoom)}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            Booking #{bookingNumber(activeRoom)}
            {isChatClosed(activeRoom) ? ' · Closed' : ''}
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="size-10 shrink-0"
          aria-label="Refresh messages"
          disabled={refreshing}
          onClick={refresh}
        >
          <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} />
        </Button>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto bg-muted/20 p-3 sm:p-4">
        {loadingMessages ? (
          <div className="flex h-full items-center justify-center">
            <Loader label="Loading messages" />
          </div>
        ) : messages.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No messages yet</p>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const side =
                msg.senderType === SenderType.USER
                  ? 'items-start'
                  : msg.senderType === SenderType.STYLIST
                    ? 'items-end'
                    : 'items-center';
              return (
                <div key={msg.id} className={cn('flex min-w-0 flex-col', side)}>
                  <div className="mb-1 flex items-center gap-2 px-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {senderName(msg)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(msg.createdAt), 'd MMM, p')}
                    </span>
                  </div>
                  <div
                    className={cn(
                      'max-w-[85%] break-words rounded-2xl px-4 py-2 text-sm sm:max-w-[75%]',
                      msg.senderType === SenderType.USER && 'rounded-tl-none border bg-white',
                      msg.senderType === SenderType.STYLIST &&
                        'rounded-tr-none bg-primary text-primary-foreground',
                      msg.senderType === SenderType.SYSTEM &&
                        'border border-orange-200 bg-orange-50 text-xs italic text-orange-800',
                    )}
                  >
                    {msg.deletedAt ? (
                      <p className="italic opacity-75">This message was deleted</p>
                    ) : msg.messageType === MessageType.IMAGE ? (
                      <button
                        type="button"
                        aria-label="Open photo"
                        className="block cursor-zoom-in text-left"
                        onClick={() => setViewerUrl(msg.mediaUrl ?? null)}
                      >
                        <img
                          src={msg.mediaUrl}
                          alt={msg.content || 'Shared photo'}
                          className="max-h-72 max-w-full rounded-lg border border-black/5 object-cover"
                        />
                        {msg.content && (
                          <span className="mt-2 block whitespace-pre-wrap">{msg.content}</span>
                        )}
                      </button>
                    ) : msg.messageType === MessageType.VOICE && msg.mediaUrl ? (
                      <VoicePlayer
                        src={msg.mediaUrl}
                        duration={msg.duration}
                        waveform={msg.waveform}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  ) : null;

  const emptyConversation = (
    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground">
      <span className="mb-4 flex size-20 items-center justify-center rounded-full bg-muted">
        <Icon icon="solar:chat-round-bold" className="size-10 opacity-20" />
      </span>
      <h3 className="text-lg font-semibold text-foreground">
        {roomId && rooms ? 'Chat not found' : 'Choose a chat'}
      </h3>
      <p className="mt-2 max-w-sm text-sm">
        {roomId && rooms
          ? 'This chat may have been removed.'
          : 'Select a conversation to see what the customer and stylist said.'}
      </p>
      {roomId && (
        <Button variant="outline" className="mt-4 h-10 lg:hidden" onClick={closeRoom}>
          Back to chats
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dispute Chats"
        description="Read customer and stylist conversations to settle disputes."
        breadcrumbs={[{ label: 'Dispute Chats' }]}
      />

      <div className="flex h-[calc(100dvh-14rem)] min-h-[26rem] overflow-hidden rounded-2xl border bg-white shadow-sm">
        <aside
          className={cn(
            'min-w-0 flex-col lg:flex lg:w-80 lg:shrink-0 lg:border-r xl:w-96',
            roomId ? 'hidden' : 'flex w-full',
          )}
        >
          {roomList}
        </aside>
        <section className={cn('min-w-0 flex-1 flex-col', roomId ? 'flex' : 'hidden lg:flex')}>
          {conversation ??
            (rooms === null && roomId ? (
              <div className="flex flex-1 items-center justify-center">
                <Loader label="Loading chat" />
              </div>
            ) : (
              emptyConversation
            ))}
        </section>
      </div>

      {viewerIndex >= 0 && (
        <ImageViewer images={photos} startIndex={viewerIndex} onClose={() => setViewerUrl(null)} />
      )}
    </div>
  );
}
