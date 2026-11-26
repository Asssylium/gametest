import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';
import { api } from '../api/client.js';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestMessage, setLatestMessage] = useState(null);

  const refreshUnreadCount = useCallback(async () => {
    if (Number(user?.roleId) !== 1) {
      setUnreadCount(0);
      return;
    }
    try {
      const data = await api.getContactMessages();
      setUnreadCount(Number(data?.unreadCount || 0));
    } catch {
      // Bỏ qua nếu chưa có quyền hoặc lỗi mạng tạm thời
    }
  }, [user?.roleId]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!user || !token) {
      setSocket((prev) => {
        prev?.disconnect();
        return null;
      });
      setUnreadCount(0);
      return;
    }

    refreshUnreadCount();

    const instance = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    instance.on('inbox:new_message', (msg) => {
      setLatestMessage(msg);
      setUnreadCount((prev) => prev + 1);
    });

    setSocket(instance);

    return () => {
      instance.disconnect();
      setSocket(null);
    };
  }, [user, refreshUnreadCount]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        unreadCount,
        setUnreadCount,
        latestMessage,
        refreshUnreadCount,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext) || { unreadCount: 0, setUnreadCount: () => {} };
}
