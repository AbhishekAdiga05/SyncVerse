import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, Plus, LogIn, Clock, Code2, Copy, ChevronDown, Search, Layers, AlertCircle, X, Loader2, Trash2, Link, ArrowRight } from 'lucide-react';
import { useUser, UserButton } from "@clerk/clerk-react";
import { v4 as uuidV4 } from "uuid";
import { toast } from 'sonner';
import { API_URL } from './config.js';

const LANG_COLORS = {
  JavaScript: '#d29922',
  TypeScript: '#58a6ff',
  Python:     '#3fb950',
  Rust:       '#f78166',
  Go:         '#a371f7',
  'C++':      '#38bdf8',
  Java:       '#fb923c',
};

// Monaco language id → display label
const MONACO_TO_LABEL = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python:     'Python',
  cpp:        'C++',
  java:       'Java',
  go:         'Go',
  rust:       'Rust',
};

const LABEL_TO_MONACO = Object.fromEntries(
  Object.entries(MONACO_TO_LABEL).map(([k, v]) => [v, k])
);

/* ── Delete confirmation modal ─────────────────────────────── */
function DeleteRoomModal({ roomName, onConfirm, onClose }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onConfirm();
    } catch {
      // error handled by parent
    }
    setDeleting(false);
  };

  return (
    <div className="delete-modal-overlay" onClick={onClose}>
      <div className="delete-modal-backdrop" />
      <div className="delete-modal" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#f85149]/10 border border-[#f85149]/20 flex items-center justify-center shrink-0">
            <Trash2 size={18} className="text-[#f85149]" />
          </div>
          <div>
            <h2 className="text-[#e6edf3] text-sm" style={{ fontWeight: 600 }}>Delete Room</h2>
            <p className="text-xs text-[#8b949e] mt-0.5">This action cannot be undone.</p>
          </div>
        </div>

        <p className="text-sm text-[#8b949e] mb-5" style={{ lineHeight: 1.6 }}>
          Are you sure you want to delete <strong className="text-[#e6edf3]">{roomName}</strong>? All collaborators will lose access immediately.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-md border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] hover:border-[#484f58] text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-md bg-[#f85149] hover:bg-[#da3633] text-white text-sm transition-colors flex justify-center items-center gap-2"
            style={{ fontWeight: 500 }}
          >
            {deleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</> : 'Delete Room'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateRoomModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [lang, setLang] = useState('JavaScript');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) { setError('Room name is required.'); return; }
    setCreating(true);
    try {
      await onCreate(name.trim(), lang);
    } catch {
      // parent handler already toasts — just release the button
    }
    setCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[#e6edf3]" style={{ fontWeight: 600 }}>Create New Room</h2>
          <button onClick={onClose} className="text-[#8b949e] hover:text-[#e6edf3] transition-colors" aria-label="Close"><X size={16} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#8b949e] mb-1.5" style={{ fontWeight: 400 }}>Room Name</label>
            <input
              autoFocus
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              placeholder="e.g. Sprint Planning, Hackathon Day 1"
              className="w-full px-3 py-2.5 rounded-md bg-[#0d1117] border border-[#30363d] text-[#e6edf3] placeholder:text-[#6e7681] text-sm focus:outline-none focus:border-[#58a6ff] transition-colors"
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
            {error && <p className="text-xs text-[#f85149] mt-1 flex items-center gap-1"><AlertCircle size={11} /> {error}</p>}
          </div>

          <div>
            <label className="block text-sm text-[#8b949e] mb-1.5" style={{ fontWeight: 400 }}>Language</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {['JavaScript', 'TypeScript', 'Python', 'C++', 'Java', 'Go', 'Rust'].map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-3 py-2 rounded-md text-xs border transition-all ${lang === l ? 'bg-[#1c2128] font-medium shadow-sm' : 'border-[#30363d] text-[#8b949e] hover:border-[#484f58] hover:text-[#e6edf3] bg-[#0d1117]'}`}
                  style={lang === l ? { borderColor: LANG_COLORS[l] || '#58a6ff', color: LANG_COLORS[l] || '#58a6ff' } : {}}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-md border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] hover:border-[#484f58] text-sm transition-colors">
              Cancel
            </button>
            <button onClick={handleCreate} disabled={creating} className="flex-1 py-2.5 rounded-md bg-[#238636] hover:bg-[#2ea043] text-white text-sm transition-colors flex justify-center items-center gap-2" style={{ fontWeight: 500 }}>
              {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Create Room'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function JoinRoomModal({ onClose, onJoin }) {
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');

  const handleJoin = async () => {
    if (!roomId.trim()) { setError('Room ID is required.'); return; }
    onJoin(roomId.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm bg-[#161b22] border border-[#30363d] rounded-xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[#e6edf3]" style={{ fontWeight: 600 }}>Join a Room</h2>
          <button onClick={onClose} className="text-[#8b949e] hover:text-[#e6edf3] transition-colors" aria-label="Close"><X size={16} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#8b949e] mb-1.5" style={{ fontWeight: 400 }}>Room ID</label>
            <input
              autoFocus
              value={roomId}
              onChange={e => { setRoomId(e.target.value); setError(''); }}
              placeholder="e.g. 123e4567-e89b-..."
              className="w-full px-3 py-2.5 rounded-md bg-[#0d1117] border border-[#30363d] text-[#e6edf3] placeholder:text-[#6e7681] text-sm focus:outline-none focus:border-[#58a6ff] transition-colors"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
            />
            {error && <p className="text-xs text-[#f85149] mt-1 flex items-center gap-1"><AlertCircle size={11} /> {error}</p>}
          </div>
          <p className="text-xs text-[#8b949e]">Ask the room owner to share their Room ID.</p>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-md border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3] hover:border-[#484f58] text-sm transition-colors">
              Cancel
            </button>
            <button onClick={handleJoin} className="flex-1 py-2.5 rounded-md bg-[#58a6ff] hover:bg-[#4793e5] text-[#0d1117] text-sm flex items-center justify-center gap-2 transition-colors" style={{ fontWeight: 600 }}>
              Join
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Skeleton card for loading state ───────────────────────── */
function SkeletonCard() {
  return (
    <div className="p-5 bg-[#161b22] border border-[#30363d] rounded-xl min-h-[160px] flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl skeleton" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 w-3/4 skeleton" />
          <div className="h-3 w-1/2 skeleton" />
        </div>
      </div>
      <div className="flex-1" />
      <div className="h-3 w-1/3 skeleton" />
      <div className="pt-3 border-t border-[#30363d]">
        <div className="h-3 w-1/4 skeleton" />
      </div>
    </div>
  );
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null); // { roomId, name }

  useEffect(() => {
    if (isLoaded && !user) navigate('/');
  }, [user, isLoaded, navigate]);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    fetch(`${API_URL}/api/workspaces/${user.id}`)
      .then(r => r.json())
      .then(data => { if (data.success) setWorkspaces(data.workspaces) })
      .catch(err => {
        console.error("Failed to load workspaces", err);
        toast.error("Failed to load rooms");
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleCreate = async (name, lang) => {
    const id = uuidV4();
    try {
      const monacoLang = LABEL_TO_MONACO[lang] || 'javascript';
      const res = await fetch(`${API_URL}/api/workspaces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: id, ownerId: user.id, name, language: monacoLang }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || "Failed to create room");
      }
      setWorkspaces(prev => [data.workspace, ...prev]);
      setShowCreateModal(false);
      toast.success(`Room "${name}" created`);
      navigate(`/room/${id}`);
    } catch (err) { 
      console.error("Create workspace failed", err);
      toast.error(err.message || "Failed to create room");
    }
  };

  const handleJoin = (id) => {
    setShowJoinModal(false);
    navigate(`/room/${id}`);
  };

  const handleCopyLink = (id, e) => {
    e.stopPropagation();
    const link = `${window.location.origin}/room/${id}`;
    navigator.clipboard.writeText(link);
    toast.success('Invite link copied');
  };

  const handleDeleteRoom = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/workspaces/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || "Failed to delete room");
      }
      setWorkspaces(prev => prev.filter(w => w.roomId !== id));
      setDeleteTarget(null);
      toast.success('Room deleted');
    } catch (err) {
      toast.error(err.message || 'Failed to delete room');
    }
  };

  const filteredRooms = workspaces.filter(r =>
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.language?.toLowerCase().includes(search.toLowerCase())
  );

  if (!isLoaded || !user) return null;

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3]">
      {/* Top Nav */}
      <nav className="h-14 border-b border-[#21262d] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 bg-[#0d1117]/95 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#58a6ff] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
            <Terminal size={12} className="text-[#0d1117]" />
          </div>
          <span className="text-sm cursor-pointer hidden sm:inline" style={{ fontFamily: "'JetBrains Mono', monospace" }} onClick={() => navigate('/')}>Sync<span className="text-[#58a6ff]">Verse</span></span>
          <span className="ml-2 px-1.5 py-0.5 rounded-full bg-[#21262d] text-[#8b949e] text-xs border border-[#30363d]">
            {workspaces.length} room{workspaces.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* User menu */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#8b949e] hidden sm:inline">{user.firstName || user.username}</span>
          <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-6 h-6 rounded-full" } }} />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl text-[#e6edf3]" style={{ fontWeight: 600 }}>My Rooms</h1>
            <p className="text-sm text-[#8b949e] mt-0.5">Your collaborative coding sessions</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowJoinModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#e6edf3] rounded-md text-sm transition-colors"
            >
              <LogIn size={14} /> <span className="hidden sm:inline">Join</span> Room
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-[#238636] hover:bg-[#2ea043] text-white rounded-md text-sm transition-colors"
              style={{ fontWeight: 500 }}
            >
              <Plus size={14} /> <span className="hidden sm:inline">Create</span> Room
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search rooms…"
            className="w-full pl-9 pr-4 py-2.5 bg-[#161b22] border border-[#30363d] rounded-md text-sm text-[#e6edf3] placeholder:text-[#6e7681] focus:outline-none focus:border-[#484f58] transition-colors"
          />
        </div>

        {/* Rooms grid */}
        {loading ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
             {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
           </div>
        ) : filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 sm:py-24 text-center">
            {search ? (
              <>
                <Search size={32} className="text-[#30363d] mb-4" />
                <p className="text-[#8b949e] mb-1">No rooms match "{search}"</p>
                <p className="text-sm text-[#6e7681]">Try a different search term</p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-xl bg-[#161b22] border border-[#30363d] flex items-center justify-center mb-4">
                  <Layers size={24} className="text-[#6e7681]" />
                </div>
                <p className="text-[#8b949e] mb-1">No rooms yet</p>
                <p className="text-sm text-[#6e7681] mb-5">Create your first room to start collaborating.</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white rounded-md text-sm transition-colors"
                >
                  <Plus size={14} /> Create Room
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRooms.map(room => {
              const langColor = LANG_COLORS[MONACO_TO_LABEL[room.language] ?? room.language] ?? '#8b949e';
              return (
              <div
                key={room.roomId}
                onClick={() => navigate(`/room/${room.roomId}`)}
                className="group p-5 bg-[#161b22] border border-[#30363d] rounded-xl transition-all duration-300 cursor-pointer relative flex flex-col justify-between min-h-[160px] overflow-hidden hover:border-transparent hover:-translate-y-0.5"
                style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 rounded-xl"
                     style={{ border: `1px solid ${langColor}60`, background: `radial-gradient(circle at 50% 0%, ${langColor}15, transparent 70%)` }} />
                
                {/* Top Actions (Delete) */}
                {room.ownerId === user.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget({ roomId: room.roomId, name: room.name || 'Untitled Workspace' });
                    }}
                    className="absolute top-3 right-3 p-1.5 rounded-md opacity-0 group-hover:opacity-100 bg-[#f85149]/10 text-[#f85149] hover:bg-[#f85149] hover:text-[#0d1117] transition-all z-10"
                    title="Delete Room"
                    aria-label="Delete room"
                  >
                    <Trash2 size={13} />
                  </button>
                )}

                {/* Header row */}
                <div className="flex items-start gap-3 mb-4 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-[#21262d] flex items-center justify-center shrink-0 border border-[#30363d]">
                    <Code2 size={18} style={{ color: langColor }} />
                  </div>
                  <div className="flex-1 min-w-0 pr-8">
                    <p className="text-[15px] text-[#e6edf3] truncate" style={{ fontWeight: 600 }}>{room.name || 'Untitled Workspace'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-medium" style={{ color: langColor }}>
                        {MONACO_TO_LABEL[room.language] ?? room.language}
                      </span>
                      {room.ownerId === user.id && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#58a6ff]/10 text-[#58a6ff] uppercase tracking-wide border border-[#58a6ff]/20">Owner</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info row */}
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-1.5 text-xs text-[#8b949e]">
                    <Clock size={12} />
                    {timeAgo(room.updatedAt)}
                  </div>
                  <div className="flex -space-x-1">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] border-2 border-[#161b22] bg-indigo-500 text-white font-bold shadow-sm">
                      {user.firstName ? user.firstName[0] : 'U'}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-[#30363d] relative z-10 mt-auto">
                  <button
                    onClick={e => handleCopyLink(room.roomId, e)}
                    className="flex items-center gap-1.5 text-[11px] text-[#8b949e] hover:text-[#e6edf3] bg-[#21262d] hover:bg-[#30363d] px-2 py-1 rounded transition-colors"
                    title="Copy Invite Link"
                    aria-label="Copy invite link"
                  >
                    <Link size={11} /> Copy Link
                  </button>
                  
                  <div className="text-[11px] text-[#8b949e] group-hover:text-[#58a6ff] flex items-center gap-1 font-medium transition-colors">
                    Join Room <ArrowRight size={12} className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                  </div>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>

      {showCreateModal && <CreateRoomModal onClose={() => setShowCreateModal(false)} onCreate={handleCreate} />}
      {showJoinModal && <JoinRoomModal onClose={() => setShowJoinModal(false)} onJoin={handleJoin} />}
      {deleteTarget && (
        <DeleteRoomModal
          roomName={deleteTarget.name}
          onConfirm={() => handleDeleteRoom(deleteTarget.roomId)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
