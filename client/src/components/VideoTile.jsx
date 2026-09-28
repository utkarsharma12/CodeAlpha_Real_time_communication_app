import React, { useEffect, useRef } from 'react';
import { MicOff, VideoOff, Monitor, User } from 'lucide-react';

const VideoTile = ({
  stream,
  name,
  isLocal = false,
  isMuted = false,
  isVideoOff = false,
  isScreenSharing = false,
  isPinned = false,
  onPin
}) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div
      onClick={onPin}
      className={`relative group bg-slate-900/90 rounded-2xl overflow-hidden border border-slate-800 shadow-xl transition-all duration-300 flex items-center justify-center cursor-pointer ${
        isPinned ? 'ring-2 ring-indigo-500' : 'hover:border-slate-700'
      } h-full w-full`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isVideoOff ? 'opacity-0 absolute pointer-events-none' : 'opacity-100'
        } ${isLocal && !isScreenSharing ? '-scale-x-100' : ''}`}
      />

      {/* Avatar Placeholder when video is disabled */}
      {isVideoOff && (
        <div className="flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold text-2xl sm:text-3xl shadow-lg ring-4 ring-slate-800/80">
            {name ? name.charAt(0).toUpperCase() : <User className="w-10 h-10" />}
          </div>
          <span className="mt-3 text-slate-300 font-medium text-sm sm:text-base">
            {name} {isLocal && '(You)'}
          </span>
        </div>
      )}

      {/* Status Badges Header / Footer */}
      <div className="absolute top-3 left-3 flex items-center space-x-2">
        {isScreenSharing && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-600/90 text-white text-xs font-medium backdrop-blur-md shadow">
            <Monitor className="w-3.5 h-3.5" />
            <span>Presenting</span>
          </span>
        )}
      </div>

      {/* Bottom Name & Audio Status Tag */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center space-x-2 bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/50 shadow text-xs sm:text-sm text-slate-200 font-medium">
          <span>{name || 'Participant'} {isLocal && '(You)'}</span>
        </div>

        <div className="flex items-center space-x-1.5">
          {isMuted && (
            <div className="p-1.5 rounded-lg bg-rose-500/90 text-white backdrop-blur-md shadow" title="Microphone muted">
              <MicOff className="w-4 h-4" />
            </div>
          )}
          {isVideoOff && (
            <div className="p-1.5 rounded-lg bg-slate-800/90 text-slate-400 backdrop-blur-md shadow" title="Camera off">
              <VideoOff className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoTile;
