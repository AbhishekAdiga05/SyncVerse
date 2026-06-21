import { useState, useEffect, useRef } from "react"
import { Send, MessageSquare, X } from "lucide-react"

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function getInitials(name = "") {
  return name.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2) || "?"
}

export default function ChatPanel({ socket, roomId, username, userColor, onUnread }) {
  const [messages, setMessages]   = useState([])
  const [input, setInput]         = useState("")
  const bottomRef                 = useRef(null)
  const inputRef                  = useRef(null)

  // Join room + listen for messages
  useEffect(() => {
    if (!socket || !roomId) return

    socket.emit("chat:join", { roomId })

    const handleHistory = (history) => setMessages(history)
    const handleMessage = (msg) => {
      setMessages(prev => [...prev, msg])
      onUnread?.()
    }

    socket.on("chat:history", handleHistory)
    socket.on("chat:message",  handleMessage)

    return () => {
      socket.off("chat:history", handleHistory)
      socket.off("chat:message",  handleMessage)
    }
  }, [socket, roomId, onUnread])

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = () => {
    const text = input.trim()
    if (!text || !socket) return
    socket.emit("chat:message", { roomId, username, color: userColor, text })
    setInput("")
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="chat-panel">
      {/* Header */}
      <div className="chat-header">
        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
        <span className="chat-header-title">Room Chat</span>
        <span className="chat-header-count">{messages.length}</span>
      </div>

      {/* Messages */}
      <div className="chat-messages custom-scroll" id="chat-messages-list">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <MessageSquare className="w-8 h-8 text-neutral-700 mb-2" />
            <p className="text-xs text-neutral-600">No messages yet.</p>
            <p className="text-[10px] text-neutral-700 mt-1">Say hi to your collaborators!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.username === username
            const prevMsg = messages[i - 1]
            const grouped = prevMsg?.username === msg.username &&
                            msg.timestamp - prevMsg.timestamp < 60000

            return (
              <div key={msg.id || i} className={`chat-msg ${grouped ? "chat-msg--grouped" : ""}`}>
                {!grouped && (
                  <div className="chat-msg-meta">
                    {/* Avatar */}
                    <div
                      className="chat-avatar"
                      style={{ background: msg.color || "#888" }}
                      title={msg.username}
                    >
                      {getInitials(msg.username)}
                    </div>
                    <span className="chat-username" style={{ color: msg.color || "#a1a1aa" }}>
                      {msg.username}
                      {isMe && <span className="chat-you-badge">you</span>}
                    </span>
                    <span className="chat-time">{formatTime(msg.timestamp)}</span>
                  </div>
                )}
                <p className={`chat-text ${grouped ? "chat-text--grouped" : ""}`}>
                  {msg.text}
                </p>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="chat-input-row">
        <textarea
          ref={inputRef}
          className="chat-input custom-scroll"
          placeholder="Message the room…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          maxLength={500}
          id="chat-input-field"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          className="chat-send-btn"
          title="Send (Enter)"
          id="chat-send-btn"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
