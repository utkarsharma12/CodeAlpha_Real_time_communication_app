import React, { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import VideoGrid from '../components/VideoGrid';
import Controls from '../components/Controls';
import Chat from '../components/Chat';
import Participants from '../components/Participants';
import Whiteboard from '../components/Whiteboard';
import FileShare from '../components/FileShare';
import { AlertCircle, Wifi } from 'lucide-react';

const MeetingRoom = ({ roomId, currentUser, onLeaveRoom }) => {
  const [activeSidebar, setActiveSidebar] = useState(null); // 'chat' | 'participants' | 'whiteboard' | 'files' | null
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize Socket.IO connection
  const { socket, isConnected, participants } = useSocket(roomId, currentUser);

  // Initialize WebRTC mesh
  const {
    localStream,
    peers,
    isAudioMuted,
    isVideoMuted,
    isScreenSharing,
    mediaError,
    toggleAudio,
    toggleVideo,
    toggleScreenShare
  } = useWebRTC(roomId, socket, currentUser);

  // Track unread messages when chat sidebar is closed
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      if (activeSidebar !== 'chat' && msg.sender?.id !== currentUser?.id) {
        setUnreadCount((c) => c + 1);
      }
    };

    socket.on('receive-message', handleNewMessage);
    return () => {
      socket.off('receive-message', handleNewMessage);
    };
  }, [socket, activeSidebar, currentUser?.id]);

  const toggleSidebar = (sidebarName) => {
    if (activeSidebar === sidebarName) {
      setActiveSidebar(null);
    } else {
      setActiveSidebar(sidebarName);
      if (sidebarName === 'chat') {
        setUnreadCount(0);
      }
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden relative select-none">
      {/* Top Header Bar */}
      <div className="h-14 px-6 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <span className="font-bold text-base tracking-tight text-white">
            Meet<span className="text-indigo-400">Space</span>
          </span>
          <span className="text-slate-500 font-mono text-xs">/</span>
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
            {roomId}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          {/* Connection status pill */}
          <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700/60 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
              }`}
            />
            <span className="text-slate-300 font-medium">
              {isConnected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>

      {/* Media Permission Warning Banner if hardware access is restricted */}
      {mediaError && (
        <div className="bg-amber-950/80 border-b border-amber-800 px-4 py-2 text-xs text-amber-200 flex items-center justify-center space-x-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{mediaError}</span>
        </div>
      )}

      {/* Main Video & Workspace Stage */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Video Grid Canvas */}
        <div className="flex-1 h-full relative overflow-hidden bg-slate-950 flex items-center justify-center">
          <VideoGrid
            localStream={localStream}
            peers={peers}
            currentUser={currentUser}
            isAudioMuted={isAudioMuted}
            isVideoMuted={isVideoMuted}
            isScreenSharing={isScreenSharing}
          />

          {/* Whiteboard Overlay */}
          {activeSidebar === 'whiteboard' && (
            <Whiteboard
              roomId={roomId}
              socket={socket}
              onClose={() => setActiveSidebar(null)}
            />
          )}
        </div>

        {/* Sidebars (Chat, Participants, Files) */}
        {activeSidebar === 'chat' && (
          <Chat
            roomId={roomId}
            socket={socket}
            currentUser={currentUser}
            onClose={() => setActiveSidebar(null)}
            onNewMessageRead={() => setUnreadCount(0)}
          />
        )}

        {activeSidebar === 'participants' && (
          <Participants
            participants={participants}
            currentUser={currentUser}
            isAudioMuted={isAudioMuted}
            isVideoMuted={isVideoMuted}
            peers={peers}
            onClose={() => setActiveSidebar(null)}
          />
        )}

        {activeSidebar === 'files' && (
          <FileShare
            roomId={roomId}
            socket={socket}
            currentUser={currentUser}
            onClose={() => setActiveSidebar(null)}
          />
        )}
      </div>

      {/* Floating Bottom Action Dock */}
      <Controls
        isAudioMuted={isAudioMuted}
        isVideoMuted={isVideoMuted}
        isScreenSharing={isScreenSharing}
        activeSidebar={activeSidebar}
        unreadCount={unreadCount}
        participantsCount={participants.length || 1}
        roomId={roomId}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={toggleScreenShare}
        onToggleSidebar={toggleSidebar}
        onLeaveCall={onLeaveRoom}
      />
    </div>
  );
};

export default MeetingRoom;
