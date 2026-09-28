import React, { useState } from 'react';
import VideoTile from './VideoTile';

const VideoGrid = ({
  localStream,
  peers = [],
  currentUser,
  isAudioMuted,
  isVideoMuted,
  isScreenSharing
}) => {
  const [pinnedId, setPinnedId] = useState(null);

  // Combine local user and remote peers
  const localParticipant = {
    id: 'local',
    stream: localStream,
    name: currentUser?.name || 'You',
    isLocal: true,
    isMuted: isAudioMuted,
    isVideoOff: isVideoMuted,
    isScreenSharing: isScreenSharing
  };

  const remoteParticipants = peers.map((p) => ({
    id: p.socketId,
    stream: p.stream,
    name: p.user?.name || 'Remote Peer',
    isLocal: false,
    isMuted: p.isMuted,
    isVideoOff: p.isVideoOff,
    isScreenSharing: p.isScreenSharing
  }));

  const allParticipants = [localParticipant, ...remoteParticipants];

  // Check if someone is presenting screen or pinned
  const screenSharer = allParticipants.find((p) => p.isScreenSharing);
  const activeFocus = pinnedId
    ? allParticipants.find((p) => p.id === pinnedId)
    : screenSharer;

  // Determine grid layout CSS based on number of participants
  const getGridClasses = (count) => {
    if (count === 1) return 'grid-cols-1 max-w-4xl mx-auto h-full max-h-[80vh]';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto h-full max-h-[80vh]';
    if (count <= 4) return 'grid-cols-1 sm:grid-cols-2 max-w-6xl mx-auto h-full max-h-[82vh]';
    if (count <= 6) return 'grid-cols-2 md:grid-cols-3 max-w-7xl mx-auto h-full max-h-[85vh]';
    return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-7xl mx-auto h-full max-h-[85vh]';
  };

  if (activeFocus && allParticipants.length > 1) {
    // Spotlight / Presentation layout
    return (
      <div className="w-full h-full flex flex-col lg:flex-row gap-4 p-4 overflow-hidden">
        {/* Main Spotlight Video */}
        <div className="flex-1 h-[60vh] lg:h-full min-h-[300px] flex items-center justify-center">
          <VideoTile
            stream={activeFocus.stream}
            name={activeFocus.name}
            isLocal={activeFocus.isLocal}
            isMuted={activeFocus.isMuted}
            isVideoOff={activeFocus.isVideoOff}
            isScreenSharing={activeFocus.isScreenSharing}
            isPinned={true}
            onPin={() => setPinnedId(null)}
          />
        </div>

        {/* Side / Bottom Thumbnail Strip */}
        <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto lg:w-72 h-36 lg:h-full shrink-0">
          {allParticipants
            .filter((p) => p.id !== activeFocus.id)
            .map((p) => (
              <div key={p.id} className="w-48 lg:w-full h-32 shrink-0">
                <VideoTile
                  stream={p.stream}
                  name={p.name}
                  isLocal={p.isLocal}
                  isMuted={p.isMuted}
                  isVideoOff={p.isVideoOff}
                  isScreenSharing={p.isScreenSharing}
                  isPinned={false}
                  onPin={() => setPinnedId(p.id)}
                />
              </div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-4 overflow-hidden">
      <div className={`grid gap-4 w-full items-center justify-center ${getGridClasses(allParticipants.length)}`}>
        {allParticipants.map((p) => (
          <div key={p.id} className="w-full h-full min-h-[220px] aspect-video">
            <VideoTile
              stream={p.stream}
              name={p.name}
              isLocal={p.isLocal}
              isMuted={p.isMuted}
              isVideoOff={p.isVideoOff}
              isScreenSharing={p.isScreenSharing}
              isPinned={pinnedId === p.id}
              onPin={() => setPinnedId(pinnedId === p.id ? null : p.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoGrid;
