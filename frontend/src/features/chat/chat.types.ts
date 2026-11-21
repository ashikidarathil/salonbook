export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VOICE = 'VOICE',
  SYSTEM = 'SYSTEM',
}

export enum SenderType {
  USER = 'USER',
  STYLIST = 'STYLIST',
  SYSTEM = 'SYSTEM',
}

export enum ChatRoomStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export interface ChatRoom {
  id: string;
  bookingId: string;
  bookingNumber: string;
  userId: string;
  userName: string;
  userProfilePic?: string;
  stylistId: string;
  stylistName: string;
  stylistProfilePic?: string;
  status: ChatRoomStatus;
  lastMessage?: string;
  lastMessageType?: string;
  lastMessageAt?: string;
  updatedAt: string;
  unreadCount?: number;
  user?: {
    name: string;
    profilePicture?: string;
  };
  stylist?: {
    name: string;
    profilePicture?: string;
  };
  booking?: {
    bookingNumber: string;
    status: string;
    completedAt?: string;
    cancelledAt?: string;
  };
}

export interface ChatMessage {
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
  deliveredAt?: string;
  readAt?: string;
  deletedAt?: string;
  createdAt: string;
  /** Browser-only: stable id of a message sent from this tab */
  clientId?: string;
  /** Browser-only: set until the server has saved the message */
  sendState?: 'sending' | 'failed';
  /** Browser-only: uploaded file address of a pending photo or voice message */
  remoteUrl?: string;
}

export interface MessageDeletedUpdate {
  chatRoomId: string;
  messageId: string;
  deletedAt: string;
  lastMessage?: string;
}

export interface SendMessagePayload {
  chatRoomId: string;
  senderId: string;
  senderType: SenderType;
  messageType: MessageType;
  content?: string;
  mediaUrl?: string;
  duration?: number;
  waveform?: number[];
}

export interface MediaSendItem {
  file: File;
  payload: SendMessagePayload;
}

export type ChatMediaUploader = (roomId: string, file: File) => Promise<string>;

export interface ChatUnreadCount {
  count: number;
}

export interface ChatMediaUploadResponse {
  mediaUrl: string;
}
