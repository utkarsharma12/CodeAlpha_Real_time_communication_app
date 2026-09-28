const API_BASE =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api';

export const getAuthToken = () => {
  return localStorage.getItem('meetspace_token');
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('meetspace_token', token);
  } else {
    localStorage.removeItem('meetspace_token');
  }
};

export const getStoredUser = () => {
  const user = localStorage.getItem('meetspace_user');
  try {
    return user ? JSON.parse(user) : null;
  } catch (e) {
    return null;
  }
};

export const setStoredUser = (user) => {
  if (user) {
    localStorage.setItem('meetspace_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('meetspace_user');
  }
};

const authHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const safeJson = async (res) => {
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    throw new Error(
      `Server communication error (${res.status}). Ensure the backend server is running on port 5000.`
    );
  }

  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }
  return data;
};

const handleFetch = async (url, options = {}) => {
  try {
    const res = await fetch(url, options);
    return await safeJson(res);
  } catch (err) {
    if (err.message && err.message.includes('Failed to fetch')) {
      throw new Error(
        'Cannot connect to backend server. Please verify the server is running on http://localhost:5000 (run: cd server && npm run dev).'
      );
    }
    throw err;
  }
};

// Auth API
export const apiLogin = async (email, password) => {
  return await handleFetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
};

export const apiRegister = async (name, email, password) => {
  return await handleFetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
};

export const apiGetMe = async () => {
  const data = await handleFetch(`${API_BASE}/auth/me`, {
    headers: { ...authHeaders() }
  });
  return data.user;
};

// Room API
export const apiCreateRoom = async (title, customId) => {
  const data = await handleFetch(`${API_BASE}/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders()
    },
    body: JSON.stringify({ title, customId })
  });
  return data.room;
};

export const apiGetRoom = async (roomId) => {
  const data = await handleFetch(`${API_BASE}/rooms/${roomId}`);
  return data.room;
};

// File Share API
export const apiUploadFile = async (roomId, file, senderName, senderId) => {
  const formData = new FormData();
  formData.append('file', file);
  if (senderName) formData.append('senderName', senderName);
  if (senderId) formData.append('senderId', senderId);

  const data = await handleFetch(`${API_BASE}/rooms/${roomId}/files`, {
    method: 'POST',
    headers: {
      ...authHeaders()
    },
    body: formData
  });
  return data.file;
};

export const apiGetRoomFiles = async (roomId) => {
  const data = await handleFetch(`${API_BASE}/rooms/${roomId}/files`);
  return data.files || [];
};
