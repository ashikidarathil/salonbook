import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ChatRoom, ChatMessage, MessageDeletedUpdate } from './chat.types';
import { MessageType } from './chat.types';
import {
  fetchUserRooms,
  fetchStylistRooms,
  fetchRoomMessages,
  initializeChatRoom,
  fetchTotalUnreadCount,
} from './chat.thunks';

interface ChatState {
  rooms: ChatRoom[];
  activeRoomId: string | null;
  messagesByRoom: Record<string, ChatMessage[]>;
  isLoadingRooms: boolean;
  /** True once the room list has loaded (or failed) at least once. */
  roomsLoaded: boolean;
  isLoadingMessages: boolean;
  error: string | null;
  totalUnreadCount: number;
}

const initialState: ChatState = {
  rooms: [],
  activeRoomId: null,
  messagesByRoom: {},
  isLoadingRooms: false,
  roomsLoaded: false,
  isLoadingMessages: false,
  error: null,
  totalUnreadCount: 0,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveRoom: (state, action: PayloadAction<string | null>) => {
      state.activeRoomId = action.payload;
    },
    addMessageToRoom: (state, action: PayloadAction<ChatMessage>) => {
      const { chatRoomId } = action.payload;
      if (!state.messagesByRoom[chatRoomId]) {
        state.messagesByRoom[chatRoomId] = [];
      }

      const list = state.messagesByRoom[chatRoomId];
      if (list.some((m) => m.id === action.payload.id)) return;

      // Safety net if the confirmation was missed: the broadcast settles my pending bubble
      const incoming = action.payload;
      const pendingIndex = list.findIndex(
        (m) =>
          m.sendState &&
          m.senderId === incoming.senderId &&
          m.messageType === incoming.messageType &&
          (m.content ?? '') === (incoming.content ?? '') &&
          (m.remoteUrl ?? m.mediaUrl) === incoming.mediaUrl,
      );
      if (pendingIndex >= 0) {
        list[pendingIndex] = { ...incoming, clientId: list[pendingIndex].clientId };
      } else {
        list.push(incoming);
      }
    },
    addPendingMessage: (state, action: PayloadAction<ChatMessage>) => {
      (state.messagesByRoom[action.payload.chatRoomId] ??= []).push(action.payload);
    },
    confirmPendingMessage: (
      state,
      action: PayloadAction<{ clientId: string; message: ChatMessage }>,
    ) => {
      const { clientId, message } = action.payload;
      const list = (state.messagesByRoom[message.chatRoomId] ??= []);
      const pendingIndex = list.findIndex((m) => m.id === clientId);
      if (list.some((m) => m.id === message.id)) {
        if (pendingIndex >= 0) list.splice(pendingIndex, 1);
      } else if (pendingIndex >= 0) {
        list[pendingIndex] = { ...message, clientId };
      } else {
        list.push(message);
      }
    },
    setPendingState: (
      state,
      action: PayloadAction<{
        roomId: string;
        clientId: string;
        sendState: 'sending' | 'failed';
      }>,
    ) => {
      const { roomId, clientId, sendState } = action.payload;
      const pending = state.messagesByRoom[roomId]?.find((m) => m.id === clientId);
      if (pending?.sendState) pending.sendState = sendState;
    },
    setPendingRemoteUrl: (
      state,
      action: PayloadAction<{ roomId: string; clientId: string; remoteUrl: string }>,
    ) => {
      const { roomId, clientId, remoteUrl } = action.payload;
      const pending = state.messagesByRoom[roomId]?.find((m) => m.id === clientId);
      if (pending?.sendState) pending.remoteUrl = remoteUrl;
    },
    /** The other person received or read my messages in this room. */
    applyMessagesStatus: (
      state,
      action: PayloadAction<{
        chatRoomId: string;
        status: 'delivered' | 'read';
        at: string;
        userId: string;
      }>,
    ) => {
      const { chatRoomId, status, at, userId } = action.payload;
      for (const message of state.messagesByRoom[chatRoomId] ?? []) {
        if (message.senderId !== userId || message.sendState) continue;
        message.deliveredAt ??= at;
        if (status === 'read') {
          message.isRead = true;
          message.readAt ??= at;
        }
      }
    },
    /** A message was deleted for everyone: drop its content and show the placeholder. */
    applyMessageDeleted: (state, action: PayloadAction<MessageDeletedUpdate>) => {
      const { chatRoomId, messageId, deletedAt, lastMessage } = action.payload;
      const message = state.messagesByRoom[chatRoomId]?.find((m) => m.id === messageId);
      if (message) {
        message.deletedAt = deletedAt;
        delete message.content;
        delete message.mediaUrl;
        delete message.duration;
        delete message.waveform;
      }
      const room = state.rooms.find((r) => r.id === chatRoomId);
      if (room && lastMessage) {
        room.lastMessage = lastMessage;
        room.lastMessageType = MessageType.TEXT;
      }
    },
    /** I have read the other person's messages in this room. */
    markIncomingRead: (state, action: PayloadAction<{ roomId: string; userId: string }>) => {
      for (const message of state.messagesByRoom[action.payload.roomId] ?? []) {
        if (message.senderId !== action.payload.userId) message.isRead = true;
      }
    },
    updateRoomLastMessage: (
      state,
      action: PayloadAction<{
        roomId: string;
        lastMessage: string;
        lastMessageType?: string;
        lastMessageAt: string;
        incrementUnread?: boolean;
      }>,
    ) => {
      const room = state.rooms.find((r) => r.id === action.payload.roomId);
      if (room) {
        room.lastMessage = action.payload.lastMessage;
        room.lastMessageType = action.payload.lastMessageType;
        room.lastMessageAt = action.payload.lastMessageAt;
        if (action.payload.incrementUnread) {
          room.unreadCount = (room.unreadCount || 0) + 1;
        }
      }
    },
    resetRoomUnreadCount: (state, action: PayloadAction<string>) => {
      const room = state.rooms.find((r) => r.id === action.payload);
      if (room) {
        room.unreadCount = 0;
      }
    },
    clearChatError: (state) => {
      state.error = null;
    },
    incrementUnreadCount: (state) => {
      state.totalUnreadCount += 1;
    },
    resetUnreadCount: (state) => {
      state.totalUnreadCount = 0;
    },
    setTotalUnreadCount: (state, action: PayloadAction<number>) => {
      state.totalUnreadCount = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Messages
      .addCase(fetchRoomMessages.pending, (state) => {
        state.isLoadingMessages = true;
        state.error = null;
      })
      .addCase(fetchRoomMessages.fulfilled, (state, action) => {
        state.isLoadingMessages = false;
        // Reloading the history must not wipe messages still being sent
        const pending = (state.messagesByRoom[action.payload.roomId] ?? []).filter(
          (m) => m.sendState,
        );
        state.messagesByRoom[action.payload.roomId] = [...action.payload.messages, ...pending];
      })
      .addCase(fetchRoomMessages.rejected, (state, action) => {
        state.isLoadingMessages = false;
        // Mark the room as tried so the loader stops and the empty view shows
        state.messagesByRoom[action.meta.arg.roomId] ??= [];
        state.error = (action.payload as string) || null;
      })
      // Initialize Room
      .addCase(initializeChatRoom.fulfilled, (state, action) => {
        const exists = state.rooms.find((r: ChatRoom) => r.id === action.payload.id);
        if (!exists) {
          state.rooms.unshift(action.payload);
        }
      })
      .addCase(fetchTotalUnreadCount.fulfilled, (state, action) => {
        state.totalUnreadCount = action.payload;
      })
      .addMatcher(
        (action) =>
          action.type === fetchUserRooms.pending.type ||
          action.type === fetchStylistRooms.pending.type,
        (state) => {
          state.isLoadingRooms = true;
          state.error = null;
        },
      )
      .addMatcher(
        (action) =>
          action.type === fetchUserRooms.fulfilled.type ||
          action.type === fetchStylistRooms.fulfilled.type,
        (state, action: PayloadAction<ChatRoom[]>) => {
          state.isLoadingRooms = false;
          state.roomsLoaded = true;
          state.rooms = action.payload;
        },
      )
      .addMatcher(
        (action) =>
          action.type === fetchUserRooms.rejected.type ||
          action.type === fetchStylistRooms.rejected.type,
        (state, action: PayloadAction<string | undefined>) => {
          state.isLoadingRooms = false;
          state.roomsLoaded = true;
          state.error = action.payload || null;
        },
      );
  },
});

export const {
  setActiveRoom,
  addMessageToRoom,
  addPendingMessage,
  confirmPendingMessage,
  setPendingState,
  setPendingRemoteUrl,
  applyMessagesStatus,
  applyMessageDeleted,
  markIncomingRead,
  updateRoomLastMessage,
  resetRoomUnreadCount,
  clearChatError,
  incrementUnreadCount,
  resetUnreadCount,
  setTotalUnreadCount,
} = chatSlice.actions;

export default chatSlice.reducer;
