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
  return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000';
};

export const getSocket = () => {
  if (!socket) {
    try {
      const socketUrl = getSocketUrl();
      socket = io(socketUrl, {
        autoConnect: true,
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 3,
        timeout: 4000
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

      socket.on('connect_error', () => {
        // Suppress connection errors gracefully on serverless deployments
      });

      socket.on('disconnect', () => {
        console.log('🔌 Disconnected from Real-time Socket Server');
      });
    } catch (err) {
      // Return safe mock socket object
      socket = {
        on: () => {},
        off: () => {},
        emit: () => {},
        connected: false
      };
    }
  }
  return socket;
};

