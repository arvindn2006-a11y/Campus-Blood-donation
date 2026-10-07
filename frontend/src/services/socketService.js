import { io } from 'socket.io-client';

let socket = null;

const getSocketUrl = () => {
  const explicitSocketUrl = import.meta.env.VITE_SOCKET_URL;
  if (explicitSocketUrl && explicitSocketUrl.trim() !== '') {
    return explicitSocketUrl.trim().replace(/\/api\/?$/, '').replace(/\/+$/, '');
  }
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (apiBaseUrl && apiBaseUrl.startsWith('http')) {
    return apiBaseUrl.trim().replace(/\/api\/?$/, '').replace(/\/+$/, '');
  }
  return window.location.origin;
};

export const getSocket = () => {
  if (!socket) {
    const socketUrl = getSocketUrl();
    socket = io(socketUrl, {
      autoConnect: true,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to Real-time Socket Server:', socket.id);
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.id) socket.emit('join_user_room', user.id);
          if (user.role) socket.emit('join_role_room', user.role);
        } catch (e) {}
      }
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from Real-time Socket Server');
    });
  }
  return socket;
};
