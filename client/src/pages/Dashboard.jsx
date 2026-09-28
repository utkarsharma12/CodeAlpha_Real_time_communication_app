import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Plus,
  ArrowRight,
  LogOut,
  Shield,
  Monitor,
  MessageSquare,
  Edit3,
  Paperclip,
  Mic,
  MicOff,
  VideoOff,
  Sparkles
} from 'lucide-react';
import { apiCreateRoom } from '../services/api';

const Dashboard = ({ currentUser, onStartMeeting, onLogout }) => {
  const [joinRoomId, setJoinRoomId] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [previewStream, setPreviewStream] = useState(null);
  const [previewCamOff, setPreviewCamOff] = useState(false);
  const [previewMicOff, setPreviewMicOff] = useState(false);
  const previewVideoRef = useRef(null);

  // Initialize preview stream for pre-meeting check
  useEffect(() => {
    let active = true;

    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        setPreviewStream(stream);
        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.warn('Dashboard media preview warning:', err);
      });

    return () => {
      active = false;
      if (previewStream) {
        previewStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const togglePreviewCam = () => {
    if (!previewStream) return;
    const nextState = !previewCamOff;
    previewStream.getVideoTracks().forEach((t) => (t.enabled = !nextState));
    setPreviewCamOff(nextState);
  };

  const togglePreviewMic = () => {
    if (!previewStream) return;
    const nextState = !previewMicOff;
    previewStream.getAudioTracks().forEach((t) => (t.enabled = !nextState));
    setPreviewMicOff(nextState);
  };

  const handleCreateMeeting = async () => {
    setCreating(true);
    try {
      const room = await apiCreateRoom(meetingTitle || `${currentUser?.name}'s Meeting`);
      // Clean up dashboard preview stream before entering room
      if (previewStream) {
        previewStream.getTracks().forEach((t) => t.stop());
      }
      onStartMeeting(room.roomId);
    } catch (err) {
      console.error('Failed to create room:', err);
      // Fallback: generate local ID
      const randomId = Math.random().toString(36).substring(2, 10);
      onStartMeeting(randomId);
    } finally {
      setCreating(false);
    }
  };

  const handleJoinMeeting = (e) => {
    e.preventDefault();
    if (!joinRoomId.trim()) return;

    // Clean up room code if URL was pasted
    let cleanCode = joinRoomId.trim();
    if (cleanCode.includes('/')) {
      const parts = cleanCode.split('/');
      cleanCode = parts[parts.length - 1];
    }

    if (previewStream) {
      previewStream.getTracks().forEach((t) => t.stop());
    }
    onStartMeeting(cleanCode);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none">
      {/* Top Navbar */}
      <header className="h-20 border-b border-slate-800/80 px-6 sm:px-12 flex items-center justify-between bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight text-white">Meet<span className="text-indigo-400">Space</span></span>
            <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
              WebRTC Core
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3 bg-slate-800/80 px-3.5 py-1.5 rounded-2xl border border-slate-700/60">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-xs shadow">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-200">{currentUser?.name || 'User'}</p>
              <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{currentUser?.email}</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Sign out"
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700/60 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 sm:p-10 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Instant Actions */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800/80 text-indigo-300 text-xs font-medium mb-3">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Next-Gen Video Collaboration</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Peer-to-peer video meetings, simplified.
              </h1>
              <p className="text-slate-400 text-base sm:text-lg mt-3 leading-relaxed">
                Connect with anyone anywhere. Ultra-low latency audio/video, screen sharing, collaborative whiteboard, and instant file exchange.
              </p>
            </div>

            {/* Action Card: Start or Join */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
              {/* Start Instant Meeting */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Launch a new room
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    placeholder="Meeting title (optional)"
                    className="flex-1 bg-slate-800/90 border border-slate-700/90 rounded-2xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button
                    onClick={handleCreateMeeting}
                    disabled={creating}
                    className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all duration-200 shrink-0"
                  >
                    <Plus className="w-5 h-5" />
                    <span>{creating ? 'Starting...' : 'New Meeting'}</span>
                  </button>
                </div>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-4 text-xs uppercase tracking-widest text-slate-500 font-medium">Or join existing</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              {/* Join with code */}
              <form onSubmit={handleJoinMeeting}>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    required
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value)}
                    placeholder="Enter Room Code or Link (e.g. room-123)"
                    className="flex-1 bg-slate-800/90 border border-slate-700/90 rounded-2xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold rounded-2xl border border-slate-700 flex items-center justify-center space-x-2 transition-colors shrink-0"
                  >
                    <span>Join</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Pre-Meeting Video Preview & Feature Cards */}
          <div className="lg:col-span-6 flex flex-col items-center">
            {/* Camera Preview Tile */}
            <div className="w-full max-w-md aspect-video bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden relative shadow-2xl flex items-center justify-center group">
              <video
                ref={previewVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover -scale-x-100 transition-opacity ${
                  previewCamOff ? 'opacity-0' : 'opacity-100'
                }`}
              />

              {previewCamOff && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-xl mb-2">
                    {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <p className="text-xs text-slate-400">Camera preview off</p>
                </div>
              )}

              {/* Floating Camera & Mic Preview Toggles */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center space-x-3 bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/50">
                <button
                  onClick={togglePreviewMic}
                  className={`p-2 rounded-full transition-colors ${
                    previewMicOff ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {previewMicOff ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <button
                  onClick={togglePreviewCam}
                  className={`p-2 rounded-full transition-colors ${
                    previewCamOff ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {previewCamOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                </button>
              </div>

              <div className="absolute top-3 left-3 bg-slate-950/60 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-medium text-slate-300 border border-slate-700/50">
                Ready to Join
              </div>
            </div>

            {/* Quick feature pill grid */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-md mt-6">
              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center space-x-3">
                <Monitor className="w-5 h-5 text-indigo-400 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-slate-200">Screen Sharing</p>
                  <p className="text-[11px] text-slate-500">getDisplayMedia</p>
                </div>
              </div>
              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center space-x-3">
                <Edit3 className="w-5 h-5 text-indigo-400 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-slate-200">Whiteboard</p>
                  <p className="text-[11px] text-slate-500">Realtime canvas</p>
                </div>
              </div>
              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center space-x-3">
                <MessageSquare className="w-5 h-5 text-indigo-400 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-slate-200">Live Chat</p>
                  <p className="text-[11px] text-slate-500">Socket.IO sync</p>
                </div>
              </div>
              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center space-x-3">
                <Paperclip className="w-5 h-5 text-indigo-400 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-slate-200">File Share</p>
                  <p className="text-[11px] text-slate-500">Instant download</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
