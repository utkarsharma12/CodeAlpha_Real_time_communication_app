import { useState, useEffect, useRef, useCallback } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export const useWebRTC = (roomId, socket, currentUser) => {
  const [localStream, setLocalStream] = useState(null);
  const [peers, setPeers] = useState({}); // { [socketId]: { peerId, stream, user, isMuted, isVideoOff, isScreenSharing } }
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [mediaError, setMediaError] = useState(null);

  // References
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peersRef = useRef({}); // { [socketId]: RTCPeerConnection }
  const peerUsersRef = useRef({}); // { [socketId]: userInfo }

  // Initialize Local Media Stream
  useEffect(() => {
    let active = true;

    const startLocalMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          }
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);
        setMediaError(null);
      } catch (err) {
        console.warn('[WebRTC] Camera/Mic access warning:', err.message);
        // Fallback to audio only if video fails (e.g. no camera)
        try {
          const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          if (!active) {
            audioOnlyStream.getTracks().forEach((t) => t.stop());
            return;
          }
          localStreamRef.current = audioOnlyStream;
          setLocalStream(audioOnlyStream);
          setIsVideoMuted(true);
        } catch (audioErr) {
          console.error('[WebRTC] Media access completely denied:', audioErr);
          setMediaError('Could not access camera or microphone. You can still join as spectator.');
        }
      }
    };

    startLocalMedia();

    return () => {
      active = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      Object.values(peersRef.current).forEach((pc) => pc.close());
      peersRef.current = {};
    };
  }, []);

  // Helper to create a new RTCPeerConnection for a peer
  const createPeerConnection = useCallback((targetSocketId, isInitiator = false) => {
    if (peersRef.current[targetSocketId]) {
      peersRef.current[targetSocketId].close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current[targetSocketId] = pc;

    // Attach local stream tracks
    const streamToSend = screenStreamRef.current || localStreamRef.current;
    if (streamToSend) {
      streamToSend.getTracks().forEach((track) => {
        pc.addTrack(track, streamToSend);
      });
    }

    // ICE Candidate event
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', {
          target: targetSocketId,
          candidate: event.candidate
        });
      }
    };

    // Remote Track event
    pc.ontrack = (event) => {
      console.log(`[WebRTC] Received remote stream from ${targetSocketId}`);
      const remoteStream = event.streams[0] || new MediaStream([event.track]);

      setPeers((prev) => ({
        ...prev,
        [targetSocketId]: {
          socketId: targetSocketId,
          stream: remoteStream,
          user: peerUsersRef.current[targetSocketId] || { name: 'Peer' },
          isMuted: prev[targetSocketId]?.isMuted || false,
          isVideoOff: prev[targetSocketId]?.isVideoOff || false,
          isScreenSharing: prev[targetSocketId]?.isScreenSharing || false
        }
      }));
    };

    // Connection state logging
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        console.log(`[WebRTC] Connection with ${targetSocketId} state:`, pc.connectionState);
      }
    };

    return pc;
  }, [socket]);

  // Signaling Event Listeners
  useEffect(() => {
    if (!socket || !roomId) return;

    // 1. Existing users in the room when we join
    const handleAllUsers = async (existingUsers) => {
      console.log('[WebRTC] Received all-users:', existingUsers);

      for (const peer of existingUsers) {
        const { socketId, user } = peer;
        peerUsersRef.current[socketId] = user;

        const pc = createPeerConnection(socketId, true);

        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          socket.emit('sending-signal', {
            userToCall: socketId,
            signal: offer,
            user: currentUser
          });
        } catch (err) {
          console.error('[WebRTC] Error creating offer for existing user:', err);
        }
      }
    };

    // 2. A new peer joined and offered connection to us
    const handleUserJoinedSignal = async ({ signal, callerId, user }) => {
      console.log(`[WebRTC] Received user-joined-signal from ${callerId}`);
      peerUsersRef.current[callerId] = user;

      const pc = createPeerConnection(callerId, false);

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('returning-signal', {
          callerId,
          signal: answer
        });
      } catch (err) {
        console.error('[WebRTC] Error handling incoming offer signal:', err);
      }
    };

    // 3. Caller receives returned answer signal
    const handleReceivingReturnedSignal = async ({ signal, id }) => {
      console.log(`[WebRTC] Received returned answer signal from ${id}`);
      const pc = peersRef.current[id];
      if (pc && pc.signalingState !== 'stable') {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
        } catch (err) {
          console.error('[WebRTC] Error setting remote description for answer:', err);
        }
      }
    };

    // 4. Remote ICE candidate received
    const handleIceCandidate = async ({ candidate, from }) => {
      const pc = peersRef.current[from];
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('[WebRTC] Error adding ICE candidate:', err);
        }
      }
    };

    // 5. Peer media state changes
    const handleUserToggledAudio = ({ socketId, isMuted }) => {
      setPeers((prev) => {
        if (!prev[socketId]) return prev;
        return {
          ...prev,
          [socketId]: { ...prev[socketId], isMuted }
        };
      });
    };

    const handleUserToggledVideo = ({ socketId, isVideoOff }) => {
      setPeers((prev) => {
        if (!prev[socketId]) return prev;
        return {
          ...prev,
          [socketId]: { ...prev[socketId], isVideoOff }
        };
      });
    };

    const handleUserScreenShare = ({ socketId, isScreenSharing }) => {
      setPeers((prev) => {
        if (!prev[socketId]) return prev;
        return {
          ...prev,
          [socketId]: { ...prev[socketId], isScreenSharing }
        };
      });
    };

    // 6. User left room
    const handleUserLeft = ({ socketId }) => {
      console.log(`[WebRTC] Peer ${socketId} left room`);
      if (peersRef.current[socketId]) {
        peersRef.current[socketId].close();
        delete peersRef.current[socketId];
      }
      delete peerUsersRef.current[socketId];

      setPeers((prev) => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
    };

    socket.on('all-users', handleAllUsers);
    socket.on('user-joined-signal', handleUserJoinedSignal);
    socket.on('receiving-returned-signal', handleReceivingReturnedSignal);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('user-toggled-audio', handleUserToggledAudio);
    socket.on('user-toggled-video', handleUserToggledVideo);
    socket.on('user-screen-share', handleUserScreenShare);
    socket.on('user-left', handleUserLeft);

    return () => {
      socket.off('all-users', handleAllUsers);
      socket.off('user-joined-signal', handleUserJoinedSignal);
      socket.off('receiving-returned-signal', handleReceivingReturnedSignal);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('user-toggled-audio', handleUserToggledAudio);
      socket.off('user-toggled-video', handleUserToggledVideo);
      socket.off('user-screen-share', handleUserScreenShare);
      socket.off('user-left', handleUserLeft);
    };
  }, [socket, roomId, currentUser, createPeerConnection]);

  // Toggle Microphone (Audio)
  const toggleAudio = useCallback(() => {
    if (!localStreamRef.current) return;
    const audioTracks = localStreamRef.current.getAudioTracks();
    if (audioTracks.length === 0) return;

    const nextMuted = !isAudioMuted;
    audioTracks.forEach((track) => {
      track.enabled = !nextMuted;
    });
    setIsAudioMuted(nextMuted);

    if (socket && roomId) {
      socket.emit('toggle-audio', { roomId, isMuted: nextMuted });
    }
  }, [isAudioMuted, socket, roomId]);

  // Toggle Camera (Video)
  const toggleVideo = useCallback(() => {
    if (!localStreamRef.current) return;
    const videoTracks = localStreamRef.current.getVideoTracks();
    if (videoTracks.length === 0) return;

    const nextVideoOff = !isVideoMuted;
    videoTracks.forEach((track) => {
      track.enabled = !nextVideoOff;
    });
    setIsVideoMuted(nextVideoOff);

    if (socket && roomId) {
      socket.emit('toggle-video', { roomId, isVideoOff: nextVideoOff });
    }
  }, [isVideoMuted, socket, roomId]);

  // Toggle Screen Sharing via getDisplayMedia()
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Stop screen sharing and restore camera
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }

      const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
      if (cameraTrack) {
        Object.values(peersRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(cameraTrack);
          }
        });
      }

      setIsScreenSharing(false);
      if (socket && roomId) {
        socket.emit('screen-share-status', { roomId, isScreenSharing: false });
      }
    } else {
      // Start Screen Sharing
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' },
          audio: false
        });

        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace video track on all peer connections
        Object.values(peersRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        // When user clicks the browser's native "Stop Sharing" bar
        screenTrack.onended = () => {
          if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((t) => t.stop());
            screenStreamRef.current = null;
          }
          const camTrack = localStreamRef.current?.getVideoTracks()[0];
          if (camTrack) {
            Object.values(peersRef.current).forEach((pc) => {
              const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
              if (sender) sender.replaceTrack(camTrack);
            });
          }
          setIsScreenSharing(false);
          if (socket && roomId) {
            socket.emit('screen-share-status', { roomId, isScreenSharing: false });
          }
        };

        setIsScreenSharing(true);
        if (socket && roomId) {
          socket.emit('screen-share-status', { roomId, isScreenSharing: true });
        }
      } catch (err) {
        console.error('[WebRTC] Screen share error:', err);
      }
    }
  }, [isScreenSharing, socket, roomId]);

  return {
    localStream,
    peers: Object.values(peers),
    isAudioMuted,
    isVideoMuted,
    isScreenSharing,
    mediaError,
    toggleAudio,
    toggleVideo,
    toggleScreenShare
  };
};
