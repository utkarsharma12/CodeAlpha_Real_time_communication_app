import React, { useState, useEffect, useRef } from 'react';
import { Send, X, MessageSquare, Clock } from 'lucide-react';

const Chat = ({ roomId, socket, currentUser, onClose, onNewMessageRead }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!socket || !roomId) return;

    // Fetch message history from server
    socket.emit('get-chat-history', { roomId });

    const handleChatHistory = (history) => {
      setMessages(history);
      scrollToBottom();
      onNewMessageRead?.();
    };

    const handleReceiveMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
      scrollToBottom();
      onNewMessageRead?.();
    };

    socket.on('chat-history', handleChatHistory);
    socket.on('receive-message', handleReceiveMessage);

    return () => {
      socket.off('chat-history', handleChatHistory);
      socket.off('receive-message', handleReceiveMessage);
    };
  }, [socket, roomId, onNewMessageRead]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !socket) return;

    socket.emit('send-message', {
      roomId,
      message: inputText.trim(),
      sender: {
        id: currentUser?.id,
        name: currentUser?.name || 'Guest'
      }
    });

    setInputText('');
  };

  return (
    <div className="w-full sm:w-80 md:w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full z-20 shadow-2xl animate-slide-left">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <MessageSquare className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-slate-100">In-Call Messages</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-6">
            <MessageSquare className="w-10 h-10 mb-2 stroke-[1.5] text-slate-600" />
            <p className="text-sm">No messages yet.</p>
            <p className="text-xs text-slate-600 mt-1">Start the conversation with your team!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender?.id === currentUser?.id || msg.sender?.name === currentUser?.name;
            const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[88%] ${
                  isMe ? 'ml-auto' : 'mr-auto'
                }`}
              >
                {!isMe && (
                  <span className="text-[11px] text-slate-400 font-medium mb-1 px-1">
                    {msg.sender?.name || 'Participant'}
                  </span>
                )}
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-sm ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/60'
                  }`}
                >
                  {msg.message}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1 px-1">
                  <Clock className="w-2.5 h-2.5" />
                  <span>{timeStr}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-900/80">
        <div className="flex items-center bg-slate-800/90 rounded-xl px-3 py-2 border border-slate-700/70 focus-within:border-indigo-500 transition-colors">
          <input
            type="text"
            placeholder="Send a message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-1.5 ml-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
