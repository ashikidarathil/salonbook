import { IMessage } from '../../../models/message.model';

export interface IMessageRepository {
  create(data: Partial<IMessage>): Promise<IMessage>;
  findById(id: string): Promise<IMessage | null>;
  findByRoomId(roomId: string, limit?: number, skip?: number): Promise<IMessage[]>;
  /** Both return how many messages changed. */
  markAsDelivered(roomId: string, receiverId: string, at: Date): Promise<number>;
  markAsRead(roomId: string, receiverId: string, at: Date): Promise<number>;
  /** Wipes the sender's message and returns it as it was, or null if nothing changed. */
  deleteForEveryone(messageId: string, senderId: string, at: Date): Promise<IMessage | null>;
  findRoomIdsWithUndelivered(roomIds: string[], receiverId: string): Promise<string[]>;
  countUnreadMessages(roomId: string, receiverId: string): Promise<number>;
  countTotalUnread(roomIds: string[], receiverId: string): Promise<number>;
  countUnreadPerRoom(roomIds: string[], receiverId: string): Promise<Record<string, number>>;
}
