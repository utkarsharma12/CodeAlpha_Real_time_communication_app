// In-memory mapping of room participants: roomId -> Map(socketId -> userInfo)
const rooms = new Map();

const setupSignaling = (io, socket) => {
  // Join Room
  socket.on('join-room', ({ roomId, user }) => {
    if (!roomId) return;
    const cleanRoomId = roomId.toLowerCase().trim();

    socket.join(cleanRoomId);
    socket.roomId = cleanRoomId;
    socket.userInfo = user || { name: 'Guest', id: socket.id };

    if (!rooms.has(cleanRoomId)) {
      rooms.set(cleanRoomId, new Map());
    }

    const roomParticipants = rooms.get(cleanRoomId);

    // Get list of existing peers in this room
    const existingPeers = [];
    roomParticipants.forEach((peerUser, peerSocketId) => {
      existingPeers.push({
        socketId: peerSocketId,
        user: peerUser
      });
    });

    // Add current user to room map
    roomParticipants.set(socket.id, socket.userInfo);

    // Send existing peers to the joiner
    socket.emit('all-users', existingPeers);

    // Notify other peers in room about this new joiner
    socket.to(cleanRoomId).emit('user-joined', {
      socketId: socket.id,
      user: socket.userInfo
    });

    // Broadcast current participants list
    const participantList = Array.from(roomParticipants.entries()).map(([sid, u]) => ({
      socketId: sid,
      ...u
    }));
    io.in(cleanRoomId).emit('participants-update', participantList);

    console.log(`[Signaling] Socket ${socket.id} (${socket.userInfo.name}) joined room ${cleanRoomId}. Total: ${roomParticipants.size}`);
  });

  // WebRTC Offer / Signal forwarding
  socket.on('sending-signal', ({ userToCall, signal, user }) => {
    io.to(userToCall).emit('user-joined-signal', {
      signal,
      callerId: socket.id,
      user: user || socket.userInfo
    });
  });

  // WebRTC Answer / Returned Signal forwarding
  socket.on('returning-signal', ({ callerId, signal }) => {
    io.to(callerId).emit('receiving-returned-signal', {
      signal,
      id: socket.id
    });
  });

  // WebRTC ICE Candidate forwarding
  socket.on('ice-candidate', ({ target, candidate }) => {
    io.to(target).emit('ice-candidate', {
      candidate,
      from: socket.id
    });
  });

  // Media state changes (Mute audio, disable camera, screen share)
  socket.on('toggle-audio', ({ roomId, isMuted }) => {
    const cleanRoomId = (roomId || socket.roomId || '').toLowerCase();
    socket.to(cleanRoomId).emit('user-toggled-audio', {
      socketId: socket.id,
      isMuted
    });
  });

  socket.on('toggle-video', ({ roomId, isVideoOff }) => {
    const cleanRoomId = (roomId || socket.roomId || '').toLowerCase();
    socket.to(cleanRoomId).emit('user-toggled-video', {
      socketId: socket.id,
      isVideoOff
    });
  });

  socket.on('screen-share-status', ({ roomId, isScreenSharing }) => {
    const cleanRoomId = (roomId || socket.roomId || '').toLowerCase();
    socket.to(cleanRoomId).emit('user-screen-share', {
      socketId: socket.id,
      isScreenSharing
    });
  });

  // Handle Leave Room explicitly
  socket.on('leave-room', () => {
    handleUserDisconnect(io, socket);
  });

  // Handle socket disconnect
  socket.on('disconnect', () => {
    handleUserDisconnect(io, socket);
  });
};

const handleUserDisconnect = (io, socket) => {
  const roomId = socket.roomId;
  if (!roomId || !rooms.has(roomId)) return;

  const roomParticipants = rooms.get(roomId);
  if (roomParticipants.has(socket.id)) {
    const user = roomParticipants.get(socket.id);
    roomParticipants.delete(socket.id);

    // Notify remaining peers
    socket.to(roomId).emit('user-left', {
      socketId: socket.id,
      user
    });

    const participantList = Array.from(roomParticipants.entries()).map(([sid, u]) => ({
      socketId: sid,
      ...u
    }));
    io.in(roomId).emit('participants-update', participantList);

    console.log(`[Signaling] Socket ${socket.id} left room ${roomId}. Remaining: ${roomParticipants.size}`);

    if (roomParticipants.size === 0) {
      rooms.delete(roomId);
    }
  }
};

module.exports = setupSignaling;
