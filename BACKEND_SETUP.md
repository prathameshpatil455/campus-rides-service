# Backend Setup Guide for Messages Feature

## Overview

This guide outlines the backend requirements for the messages feature, including both REST API endpoints and WebSocket server setup.

---

## 📋 Required Backend Setup

### 1. **REST API Endpoints**

Your backend needs to implement these REST endpoints:

#### Get Conversations

```
GET /api/messages/conversations
Authorization: Bearer <jwt_token>

Response:
{
  "success": true,
  "data": [
    {
      "id": "conv-123",
      "userId": "user-456",
      "userName": "Sarah Chen",
      "userInitials": "SC",
      "lastMessage": "I'll be at the main gate in 5 minutes",
      "route": "Main Gate → Engineering Block",
      "timestamp": "Yesterday",
      "unreadCount": 2,
      "isOnline": true
    }
  ]
}
```

#### Get Messages for a Conversation

```
GET /api/messages/conversations/:conversationId/messages
Authorization: Bearer <jwt_token>

Response:
{
  "success": true,
  "data": [
    {
      "id": "msg-789",
      "senderId": "user-456",
      "senderName": "Sarah Chen",
      "content": "Hi! I booked a seat on your ride tomorrow.",
      "timestamp": "10:30 AM",
      "isOwn": false
    }
  ]
}
```

#### Send Message

```
POST /api/messages/send
Authorization: Bearer <jwt_token>
Content-Type: application/json

Body:
{
  "conversationId": "conv-123",
  "content": "Hello!"
}

Response:
{
  "success": true,
  "data": {
    "id": "msg-789",
    "conversationId": "conv-123",
    "content": "Hello!",
    "timestamp": "2024-12-02T10:30:00Z"
  }
}
```

---

## 🔌 WebSocket Server Setup

### Option 1: Using Socket.io (Recommended)

#### Installation

```bash
npm install socket.io
```

#### Server Setup (Node.js/Express)

```javascript
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:4200', // Your Angular app URL
    methods: ['GET', 'POST'],
  },
});

// Store active connections
const activeConnections = new Map(); // userId -> socket

// WebSocket Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.query.token;

  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
});

// Handle WebSocket Connections
io.on('connection', (socket) => {
  const userId = socket.userId;

  console.log(`User ${userId} connected`);

  // Store connection
  activeConnections.set(userId, socket);

  // Broadcast online status
  io.emit('online', { userId, type: 'online' });

  // Handle incoming messages
  socket.on('message', async (data) => {
    try {
      const { conversationId, content, timestamp } = data;

      // Save message to database
      const message = await saveMessage({
        conversationId,
        senderId: userId,
        content,
        timestamp: timestamp || new Date().toISOString(),
      });

      // Find recipient user ID from conversation
      const recipientId = await getRecipientId(conversationId, userId);

      // Send to recipient if online
      const recipientSocket = activeConnections.get(recipientId);
      if (recipientSocket) {
        recipientSocket.emit('message', {
          type: 'message',
          conversationId,
          senderId: userId,
          content: message.content,
          timestamp: message.timestamp,
          messageId: message.id,
        });
      }

      // Also send confirmation back to sender
      socket.emit('message', {
        type: 'message',
        conversationId,
        senderId: userId,
        content: message.content,
        timestamp: message.timestamp,
        messageId: message.id,
      });
    } catch (error) {
      socket.emit('error', {
        type: 'error',
        message: 'Failed to send message',
      });
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    const { conversationId, isTyping } = data;
    const recipientId = getRecipientId(conversationId, userId);
    const recipientSocket = activeConnections.get(recipientId);

    if (recipientSocket) {
      recipientSocket.emit('typing', {
        type: 'typing',
        conversationId,
        userId,
        isTyping,
      });
    }
  });

  // Handle read receipts
  socket.on('read_receipt', (data) => {
    const { conversationId, messageId } = data;
    const recipientId = getRecipientId(conversationId, userId);
    const recipientSocket = activeConnections.get(recipientId);

    if (recipientSocket) {
      recipientSocket.emit('read_receipt', {
        type: 'read_receipt',
        conversationId,
        messageId,
        readBy: userId,
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User ${userId} disconnected`);
    activeConnections.delete(userId);

    // Broadcast offline status
    io.emit('offline', { userId, type: 'offline' });
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready at ws://localhost:${PORT}`);
});
```

---

### Option 2: Using Native WebSocket (ws library)

#### Installation

```bash
npm install ws
```

#### Server Setup

```javascript
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({
  server,
  path: '/messages/ws',
  verifyClient: (info) => {
    // Verify JWT token from query string
    const token = new URL(info.req.url, 'http://localhost').searchParams.get('token');
    if (!token) return false;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      info.req.userId = decoded.userId;
      info.req.user = decoded;
      return true;
    } catch {
      return false;
    }
  },
});

const activeConnections = new Map();

wss.on('connection', (ws, req) => {
  const userId = req.userId;
  activeConnections.set(userId, ws);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'message':
          handleMessage(data, userId);
          break;
        case 'typing':
          handleTyping(data, userId);
          break;
        case 'read_receipt':
          handleReadReceipt(data, userId);
          break;
      }
    } catch (error) {
      ws.send(
        JSON.stringify({
          type: 'error',
          message: 'Invalid message format',
        })
      );
    }
  });

  ws.on('close', () => {
    activeConnections.delete(userId);
    broadcast({ type: 'offline', userId });
  });
});

function broadcast(message) {
  activeConnections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}
```

---

## 🗄️ Database Schema Suggestions

### MongoDB Schema Example

```javascript
// Conversation Schema
{
  _id: ObjectId,
  participants: [userId1, userId2],
  lastMessage: String,
  lastMessageTime: Date,
  unreadCount: {
    [userId]: Number
  },
  createdAt: Date,
  updatedAt: Date
}

// Message Schema
{
  _id: ObjectId,
  conversationId: ObjectId,
  senderId: ObjectId,
  content: String,
  timestamp: Date,
  readBy: [ObjectId],
  createdAt: Date
}

// User Online Status (can use Redis or in-memory)
{
  userId: String,
  isOnline: Boolean,
  lastSeen: Date
}
```

---

## 📨 WebSocket Message Format

### Client → Server Messages

#### Send Message

```json
{
  "type": "message",
  "conversationId": "conv-123",
  "content": "Hello!",
  "timestamp": "2024-12-02T10:30:00Z"
}
```

#### Typing Indicator

```json
{
  "type": "typing",
  "conversationId": "conv-123",
  "isTyping": true
}
```

#### Read Receipt

```json
{
  "type": "read_receipt",
  "conversationId": "conv-123",
  "messageId": "msg-789"
}
```

### Server → Client Messages

#### New Message

```json
{
  "type": "message",
  "conversationId": "conv-123",
  "senderId": "user-456",
  "content": "Hi there!",
  "timestamp": "2024-12-02T10:30:05Z",
  "messageId": "msg-789"
}
```

#### Typing Indicator

```json
{
  "type": "typing",
  "conversationId": "conv-123",
  "userId": "user-456",
  "isTyping": true
}
```

#### Online/Offline Status

```json
{
  "type": "online",
  "userId": "user-456"
}
```

```json
{
  "type": "offline",
  "userId": "user-456"
}
```

#### Error

```json
{
  "type": "error",
  "message": "Failed to send message"
}
```

---

## 🔐 Authentication Flow

1. **Client connects** with JWT token in query string: `ws://localhost:3000/messages/ws?token=<jwt>`
2. **Server verifies** JWT token before accepting connection
3. **Server stores** userId from decoded token
4. **All messages** are associated with the authenticated userId

---

## 🚀 Implementation Steps

1. **Install WebSocket library** (Socket.io or ws)
2. **Create WebSocket server** on a separate route (`/messages/ws`)
3. **Implement JWT authentication** middleware
4. **Store active connections** in memory or Redis
5. **Handle message routing** to correct recipients
6. **Save messages to database** before broadcasting
7. **Implement REST endpoints** for initial data loading
8. **Test connection** from frontend

---

## 🧪 Testing

### Test WebSocket Connection

```javascript
// Using Socket.io client
const io = require('socket.io-client');
const socket = io('http://localhost:3000', {
  query: { token: 'your-jwt-token' },
});

socket.on('connect', () => {
  console.log('Connected!');
});

socket.on('message', (data) => {
  console.log('Received:', data);
});
```

---

## 📝 Notes

- **Production**: Use `wss://` (secure WebSocket) instead of `ws://`
- **Scaling**: For multiple servers, use Redis pub/sub for message broadcasting
- **Error Handling**: Always handle connection errors gracefully
- **Rate Limiting**: Implement rate limiting to prevent spam
- **Message Persistence**: Always save messages to database before sending

---

## 🔗 Frontend Connection URL

The frontend connects to:

- **Development**: `ws://localhost:3000/messages/ws?token=<jwt>`
- **Production**: `wss://campus-rides-service.onrender.com/messages/ws?token=<jwt>`

Make sure your backend WebSocket server is accessible at this path!
