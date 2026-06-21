// chat.socket.js — Server-side real-time chat handler
// Reuses the existing Socket.io (io) instance — zero new infrastructure.
// Messages are ephemeral (not stored in MongoDB): when a user refreshes, 
// the server sends the last 50 messages kept in memory per room.

const MAX_HISTORY = 50

// In-memory message history per room (cleared when server restarts)
const roomHistory = {}

export function initializeChatSockets(io) {
  io.on("connection", (socket) => {

    // Client joins a chat room
    socket.on("chat:join", ({ roomId }) => {
      socket.join(`chat:${roomId}`)

      // Send message history to the joining user
      const history = roomHistory[roomId] || []
      socket.emit("chat:history", history)
    })

    // Client sends a new message
    socket.on("chat:message", ({ roomId, username, color, text }) => {
      if (!text?.trim() || !roomId || !username) return

      const message = {
        id:        `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        username,
        color,
        text:      text.trim().slice(0, 500), // cap message length
        timestamp: Date.now(),
      }

      // Store in memory (ring buffer — keep only last MAX_HISTORY)
      if (!roomHistory[roomId]) roomHistory[roomId] = []
      roomHistory[roomId].push(message)
      if (roomHistory[roomId].length > MAX_HISTORY) {
        roomHistory[roomId].shift()
      }

      // Broadcast to ALL clients in the room (including sender)
      io.to(`chat:${roomId}`).emit("chat:message", message)
    })

    // Client leaves — no cleanup needed (Socket.io auto-removes from rooms)
  })
}
