import { useState, useEffect, useRef } from 'react';
import { getSocket, connectSocket } from '../services/socket';

export const useSocket = (roomId, user) => {
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!roomId) return;

    const socket = connectSocket(user);
    socketRef.current = socket;

    const onConnect = () => {
      setIsConnected(true);
      console.log('[Socket] Connected with ID:', socket.id);
      // Join Room
      socket.emit('join-room', {
        roomId,
        user: {
          id: user?.id || socket.id,
          name: user?.name || 'Guest User',
          avatar: user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.name || socket.id}`
        }
      });
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onParticipantsUpdate = (usersList) => {
      setParticipants(usersList);
    };

    if (socket.connected) {
      onConnect();
    } else {
      socket.on('connect', onConnect);
    }

    socket.on('disconnect', onDisconnect);
    socket.on('participants-update', onParticipantsUpdate);

    return () => {
      if (socket) {
        socket.emit('leave-room');
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
        socket.off('participants-update', onParticipantsUpdate);
      }
    };
  }, [roomId, user?.id, user?.name]);

  return {
    socket: socketRef.current || getSocket(),
    isConnected,
    participants
  };
};
