// In-memory whiteboard drawing action history: roomId -> Array of stroke actions
const whiteboardStates = new Map();

const setupWhiteboard = (io, socket) => {
  // Sync initial board state when user opens whiteboard
  socket.on('get-whiteboard-state', ({ roomId }) => {
    if (!roomId) return;
    const cleanRoomId = roomId.toLowerCase().trim();
    const strokes = whiteboardStates.get(cleanRoomId) || [];
    socket.emit('whiteboard-state', strokes);
  });

  // Client draws a stroke
  socket.on('draw-stroke', ({ roomId, stroke }) => {
    if (!roomId || !stroke) return;
    const cleanRoomId = roomId.toLowerCase().trim();

    if (!whiteboardStates.has(cleanRoomId)) {
      whiteboardStates.set(cleanRoomId, []);
    }

    const strokes = whiteboardStates.get(cleanRoomId);
    strokes.push(stroke);

    // Limit stored strokes to prevent memory bloat
    if (strokes.length > 5000) {
      strokes.splice(0, 1000);
    }

    // Broadcast stroke to all other participants in the room
    socket.to(cleanRoomId).emit('draw-stroke', stroke);
  });

  // Clear whiteboard
  socket.on('clear-whiteboard', ({ roomId }) => {
    if (!roomId) return;
    const cleanRoomId = roomId.toLowerCase().trim();
    whiteboardStates.set(cleanRoomId, []);
    io.in(cleanRoomId).emit('clear-whiteboard');
  });
};

module.exports = setupWhiteboard;
