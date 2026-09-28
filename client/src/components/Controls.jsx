import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  MessageSquare,
  Users,
  Edit3,
  Paperclip,
  PhoneOff,
  Copy,
  Check,
  Info
} from 'lucide-react';

const Controls = ({
  isAudioMuted,
  isVideoMuted,
  isScreenSharing,
  activeSidebar, // 'chat' | 'participants' | 'whiteboard' | 'files' | null
  unreadCount = 0,
  participantsCount = 1,
  roomId,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleSidebar,
  onLeaveCall
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-20 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 px-4 sm:px-8 flex items-center justify-between z-30 select-none">
      {/* Left: Meeting ID & Copy Invite Link */}
      <div className="hidden sm:flex items-center space-x-3">
        <div className="flex items-center space-x-2 bg-slate-800/80 px-3.5 py-1.5 rounded-xl border border-slate-700/60">
          <Info className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold tracking-wide text-slate-300 uppercase">
            {roomId}
          </span>
          <button
            onClick={handleCopyLink}
            title="Copy invitation link"
            className="p-1 hover:text-white text-slate-400 transition-colors"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Center: Core Call Controls */}
      <div className="flex items-center space-x-2 sm:space-x-3 mx-auto">
        {/* Audio Toggle */}
        <button
          onClick={onToggleAudio}
          title={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
          className={`p-3.5 sm:p-4 rounded-2xl transition-all duration-200 flex items-center justify-center shadow-lg ${
            isAudioMuted
              ? 'bg-rose-500/90 hover:bg-rose-600 text-white shadow-rose-900/30 ring-2 ring-rose-500/50'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white border border-slate-700'
          }`}
        >
          {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Video Toggle */}
        <button
          onClick={onToggleVideo}
          title={isVideoMuted ? 'Turn on camera' : 'Turn off camera'}
          className={`p-3.5 sm:p-4 rounded-2xl transition-all duration-200 flex items-center justify-center shadow-lg ${
            isVideoMuted
              ? 'bg-rose-500/90 hover:bg-rose-600 text-white shadow-rose-900/30 ring-2 ring-rose-500/50'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white border border-slate-700'
          }`}
        >
          {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        {/* Screen Share */}
        <button
          onClick={onToggleScreenShare}
          title={isScreenSharing ? 'Stop sharing screen' : 'Share your screen'}
          className={`p-3.5 sm:p-4 rounded-2xl transition-all duration-200 flex items-center justify-center shadow-lg ${
            isScreenSharing
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white ring-2 ring-indigo-400/60 shadow-indigo-900/40'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white border border-slate-700'
          }`}
        >
          {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
        </button>

        {/* Whiteboard Toggle */}
        <button
          onClick={() => onToggleSidebar('whiteboard')}
          title="Collaborative Whiteboard"
          className={`p-3.5 sm:p-4 rounded-2xl transition-all duration-200 flex items-center justify-center shadow-lg ${
            activeSidebar === 'whiteboard'
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white ring-2 ring-indigo-400/60'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white border border-slate-700'
          }`}
        >
          <Edit3 className="w-5 h-5" />
        </button>

        {/* Leave Call */}
        <button
          onClick={onLeaveCall}
          title="Leave meeting"
          className="p-3.5 sm:p-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white transition-all duration-200 flex items-center justify-center shadow-lg shadow-rose-900/40 ml-2"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>

      {/* Right: Collaboration Panels (Chat, Participants, Files) */}
      <div className="flex items-center space-x-2">
        {/* Chat */}
        <button
          onClick={() => onToggleSidebar('chat')}
          title="Meeting Chat"
          className={`relative p-3 rounded-xl transition-colors ${
            activeSidebar === 'chat'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          {unreadCount > 0 && activeSidebar !== 'chat' && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-slate-900">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Participants */}
        <button
          onClick={() => onToggleSidebar('participants')}
          title="Participants list"
          className={`relative p-3 rounded-xl transition-colors ${
            activeSidebar === 'participants'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 bg-slate-700 text-slate-200 text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-slate-900">
            {participantsCount}
          </span>
        </button>

        {/* File Sharing */}
        <button
          onClick={() => onToggleSidebar('files')}
          title="Shared Files"
          className={`p-3 rounded-xl transition-colors ${
            activeSidebar === 'files'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
        >
          <Paperclip className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Controls;
