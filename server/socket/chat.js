// In-memory chat history per room: roomId -> Array of messages
const chatHistories = new Map();

const setupChat = (io, socket) => {
  // Send message
  socket.on('send-message', ({ roomId, message, sender }) => {
    if (!roomId || !message) return;
    const cleanRoomId = roomId.toLowerCase().trim();

    const chatMsg = {
      id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      roomId: cleanRoomId,
      message,
      sender: sender || socket.userInfo || { name: 'Anonymous' },
      timestamp: new Date().toISOString()
    };

    if (!chatHistories.has(cleanRoomId)) {
      chatHistories.set(cleanRoomId, []);
    }

    const history = chatHistories.get(cleanRoomId);
    history.push(chatMsg);
    // Keep last 100 messages per room
    if (history.length > 100) history.shift();

    // Broadcast to everyone in the room (including sender so client confirmation is unified)
    io.in(cleanRoomId).emit('receive-message', chatMsg);
  });

  // Request chat history on joining
  socket.on('get-chat-history', ({ roomId }) => {
    if (!roomId) return;
    const cleanRoomId = roomId.toLowerCase().trim();
    const history = chatHistories.get(cleanRoomId) || [];
    socket.emit('chat-history', history);
  });

  // Notify file share event
  socket.on('share-file-meta', ({ roomId, file }) => {
    if (!roomId || !file) return;
    const cleanRoomId = roomId.toLowerCase().trim();
    io.in(cleanRoomId).emit('new-file-shared', file);
  });
};

module.exports = setupChat;
