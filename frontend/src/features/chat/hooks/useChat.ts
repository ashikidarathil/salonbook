import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useDispatch } from 'react-redux';
import {
  addMessageToRoom,
  addPendingMessage,
  confirmPendingMessage,
  setPendingRemoteUrl,
  setPendingState,
  applyMessagesStatus,
  applyMessageDeleted,
  updateRoomLastMessage,
  incrementUnreadCount,
} from '../chat.slice';
import {
  type ChatMediaUploader,
  type ChatMessage,
  type MediaSendItem,
  type MessageDeletedUpdate,
  type SendMessagePayload,
  MessageType,
} from '../chat.types';
import { showError } from '../../../common/utils/swal.utils';
import { SOCKET_BASE_URL } from '../../../services/api/api';
import { reconnectAfterTokenRefresh } from '../../../common/utils/socketAuth';

const SEND_TIMEOUT_MS = 15000;
// The server allows 5 messages per 5 seconds and drops the rest
const MEDIA_SEND_GAP_MS = 1300;

type SendResult = { ok: true; message: ChatMessage } | { ok: false; error: string };

interface PendingSend {
  payload: SendMessagePayload;
  file?: File;
  upload?: ChatMediaUploader;
  previewUrl?: string;
  remoteUrl?: string;
}

// Kept outside the hook so Retry still works after leaving and reopening the chat
const pendingSends = new Map<string, PendingSend>();

const toPendingMessage = (
  payload: SendMessagePayload,
  clientId: string,
  previewUrl?: string,
): ChatMessage => ({
  ...payload,
  id: clientId,
  clientId,
  mediaUrl: previewUrl ?? payload.mediaUrl,
  isRead: false,
  createdAt: new Date().toISOString(),
  sendState: 'sending',
});

export const useChat = (userId: string | undefined) => {
  const socketRef = useRef<Socket | null>(null);
  const dispatch = useDispatch();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    socketRef.current = io(SOCKET_BASE_URL, {
      query: { userId },
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    reconnectAfterTokenRefresh(socketRef.current);

    socketRef.current.on('connect', () => {
      setIsConnected(true);
    });

    socketRef.current.on('newMessage', (message: ChatMessage) => {
      dispatch(addMessageToRoom(message));

      if (message.senderId !== userId) {
        dispatch(incrementUnreadCount());
      }

      const isMe = message.senderId === userId;
      const prefix = isMe ? 'You: ' : '';

      let preview = 'New message';
      if (message.messageType === MessageType.TEXT) preview = message.content || 'Text message';
      else if (message.messageType === MessageType.IMAGE) preview = '📷 Image';
      else if (message.messageType === MessageType.VOICE) preview = '🎤 Voice message';
      else if (message.messageType === MessageType.SYSTEM)
        preview = message.content || 'System message';

      dispatch(
        updateRoomLastMessage({
          roomId: message.chatRoomId,
          lastMessage: `${prefix}${preview}`,
          lastMessageType: message.messageType,
          lastMessageAt: message.createdAt,
          incrementUnread: message.senderId !== userId,
        }),
      );
    });

    socketRef.current.on(
      'messagesStatus',
      (update: { chatRoomId: string; status: 'delivered' | 'read'; at: string }) => {
        dispatch(applyMessagesStatus({ ...update, userId }));
      },
    );

    socketRef.current.on('messageDeleted', (update: MessageDeletedUpdate) => {
      dispatch(applyMessageDeleted(update));
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current.on('error', (err: { message: string }) => {
      showError('Chat Error', err?.message || 'Something went wrong with the connection.');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [userId, dispatch]);

  const joinRoom = useCallback((roomId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('joinChat', roomId);
    }
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leaveChat', roomId);
    }
  }, []);

  const deliver = useCallback(
    (clientId: string, payload: SendMessagePayload) => {
      const roomId = payload.chatRoomId;
      const markFailed = () => dispatch(setPendingState({ roomId, clientId, sendState: 'failed' }));
      if (!socketRef.current?.connected) {
        markFailed();
        return;
      }
      socketRef.current
        .timeout(SEND_TIMEOUT_MS)
        .emit('sendMessage', payload, (err: Error | null, result?: SendResult) => {
          if (err || !result?.ok) {
            markFailed();
            return;
          }
          dispatch(confirmPendingMessage({ clientId, message: result.message }));
          const previewUrl = pendingSends.get(clientId)?.previewUrl;
          pendingSends.delete(clientId);
          // Give the real image time to load before releasing the local preview
          if (previewUrl) setTimeout(() => URL.revokeObjectURL(previewUrl), 10000);
        });
    },
    [dispatch],
  );

  const uploadAndDeliver = useCallback(
    async (clientId: string) => {
      const entry = pendingSends.get(clientId);
      if (!entry?.file || !entry.upload) return;
      const roomId = entry.payload.chatRoomId;
      try {
        entry.remoteUrl ??= await entry.upload(roomId, entry.file);
        dispatch(setPendingRemoteUrl({ roomId, clientId, remoteUrl: entry.remoteUrl }));
        deliver(clientId, { ...entry.payload, mediaUrl: entry.remoteUrl });
      } catch {
        dispatch(setPendingState({ roomId, clientId, sendState: 'failed' }));
      }
    },
    [deliver, dispatch],
  );

  const sendMessage = useCallback(
    (payload: SendMessagePayload) => {
      const clientId = `local_${crypto.randomUUID()}`;
      pendingSends.set(clientId, { payload });
      dispatch(addPendingMessage(toPendingMessage(payload, clientId)));
      deliver(clientId, payload);
    },
    [deliver, dispatch],
  );

  /** Shows every bubble straight away, then uploads and sends them in order. */
  const sendMedia = useCallback(
    async (items: MediaSendItem[], upload: ChatMediaUploader) => {
      const clientIds = items.map(({ file, payload }) => {
        const clientId = `local_${crypto.randomUUID()}`;
        const previewUrl = URL.createObjectURL(file);
        pendingSends.set(clientId, { payload, file, upload, previewUrl });
        dispatch(addPendingMessage(toPendingMessage(payload, clientId, previewUrl)));
        return clientId;
      });
      for (let i = 0; i < clientIds.length; i++) {
        const startedAt = Date.now();
        await uploadAndDeliver(clientIds[i]);
        if (i < clientIds.length - 1) {
          const wait = MEDIA_SEND_GAP_MS - (Date.now() - startedAt);
          if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
        }
      }
    },
    [dispatch, uploadAndDeliver],
  );

  const retryMessage = useCallback(
    (clientId: string) => {
      const entry = pendingSends.get(clientId);
      if (!entry) return;
      const roomId = entry.payload.chatRoomId;
      dispatch(setPendingState({ roomId, clientId, sendState: 'sending' }));
      if (entry.file) uploadAndDeliver(clientId);
      else deliver(clientId, entry.payload);
    },
    [deliver, dispatch, uploadAndDeliver],
  );

  /** Rejects with a readable message, so the caller can show it. */
  const deleteMessage = useCallback(
    (messageId: string) =>
      new Promise<void>((resolve, reject) => {
        if (!socketRef.current?.connected) {
          reject(new Error('You are offline. Try again when connected.'));
          return;
        }
        socketRef.current
          .timeout(SEND_TIMEOUT_MS)
          .emit(
            'deleteMessage',
            messageId,
            (
              err: Error | null,
              result?: { ok: true; update: MessageDeletedUpdate } | { ok: false; error: string },
            ) => {
              if (err || !result) {
                reject(new Error('Could not delete the message. Try again.'));
              } else if (!result.ok) {
                reject(new Error(result.error));
              } else {
                dispatch(applyMessageDeleted(result.update));
                resolve();
              }
            },
          );
      }),
    [dispatch],
  );

  const markRead = useCallback((roomId: string, onDone?: () => void) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('markRead', roomId, onDone);
    }
  }, []);

  return {
    markRead,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendMedia,
    retryMessage,
    deleteMessage,
    isConnected,
  };
};
