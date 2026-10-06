import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
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
