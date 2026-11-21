import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { container } from 'tsyringe';
import { TOKENS } from '../common/di/tokens';
import { IChatService } from '../modules/chat/service/IChatService';
import { logInfo, logError } from '../logger/log.util';
import { env } from '../config/env';
import jwt from 'jsonwebtoken';
import type { AuthPayload } from '../common/types/authPayload';
import { SenderType } from '../modules/chat/constants/chat.types';
import type {
  MessageDeletedUpdate,
  MessageStatusUpdate,
} from '../modules/chat/dto/chat.response.dto';

const messageRateLimits = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_MS = 5000;
const RATE_LIMIT_MAX_MESSAGES = 5;

type SendMessageData = Parameters<IChatService['sendMessage']>[0];
type SendMessageAck = (
  result:
    | { ok: true; message: Awaited<ReturnType<IChatService['sendMessage']>> }
    | { ok: false; error: string },
) => void;

const parseCookies = (header = ''): Record<string, string> =>
  Object.fromEntries(
    header
      .split(';')
      .map((part) => part.trim().split('='))
      .filter(([key, value]) => key && value)
      .map(([key, value]) => [key, decodeURIComponent(value)]),
  );

/** Finds the login (customer, stylist or admin cookie) belonging to the requested user. */
function authenticate(cookieHeader: string | undefined, userId: string): AuthPayload | null {
  const cookies = parseCookies(cookieHeader);
  for (const prefix of ['user', 'stylist', 'admin']) {
    const token = cookies[`${prefix}_access_token`];
    if (!token) continue;
    try {
      const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as AuthPayload;
      if (decoded.userId === userId) return decoded;
    } catch {
      // Expired or invalid: try the next role's cookie
    }
  }
  return null;
}

export class SocketService {
  private static io: Server;

  static init(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: env.FRONTEND_ORIGIN.split(',')
          .map((o) => o.trim())
          .filter(Boolean),
        credentials: true,
      },
      pingTimeout: 60000,
    });

    this.io.use((socket, next) => {
      const userId = socket.handshake.query.userId || socket.handshake.auth.userId;
      const auth =
        typeof userId === 'string' ? authenticate(socket.handshake.headers.cookie, userId) : null;
      if (!auth) {
        return next(new Error('Authentication error'));
      }
      socket.data.userId = auth.userId;
      socket.data.role = auth.role;
      next();
    });

    this.io.on('connection', (socket: Socket) => {
      logInfo(`[Socket connected] userId: ${socket.data.userId}, socketId: ${socket.id}`);

      // User connection room
      socket.join(`user_${socket.data.userId}`);

      // Coming online: messages waiting for this user are now delivered (✓✓)
      if (socket.data.role !== 'ADMIN') {
        container
          .resolve<IChatService>(TOKENS.ChatService)
          .markAllDeliveredForUser(socket.data.userId)
          .then((updates) => updates.forEach((update) => this.emitMessageStatus(update)))
          .catch((error: Error) =>
            logError('Socket delivery update error', { message: error.message }),
          );
      }

      socket.on('joinChat', async (roomId: string) => {
        try {
          const chatService = container.resolve<IChatService>(TOKENS.ChatService);
          await chatService.assertRoomAccess(roomId, socket.data.userId, socket.data.role);
          socket.join(roomId);
          logInfo(`User ${socket.data.userId} joined room ${roomId}`);
        } catch {
          socket.emit('error', { message: 'You do not have access to this chat' });
        }
      });

      socket.on('leaveChat', (roomId: string) => {
        socket.leave(roomId);
        logInfo(`User ${socket.data.userId} left room ${roomId}`);
      });

      socket.on('sendMessage', async (payload: SendMessageData, ack?: SendMessageAck) => {
        let saved = false;
        // Browsers that pass an ack show the failure on the message itself
        const fail = (message: string) => {
          if (typeof ack === 'function') ack({ ok: false, error: message });
          else socket.emit('error', { message });
        };
        try {
          // The sender is always the logged-in user, never what the browser claims
          if (payload.senderType === SenderType.SYSTEM) {
            fail('Not allowed');
            return;
          }
          const data: SendMessageData = { ...payload, senderId: socket.data.userId };

          // Rate limiting
          const now = Date.now();
          let userRate = messageRateLimits.get(data.senderId);
          if (!userRate || now - userRate.windowStart > RATE_LIMIT_MS) {
            userRate = { count: 1, windowStart: now };
            messageRateLimits.set(data.senderId, userRate);
          } else {
            userRate.count++;
            if (userRate.count > RATE_LIMIT_MAX_MESSAGES) {
              fail('Rate limit exceeded. Try again in 5 seconds.');
              return;
            }
          }

          const chatService = container.resolve<IChatService>(TOKENS.ChatService);

          const message = await chatService.sendMessage(data);
          saved = true;

          // Ack first, so the sender swaps the pending bubble before the broadcast arrives
          if (typeof ack === 'function') ack({ ok: true, message });
          this.io.to(data.chatRoomId).emit('newMessage', message);

          // Recipient is online somewhere on the site: delivered straight away
          const recipientId = await chatService.getOtherParticipant(data.chatRoomId, data.senderId);
          if (recipientId) {
            const online = await this.io.in(`user_${recipientId}`).fetchSockets();
            if (online.length) {
              const update = await chatService.markMessagesDelivered(data.chatRoomId, recipientId);
              if (update) this.emitMessageStatus(update);
            }
          }
        } catch (error) {
          const err = error as Error;
          logError('Socket sendMessage error', { message: err.message });
          if (!saved) fail(err.message || 'Failed to send message');
        }
      });

      socket.on(
        'deleteMessage',
        async (
          messageId: unknown,
          ack?: (
            result: { ok: true; update: MessageDeletedUpdate } | { ok: false; error: string },
          ) => void,
        ) => {
          const reply = typeof ack === 'function' ? ack : () => {};
          try {
            if (typeof messageId !== 'string') {
              reply({ ok: false, error: 'Message not found' });
              return;
            }
            const chatService = container.resolve<IChatService>(TOKENS.ChatService);
            const { update, notifyUserIds } = await chatService.deleteMessage(
              messageId,
              socket.data.userId,
            );
            reply({ ok: true, update });
            // Also each person's own room, so a chat that isn't open still updates its preview
            this.io
              .to([update.chatRoomId, ...notifyUserIds.map((id) => `user_${id}`)])
              .emit('messageDeleted', update);
          } catch (error) {
            const err = error as Error;
            logError('Socket deleteMessage error', { message: err.message });
            reply({ ok: false, error: err.message || 'Could not delete message' });
          }
        },
      );

      // The recipient has this chat open and visible. Room members only, so admins
      // reviewing a dispute never mark messages as read.
      socket.on('markRead', async (roomId: string, ack?: () => void) => {
        try {
          const chatService = container.resolve<IChatService>(TOKENS.ChatService);
          await chatService.assertRoomAccess(roomId, socket.data.userId);
          const update = await chatService.markMessagesAsRead(roomId, socket.data.userId);
          if (update) this.emitMessageStatus(update);
        } catch (error) {
          logError('Socket markRead error', { message: (error as Error).message });
        } finally {
          if (typeof ack === 'function') ack();
        }
      });

      socket.on('disconnect', () => {
        logInfo(`[Socket disconnected] userId: ${socket.data.userId}`);
      });
    });
  }

  static getIO(): Server {
    if (!this.io) {
      throw new Error('Socket.io not initialized!');
    }
    return this.io;
  }

  static emitMessageStatus({ notifyUserId, chatRoomId, status, at }: MessageStatusUpdate) {
    this.sendToUser(notifyUserId, 'messagesStatus', { chatRoomId, status, at });
  }

  static sendToUser(userId: string, event: string, data: unknown) {
    if (this.io) {
      this.io.to(`user_${userId}`).emit(event, data);
    }
  }
}
