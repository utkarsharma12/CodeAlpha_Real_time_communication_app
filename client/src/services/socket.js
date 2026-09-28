import { io } from 'socket.io-client';

let socketInstance = null;

const SOCKET_SERVER_URL =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : window.location.origin;

export const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_SERVER_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling']
    });
  }
  return socketInstance;
};

export const connectSocket = (user) => {
  const socket = getSocket();
  if (!socket.connected) {
    socket.auth = { user };
    socket.connect();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socketInstance && socketInstance.connected) {
    socketInstance.disconnect();
  }
};
