import { useState, useRef, useEffect } from "react";
import { Send, MessageSquare } from "lucide-react";

export default function ChatPanel({ socket, roomId, username, userColor, onUnread }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!socket || !roomId) return;

    socket.emit("chat:join", { roomId });

    const handleHistory = (history) => setMessages(history);
    const handleMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (onUnread) onUnread();
    };

    socket.on("chat:history", handleHistory);
    socket.on("chat:message", handleMessage);

    return () => {
      socket.off("chat:history", handleHistory);
      socket.off("chat:message", handleMessage);
    };
  }, [socket, roomId, onUnread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text || !socket) return;
    socket.emit("chat:message", { roomId, username, color: userColor, text });
    setInput("");
    inputRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  function formatTime(timestamp) {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function getInitials(name = "") {
    return name.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2) || "?";
  }

  const grouped = messages.map((msg, i) => ({
    msg,
    showAvatar: i === 0 || messages[i - 1]?.username !== msg.username || !!msg.isSystem || !!messages[i - 1]?.isSystem || (msg.timestamp - messages[i - 1]?.timestamp > 60000)
  }));

  return (
    <div className="flex flex-col h-full bg-[#0d1117] overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <MessageSquare size={28} className="text-[#30363d] mb-3" />
            <p className="text-sm text-[#8b949e]">No messages yet</p>
            <p className="text-xs text-[#3d444d] mt-1">Start the conversation below.</p>
          </div>
        ) : (
          grouped.map(({ msg, showAvatar }, idx) => {
            if (msg.isSystem) {
              return (
                <div key={msg.id || idx} className="flex justify-center py-1">
                  <span className="text-xs text-[#3d444d] bg-[#161b22] px-2 py-0.5 rounded-full border border-[#21262d]">
                    {msg.text}
                  </span>
                </div>
              );
            }
            const isMe = msg.username === username;
            return (
              <div key={msg.id || idx} className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"} ${showAvatar ? "mt-3" : "mt-0.5"}`}>
                {/* Avatar */}
                {showAvatar ? (
                  <div
                    className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] mt-0.5"
                    style={{ background: msg.color || "#888", color: "#0d1117", fontWeight: 700 }}
                  >
                    {getInitials(msg.username)}
                  </div>
                ) : (
                  <div className="w-6 shrink-0" />
                )}
                
                <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                  {showAvatar && (
                    <div className={`flex items-center gap-1.5 mb-1 ${isMe ? "flex-row-reverse" : ""}`}>
                      <span className="text-xs" style={{ color: msg.color || "#888", fontWeight: 500 }}>
                        {isMe ? "You" : msg.username}
                      </span>
                      <span className="text-[10px] text-[#3d444d]">{formatTime(msg.timestamp)}</span>
                    </div>
                  )}
                  <div
                    className={`px-3 py-2 rounded-lg text-sm ${isMe ? "bg-[#1f4b8e] text-[#e6edf3]" : "bg-[#21262d] text-[#e6edf3]"}`}
                    style={{ lineHeight: 1.5, wordBreak: "break-word" }}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#21262d] px-3 py-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-[#161b22] border border-[#30363d] rounded-lg focus-within:border-[#484f58] transition-colors">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Message teammates…"
            className="flex-1 bg-transparent text-[#e6edf3] placeholder:text-[#3d444d] text-sm focus:outline-none"
            style={{ fontSize: "13px" }}
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            className="p-1 rounded text-[#8b949e] hover:text-[#58a6ff] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
        <p className="text-[10px] text-[#3d444d] mt-1.5 text-center">Press Enter to send</p>
      </div>
    </div>
  );
}
