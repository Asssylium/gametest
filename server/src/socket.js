import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

export function initSocket(httpServer, { jwtSecret }) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH'],
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, jwtSecret);
      socket.user = decoded;
      return next();
    } catch (err) {
      return next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user?.id || socket.user?.userId;
    const roleId = Number(socket.user?.roleId);

    if (userId) {
      socket.join(`user:${userId}`);
    }
    if (roleId === 1) {
      socket.join('room:admins');
    }

    socket.on('disconnect', () => {});
  });

  return io;
}
