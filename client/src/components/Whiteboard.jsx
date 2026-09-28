import React, { useRef, useState, useEffect } from 'react';
import {
  Edit3,
  Eraser,
  Trash2,
  Download,
  X,
  Minus,
  Maximize2
} from 'lucide-react';

const COLORS = [
  '#000000',
  '#ffffff',
  '#6366f1', // Indigo
  '#ef4444', // Red
  '#10b981', // Green
  '#f59e0b', // Yellow
  '#ec4899', // Pink
  '#3b82f6'  // Blue
];

const Whiteboard = ({ roomId, socket, onClose }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#6366f1');
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const lastPointRef = useRef({ x: 0, y: 0 });

  // Initialize and resize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    // Set actual canvas resolution to match display size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Fill white background initially
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Request initial state from server
    if (socket && roomId) {
      socket.emit('get-whiteboard-state', { roomId });

      const handleWhiteboardState = (strokes) => {
        strokes.forEach((stroke) => drawStrokeOnCanvas(ctx, stroke));
      };

      const handleRemoteStroke = (stroke) => {
        drawStrokeOnCanvas(ctx, stroke);
      };

      const handleClearWhiteboard = () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      };

      socket.on('whiteboard-state', handleWhiteboardState);
      socket.on('draw-stroke', handleRemoteStroke);
      socket.on('clear-whiteboard', handleClearWhiteboard);

      return () => {
        socket.off('whiteboard-state', handleWhiteboardState);
        socket.off('draw-stroke', handleRemoteStroke);
        socket.off('clear-whiteboard', handleClearWhiteboard);
      };
    }
  }, [socket, roomId]);

  const drawStrokeOnCanvas = (ctx, stroke) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(stroke.prevX, stroke.prevY);
    ctx.lineTo(stroke.currentX, stroke.currentY);
    ctx.strokeStyle = stroke.isEraser ? '#ffffff' : stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  };

  // Mouse / Touch drawing handlers
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    const coords = getCoordinates(e);
    lastPointRef.current = coords;
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const coords = getCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const stroke = {
      prevX: lastPointRef.current.x,
      prevY: lastPointRef.current.y,
      currentX: coords.x,
      currentY: coords.y,
      color,
      size: isEraser ? brushSize * 4 : brushSize,
      isEraser
    };

    drawStrokeOnCanvas(ctx, stroke);

    // Emit stroke to room
    if (socket && roomId) {
      socket.emit('draw-stroke', { roomId, stroke });
    }

    lastPointRef.current = coords;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (socket && roomId) {
      socket.emit('clear-whiteboard', { roomId });
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `whiteboard-${roomId}-${Date.now()}.png`;
    link.href = image;
    link.click();
  };

  return (
    <div className="absolute inset-4 z-40 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden animate-fade-in">
      {/* Top Toolbar */}
      <div className="p-3 bg-slate-800/90 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3">
        {/* Tool selectors */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsEraser(false)}
            title="Pen"
            className={`p-2 rounded-xl transition-colors ${
              !isEraser ? 'bg-indigo-600 text-white' : 'bg-slate-700/70 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Edit3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsEraser(true)}
            title="Eraser"
            className={`p-2 rounded-xl transition-colors ${
              isEraser ? 'bg-indigo-600 text-white' : 'bg-slate-700/70 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Eraser className="w-5 h-5" />
          </button>

          {/* Color Palette */}
          {!isEraser && (
            <div className="flex items-center space-x-1.5 ml-2 pl-2 border-l border-slate-700">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    color === c ? 'scale-125 border-white ring-2 ring-indigo-400' : 'border-slate-600 hover:scale-110'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Brush Size Slider */}
          <div className="flex items-center space-x-2 ml-4 pl-2 border-l border-slate-700 text-xs text-slate-300">
            <span>Size</span>
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-20 accent-indigo-500 cursor-pointer"
            />
            <span className="w-4 font-mono">{brushSize}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleClear}
            title="Clear canvas"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear</span>
          </button>

          <button
            onClick={handleDownload}
            title="Download drawing"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export PNG</span>
          </button>

          <button
            onClick={onClose}
            title="Close whiteboard"
            className="p-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 w-full h-full relative cursor-crosshair bg-white">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full touch-none block"
        />
      </div>
    </div>
  );
};

export default Whiteboard;
