# 🚀 MeetSpace - Realtime WebRTC Collaboration Platform

A modern, full-stack video conferencing and team collaboration platform built with **React**, **WebRTC**, **Socket.IO**, **Node.js**, **Express**, and **MongoDB / JWT**.

---

## 📋 Features Overview

| Feature | Technology | Description |
| :--- | :--- | :--- |
| **Authentication** | Node.js + JWT + Bcrypt | Secure registration, login, and token-based protected routes |
| **Video & Audio Calling** | WebRTC (`RTCPeerConnection`) | Low-latency peer-to-peer audio and video streaming |
| **Multi-User Rooms** | WebRTC Mesh + Socket.IO | Dynamic room creation, instant invite links, participant sync |
| **Camera & Microphone** | `getUserMedia()` | Toggle video feed, mute/unmute audio with state sync |
| **Screen Sharing** | `getDisplayMedia()` | Share screen, application window, or tab with auto-fallback |
| **Signaling Server** | Socket.IO | Exchange SDP offers, answers, and ICE candidates |
| **Realtime Chat** | Socket.IO | In-meeting instant messaging with timestamps and unread counters |
| **File Sharing** | Multer + Socket.IO + REST | Real-time file upload, room broadcast, and one-click download |
| **Collaborative Whiteboard** | HTML5 Canvas + Socket.IO | Synchronized drawing, color palette, eraser, brush size, PNG export |
| **Database** | MongoDB / Mongoose | User accounts, meeting records, and shared file metadata |
| **Security** | HTTPS / DTLS / JWT | WebRTC encrypted media streams and secure authorization |
| **User Interface** | React + Tailwind CSS + Lucide | Sleek dark-mode conference room UI with spotlight & grid views |

---

## 🧠 Architecture

### Media vs Signaling Separation

```
                    SERVER
              ┌─────────────────┐
              │   Socket.IO     │
              │                 │
              │ Signaling       │
              │ Room management │
              │ Chat            │
              │ Whiteboard sync │
              └───────┬─────────┘
                      │
          ┌───────────┴───────────┐
          ↓                       ↓
      Browser A               Browser B
          │                       │
          └────── WebRTC ─────────┘
             Audio / Video (P2P)
```

1. **Signaling (Socket.IO)**:
   - Exchanging SDP (Session Description Protocol) **offers** and **answers**.
   - Exchanging **ICE Candidates** (STUN servers: Google public STUN).
   - Real-time room join / leave notifications.
   - Text chat and collaborative whiteboard coordinate strokes.
   - File upload notifications.

2. **Media Flow (WebRTC Mesh)**:
   - Video and audio streams flow **directly between browsers peer-to-peer**.
   - Media data is encrypted end-to-end with **DTLS** and **SRTP**.
   - Video tracks dynamically switch between camera and screen share via `RTCRtpSender.replaceTrack()`.

---

## 🏗️ Project Structure

```
meetspace/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── VideoGrid.jsx       # Responsive auto-grid & spotlight view
│   │   │   ├── VideoTile.jsx       # Stream renderer, mute badges & avatar fallback
│   │   │   ├── Controls.jsx        # Bottom dock (Mic, Cam, Screen, Chat, Whiteboard)
│   │   │   ├── Chat.jsx            # In-call real-time messaging sidebar
│   │   │   ├── Participants.jsx    # Attendees list with media statuses
│   │   │   ├── Whiteboard.jsx      # Collaborative HTML5 canvas
│   │   │   └── FileShare.jsx       # Room file upload and download list
│   │   │
│   │   ├── pages/
│   │   │   ├── Login.jsx           # Sign in with email, password & demo button
│   │   │   ├── Register.jsx        # Account registration
│   │   │   ├── Dashboard.jsx       # New meeting, join with code, camera preview
│   │   │   └── MeetingRoom.jsx     # Live conference room
│   │   │
│   │   ├── hooks/
│   │   │   ├── useWebRTC.js        # WebRTC mesh lifecycle & track management
│   │   │   └── useSocket.js        # Socket.IO connection & room listeners
│   │   │
│   │   ├── services/
│   │   │   ├── socket.js           # Socket.IO client instance
│   │   │   └── api.js              # REST API calls & auth token handling
│   │   │
│   │   ├── App.jsx                 # Routing and session management
│   │   ├── main.jsx                # React DOM entrypoint
│   │   └── index.css               # Tailwind CSS & styling
│   │
│   ├── vite.config.js              # Vite server & backend proxy
│   ├── tailwind.config.js          # Tailwind styling system
│   └── package.json
│
├── server/
│   ├── controllers/
│   │   ├── authController.js       # Register, login, user profile
│   │   └── roomController.js       # Room creation, validation & file uploads
│   │
│   ├── models/
│   │   ├── User.js                 # User schema with bcrypt hashing
│   │   ├── Room.js                 # Room schema
│   │   └── File.js                 # Shared file metadata schema
│   │
│   ├── routes/
│   │   ├── authRoutes.js           # /api/auth endpoints
│   │   └── roomRoutes.js           # /api/rooms endpoints
│   │
│   ├── middleware/
│   │   └── authMiddleware.js       # JWT bearer token verification
│   │
│   ├── socket/
│   │   ├── signaling.js            # WebRTC offer/answer/ICE exchange
│   │   ├── chat.js                 # Socket.IO in-room messaging
│   │   └── whiteboard.js           # Whiteboard stroke broadcasting
│   │
│   ├── uploads/                    # Local storage for shared room files
│   ├── server.js                   # Express + HTTP + Socket.IO server
│   └── package.json
│
├── README.md
└── .gitignore
```

---

## ⚡ Getting Started

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **npm** or **yarn**
- **MongoDB** (optional: runs with seamless in-memory fallback if local MongoDB is offline)

---

### 2. Backend Setup (`server`)

Open a terminal and navigate to `meetspace/server`:

```bash
cd meetspace/server
npm install
npm run dev
# or: node server.js
```

The server will start on **`http://localhost:5000`** with Socket.IO signaling active.

---

### 3. Frontend Setup (`client`)

Open a second terminal and navigate to `meetspace/client`:

```bash
cd meetspace/client
npm install
npm run dev
```

The client will start on **`http://localhost:5173`**.

---

## 👥 Testing Multi-User Rooms Locally

1. Open `http://localhost:5173` in your main browser window (e.g. Chrome).
2. Click **One-Click Demo Login** or register a new user.
3. On the Dashboard, click **New Meeting**.
4. In the meeting room, click the **Copy Link** icon in the bottom controls or copy the URL (e.g. `http://localhost:5173?room=abc-123`).
5. Open an **Incognito Window** or a second browser (e.g. Edge, Firefox).
6. Navigate to the copied link `http://localhost:5173?room=abc-123`.
7. Sign in or create a second user.
8. **Both participants will immediately connect via WebRTC**:
   - Live two-way video and audio streams
   - Real-time chat messages
   - Collaborative whiteboard drawing
   - File sharing and instant downloads
   - Screen sharing (`getDisplayMedia()`)
