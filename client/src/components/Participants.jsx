import React from 'react';
import { Users, X, Mic, MicOff, Video, VideoOff, Crown } from 'lucide-react';

const Participants = ({
  participants = [],
  currentUser,
  isAudioMuted,
  isVideoMuted,
  peers = [],
  onClose
}) => {
  // Map socket IDs to their current media states
  const peerStateMap = {};
  peers.forEach((p) => {
    peerStateMap[p.socketId] = p;
  });

  return (
    <div className="w-full sm:w-80 md:w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full z-20 shadow-2xl animate-slide-left">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <Users className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-slate-100">
            People ({participants.length || 1})
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Participants List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-2">
        {/* Local user first */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'Y'}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200 flex items-center gap-1.5">
                <span>{currentUser?.name || 'You'}</span>
                <span className="text-xs text-indigo-400 font-semibold">(You)</span>
              </p>
              <p className="text-xs text-slate-400">Meeting participant</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-slate-400">
            {isAudioMuted ? (
              <MicOff className="w-4 h-4 text-rose-400" />
            ) : (
              <Mic className="w-4 h-4 text-emerald-400" />
            )}
            {isVideoMuted ? (
              <VideoOff className="w-4 h-4 text-rose-400" />
            ) : (
              <Video className="w-4 h-4 text-emerald-400" />
            )}
          </div>
        </div>

        {/* Remote peers */}
        {participants
          .filter((p) => p.name !== currentUser?.name && p.id !== currentUser?.id)
          .map((participant, index) => {
            const peerState = peerStateMap[participant.socketId];
            const peerMuted = peerState ? peerState.isMuted : false;
            const peerVideoOff = peerState ? peerState.isVideoOff : false;

            return (
              <div
                key={participant.socketId || index}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 border border-slate-800 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-sm">
                    {participant.name ? participant.name.charAt(0).toUpperCase() : 'P'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      {participant.name || 'Remote Peer'}
                    </p>
                    <p className="text-xs text-slate-500">Connected</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-slate-400">
                  {peerMuted ? (
                    <MicOff className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Mic className="w-4 h-4 text-emerald-400" />
                  )}
                  {peerVideoOff ? (
                    <VideoOff className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Video className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default Participants;
