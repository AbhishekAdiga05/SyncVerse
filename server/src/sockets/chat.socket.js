// chat.socket.js — Server-side real-time chat handler
// Reuses the existing Socket.io (io) instance — zero new infrastructure.
// Messages are ephemeral (not stored in MongoDB): when a user refreshes, 
// the server sends the last 50 messages kept in memory per room.
// Security: User identity is stored on the socket at join time, NOT
// taken from per-message payloads. This prevents client impersonation.

const MAX_HISTORY = 50;
const RATE_LIMIT_WINDOW_MS = 5000; // 5 seconds
const RATE_LIMIT_MAX_MSGS  = 10;   // max 10 messages per window

// In-memory message history per room (cleared when server restarts)
const roomHistory = {};

export function initializeChatSockets(io) {
  io.on("connection", (socket) => {
    // Per-socket rate-limit state
    let msgCount = 0;
    let windowStart = Date.now();

    // Client joins a chat room — stores identity on the socket
    socket.on("chat:join", ({ roomId, username, color }) => {
      if (!roomId || typeof roomId !== "string") return;
      socket.join(`chat:${roomId}`);
      // Store identity on the socket — used later to construct messages
      socket.data.username = (username || "Guest").slice(0, 50);
      socket.data.color = color || "#888";

      // Send message history to the joining user
      const history = roomHistory[roomId] || [];
      socket.emit("chat:history", history);
    });

    // Client sends a new message — uses identity stored at join time
    socket.on("chat:message", ({ roomId, text }) => {
      const username = socket.data.username;
      const color    = socket.data.color;
      if (!text?.trim() || !roomId || typeof roomId !== "string" || !username) return;

      // Rate limiting: reset window if expired
      const now = Date.now();
      if (now - windowStart > RATE_LIMIT_WINDOW_MS) {
        msgCount = 0;
        windowStart = now;
      }
      msgCount++;
      if (msgCount > RATE_LIMIT_MAX_MSGS) {
        socket.emit("chat:error", { message: "Sending too fast. Please slow down." });
        return;
      }

      const message = {
        id:        `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        username,
        color,
        text:      text.trim().slice(0, 500), // cap message length
        timestamp: Date.now(),
      };

      // Store in memory (ring buffer — keep only last MAX_HISTORY)
      if (!roomHistory[roomId]) roomHistory[roomId] = [];
      roomHistory[roomId].push(message);
      if (roomHistory[roomId].length > MAX_HISTORY) {
        roomHistory[roomId].shift();
      }

      // Broadcast to ALL clients in the room (including sender)
      io.to(`chat:${roomId}`).emit("chat:message", message);
    });

    // Client leaves — no cleanup needed (Socket.io auto-removes from rooms)
  });
}
