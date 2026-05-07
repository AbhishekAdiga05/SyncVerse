import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidV4 } from "uuid";
import {
  Code2, LayoutDashboard, Plus, LogIn, Trash2,
  Clock, Zap, Users, ExternalLink, Pencil, Check, X
} from "lucide-react";
import {
  SignedIn, SignedOut, SignInButton, UserButton, useUser
} from "@clerk/clerk-react";

const LANGUAGE_COLORS = {
  javascript: { bg: "bg-yellow-500/15", text: "text-yellow-400", dot: "bg-yellow-400", label: "JavaScript" },
  python:     { bg: "bg-blue-500/15",   text: "text-blue-400",   dot: "bg-blue-400",   label: "Python"     },
  cpp:        { bg: "bg-sky-500/15",    text: "text-sky-400",    dot: "bg-sky-400",    label: "C++"        },
  java:       { bg: "bg-orange-500/15", text: "text-orange-400", dot: "bg-orange-400", label: "Java"       },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function WorkspaceCard({ ws, onOpen, onDelete, onRename }) {
  const [editing, setEditing] = useState(false);
  const [nameVal, setNameVal] = useState(ws.name || "Untitled Workspace");
  const inputRef = useRef(null);
  const lang = LANGUAGE_COLORS[ws.language] || LANGUAGE_COLORS.javascript;

  const commitRename = () => {
    if (nameVal.trim() && nameVal !== ws.name) {
      onRename(ws.roomId, nameVal.trim());
    }
    setEditing(false);
  };

  const cancelRename = () => {
    setNameVal(ws.name || "Untitled Workspace");
    setEditing(false);
  };

  return (
    <div className="group relative bg-neutral-900 border border-neutral-800 rounded-xl p-4 hover:border-amber-500/60 hover:bg-neutral-800/60 transition-all duration-200 cursor-pointer">
      {/* Language badge */}
      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium mb-3 ${lang.bg} ${lang.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${lang.dot}`} />
        {lang.label}
      </div>

      {/* Name row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        {editing ? (
          <div className="flex items-center gap-1 flex-1">
            <input
              ref={inputRef}
              value={nameVal}
              onChange={e => setNameVal(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") cancelRename(); }}
              className="flex-1 bg-neutral-700 text-white text-sm font-semibold px-2 py-1 rounded border border-amber-500 focus:outline-none"
              autoFocus
              onClick={e => e.stopPropagation()}
            />
            <button onClick={e => { e.stopPropagation(); commitRename(); }} className="text-green-400 hover:text-green-300 transition">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={e => { e.stopPropagation(); cancelRename(); }} className="text-neutral-400 hover:text-neutral-300 transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <h3
            className="text-white font-semibold text-sm leading-snug flex-1 truncate"
            onClick={() => onOpen(ws.roomId)}
          >
            {ws.name || "Untitled Workspace"}
          </h3>
        )}

        {/* Actions — visible on hover */}
        {!editing && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={e => { e.stopPropagation(); setEditing(true); }}
              className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-700 transition"
              title="Rename"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(ws.roomId); }}
              className="p-1.5 rounded-md text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Room ID */}
      <p className="text-xs text-neutral-500 font-mono truncate mb-3" onClick={() => onOpen(ws.roomId)}>
        {ws.roomId}
      </p>

      {/* Footer */}
      <div
        className="flex items-center justify-between"
        onClick={() => onOpen(ws.roomId)}
      >
        <div className="flex items-center gap-1 text-xs text-neutral-500">
          <Clock className="w-3 h-3" />
          <span>{timeAgo(ws.updatedAt)}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
          <ExternalLink className="w-3 h-3" />
          Open
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [roomId, setRoomId] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // roomId to confirm

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetch(`http://localhost:3000/api/workspaces/${user.id}`)
        .then(res => res.json())
        .then(data => { if (data.success) setWorkspaces(data.workspaces); })
        .finally(() => setLoading(false));
    }
  }, [user]);

  const createNewRoom = async (e) => {
    e.preventDefault();
    setCreating(true);
    const id = uuidV4();
    if (user) {
      try {
        const res = await fetch("http://localhost:3000/api/workspaces", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId: id,
            ownerId: user.id,
            name: workspaceName.trim() || "Untitled Workspace",
          }),
        });
        const data = await res.json();
        if (data.success) setWorkspaces(prev => [data.workspace, ...prev]);
      } catch (err) {
        console.error("Failed to save workspace:", err);
      }
    }
    setCreating(false);
    navigate(`/room/${id}`);
  };

  const joinRoom = (e) => {
    e.preventDefault();
    if (roomId.trim()) navigate(`/room/${roomId.trim()}`);
  };

  const handleDelete = async (roomId) => {
    setWorkspaces(prev => prev.filter(w => w.roomId !== roomId));
    setDeleteConfirm(null);
    try {
      await fetch(`http://localhost:3000/api/workspaces/${roomId}`, { method: "DELETE" });
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleRename = async (roomId, newName) => {
    setWorkspaces(prev => prev.map(w => w.roomId === roomId ? { ...w, name: newName } : w));
    try {
      await fetch(`http://localhost:3000/api/workspaces/${roomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
    } catch (err) {
      console.error("Rename failed:", err);
    }
  };

  return (
    <main className="min-h-screen w-full bg-[#09090b] text-white overflow-x-hidden">

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[120px]" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-amber-600/5 blur-[100px] -translate-y-1/2" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4">

        {/* ── Nav ── */}
        <nav className="flex justify-between items-center py-5 border-b border-neutral-800/60">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <Code2 className="text-amber-400 w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">CodeWeave</span>
          </div>
          <div className="flex items-center gap-3">
            <SignedIn>
              <span className="text-sm text-neutral-400 hidden sm:block">
                Welcome, <span className="text-white font-medium">{user?.firstName || user?.username}</span>
              </span>
              <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-9 h-9" } }} />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-gray-950 font-semibold text-sm rounded-lg hover:bg-amber-400 transition-colors">
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section className="text-center pt-16 pb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-xs font-medium mb-6">
            <Zap className="w-3.5 h-3.5" />
            Real-time collaborative coding
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-4">
            Code together,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              ship faster
            </span>
          </h1>
          <p className="text-neutral-400 text-lg max-w-xl mx-auto leading-relaxed">
            A real-time collaborative editor with conflict-free syncing, multi-language execution, and persistent workspaces.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {["Yjs CRDTs", "Monaco Editor", "Judge0 Execution", "Clerk Auth", "MongoDB"].map(f => (
              <span key={f} className="px-3 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs font-medium">
                {f}
              </span>
            ))}
          </div>
        </section>

        {/* ── Actions + Dashboard grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 pb-20">

          {/* Left: Action panel */}
          <div className="lg:col-span-2 space-y-4">

            {/* Create workspace card */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-1">
                <Plus className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">New Workspace</h2>
              </div>
              <p className="text-neutral-500 text-xs mb-5">Start a fresh collaborative session</p>

              <form onSubmit={createNewRoom} className="space-y-3">
                <input
                  type="text"
                  placeholder="Workspace name (optional)"
                  className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                  value={workspaceName}
                  onChange={e => setWorkspaceName(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-gray-950 font-bold text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <span className="w-4 h-4 border-2 border-gray-950/30 border-t-gray-950 rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {creating ? "Creating..." : "Create Workspace"}
                </button>
              </form>
            </div>

            {/* Join by ID card */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-5 h-5 text-neutral-400" />
                <h2 className="text-base font-bold text-white">Join a Room</h2>
              </div>
              <p className="text-neutral-500 text-xs mb-5">Enter an existing room ID to collaborate</p>

              <form onSubmit={joinRoom} className="space-y-3">
                <input
                  type="text"
                  placeholder="Paste Room ID here"
                  className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white font-mono placeholder:text-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                  value={roomId}
                  onChange={e => setRoomId(e.target.value)}
                />
                <button
                  type="submit"
                  className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Join Workspace
                </button>
              </form>
            </div>
          </div>

          {/* Right: Dashboard */}
          <div className="lg:col-span-3">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 h-full min-h-[400px] flex flex-col">

              {/* Dashboard header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="w-5 h-5 text-amber-400" />
                  <h2 className="text-base font-bold text-white">Your Workspaces</h2>
                </div>
                <SignedIn>
                  <span className="text-xs text-neutral-500 font-mono bg-neutral-800 px-2 py-1 rounded-md">
                    {workspaces.length} workspace{workspaces.length !== 1 ? "s" : ""}
                  </span>
                </SignedIn>
              </div>

              <SignedOut>
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-8">
                  <div className="w-14 h-14 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                    <LayoutDashboard className="w-7 h-7 text-neutral-600" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Sign in to save workspaces</p>
                    <p className="text-neutral-500 text-sm mt-1">Your personal dashboard of coding sessions will appear here.</p>
                  </div>
                  <SignInButton mode="modal">
                    <button className="mt-2 px-4 py-2 bg-amber-500 text-gray-950 font-bold text-sm rounded-lg hover:bg-amber-400 transition-colors">
                      Sign In
                    </button>
                  </SignInButton>
                </div>
              </SignedOut>

              <SignedIn>
                {loading ? (
                  <div className="flex-1 flex flex-col gap-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-24 rounded-xl bg-neutral-800/50 animate-pulse" />
                    ))}
                  </div>
                ) : workspaces.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-8">
                    <div className="w-14 h-14 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                      <Code2 className="w-7 h-7 text-neutral-600" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">No workspaces yet</p>
                      <p className="text-neutral-500 text-sm mt-1">Create your first workspace to get started.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scroll">
                    {workspaces.map(ws => {
                      if (deleteConfirm === ws.roomId) {
                        return (
                          <div key={ws._id} className="bg-red-950/40 border border-red-800/60 rounded-xl p-4 flex items-center justify-between gap-3">
                            <p className="text-sm text-red-200">Delete <span className="font-semibold">"{ws.name}"</span>?</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDelete(ws.roomId)}
                                className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-400 transition"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-3 py-1.5 bg-neutral-700 text-white text-xs font-semibold rounded-lg hover:bg-neutral-600 transition"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <WorkspaceCard
                          key={ws._id}
                          ws={ws}
                          onOpen={(id) => navigate(`/room/${id}`)}
                          onDelete={(id) => setDeleteConfirm(id)}
                          onRename={handleRename}
                        />
                      );
                    })}
                  </div>
                )}
              </SignedIn>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
