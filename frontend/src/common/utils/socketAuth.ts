import type { Socket } from 'socket.io-client';
import { api } from '@/services/api/api';

/**
 * The socket logs in with the access-token cookie, which expires after 15 minutes.
 * When the server rejects a (re)connect, refresh the cookie once and try again.
 */
export function reconnectAfterTokenRefresh(socket: Socket): void {
  let refreshed = false;

  socket.on('connect', () => {
    refreshed = false;
  });

  socket.on('connect_error', async (err: Error) => {
    if (err.message !== 'Authentication error' || refreshed) return;
    refreshed = true;
    try {
      await api.post('/auth/refresh');
      socket.connect();
    } catch {
      // Session is over; the app's normal 401 handling takes the user to login
    }
  });
}
