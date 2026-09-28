import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MeetingRoom from './pages/MeetingRoom';
import { getAuthToken, setAuthToken, getStoredUser, setStoredUser } from './services/api';

function App() {
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Parse initial room parameter from URL if someone joins via shared link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setActiveRoomId(roomParam);
    }

    const token = getAuthToken();
    const storedUser = getStoredUser();

    if (token && storedUser) {
      setUser(storedUser);
    }

    setLoading(false);
  }, []);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setAuthToken(null);
    setStoredUser(null);
    setUser(null);
    setActiveRoomId(null);
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const handleStartMeeting = (roomId) => {
    setActiveRoomId(roomId);
    const url = new URL(window.location);
    url.searchParams.set('room', roomId);
    window.history.pushState({}, '', url);
  };

  const handleLeaveRoom = () => {
    setActiveRoomId(null);
    const url = new URL(window.location);
    url.searchParams.delete('room');
    window.history.pushState({}, '', url);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Not authenticated: render Login or Register
  if (!user) {
    if (authView === 'register') {
      return (
        <Register
          onAuthSuccess={handleAuthSuccess}
          onNavigateToLogin={() => setAuthView('login')}
        />
      );
    }
    return (
      <Login
        onAuthSuccess={handleAuthSuccess}
        onNavigateToRegister={() => setAuthView('register')}
      />
    );
  }

  // In active meeting room
  if (activeRoomId) {
    return (
      <MeetingRoom
        roomId={activeRoomId}
        currentUser={user}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  // Default: Dashboard
  return (
    <Dashboard
      currentUser={user}
      onStartMeeting={handleStartMeeting}
      onLogout={handleLogout}
    />
  );
}

export default App;
