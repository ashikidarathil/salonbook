import { MessageType, SenderType } from '../constants/chat.types';

export interface ChatRoomResponseDto {
  id: string;
  bookingId: string;
  bookingNumber?: string;
  userId: string;
  userName?: string;
  userProfilePic?: string;
  stylistId: string;
  stylistName?: string;
  stylistProfilePic?: string;
  status: string;
  lastMessage?: string;
  lastMessageType?: string;
  lastMessageAt?: Date;
  updatedAt: Date;
  unreadCount?: number;
  // Nested objects for admin / detailed views
  user?: { name: string; profilePicture?: string };
  stylist?: { name: string; profilePicture?: string };
  booking?: { bookingNumber?: string; status: string; completedAt?: string; cancelledAt?: string };
}

/** Tells a sender that their messages in a room were delivered or read. */
export interface MessageStatusUpdate {
  chatRoomId: string;
  status: 'delivered' | 'read';
  at: Date;
  notifyUserId: string;
}

/** Tells both people in a room that a message was deleted for everyone. */
export interface MessageDeletedUpdate {
  chatRoomId: string;
  messageId: string;
  deletedAt: Date;
  /** Set when the deleted message was the newest one in the room */
  lastMessage?: string;
}

export interface MessageResponseDto {
  id: string;
  chatRoomId: string;
  senderId: string;
  senderType: SenderType;
  messageType: MessageType;
  content?: string;
  mediaUrl?: string;
  duration?: number;
  waveform?: number[];
  isRead: boolean;
  deliveredAt?: Date;
  readAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  bookingId?:
    | string
    | {
        bookingNumber: string;
        status: string;
        bookingName?: string;
      };
}
