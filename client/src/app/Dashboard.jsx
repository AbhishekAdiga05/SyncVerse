import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, Plus, LogIn, Clock, Code2, Search, Layers, AlertCircle, X, Loader2, Trash2, Link, ArrowRight } from 'lucide-react';
import { useUser, useAuth, UserButton } from "@clerk/clerk-react";
import { v4 as uuidV4 } from "uuid";
import { toast } from 'sonner';
import { API_URL } from './config.js';
import Modal from './components/ui/Modal.jsx';

const LANG_COLORS = {
  JavaScript: '#d29922', TypeScript: '#58a6ff', Python: '#3fb950',
  Rust: '#f78166', Go: '#a371f7', 'C++': '#38bdf8', Java: '#fb923c',
};

const MONACO_TO_LABEL = {
  javascript: 'JavaScript', typescript: 'TypeScript', python: 'Python',
  cpp: 'C++', java: 'Java', go: 'Go', rust: 'Rust',
};

const LABEL_TO_MONACO = Object.fromEntries(
  Object.entries(MONACO_TO_LABEL).map(([k, v]) => [v, k])
);

function SkeletonCard() {
  return (
    <div className="p-5 bg-overlay border border-border-default rounded-xl min-h-[160px] flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl skeleton" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 w-3/4 skeleton" />
          <div className="h-3 w-1/2 skeleton" />
        </div>
      </div>
      <div className="flex-1" />
      <div className="h-3 w-1/3 skeleton" />
      <div className="pt-3 border-t border-border-muted">
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
  const { getToken } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (isLoaded && !user) navigate('/');
  }, [user, isLoaded, navigate]);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const r = await fetch(`${API_URL}/api/workspaces/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await r.json();
        if (data.success) setWorkspaces(data.workspaces);
      } catch (err) {
        console.error("Failed to load workspaces", err);
        toast.error("Failed to load rooms");
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id, getToken]);

  const handleCreate = async (name, lang) => {
    const id = uuidV4();
    try {
      const monacoLang = LABEL_TO_MONACO[lang] || 'javascript';
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/workspaces`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ roomId: id, name, language: monacoLang }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || data.message || "Failed to create room");
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
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/workspaces/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || data.message || "Failed to delete room");
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
    <div className="min-h-screen bg-canvas text-fg-default">
      <nav className="h-14 border-b border-border-muted px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 bg-canvas/95 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-accent-blue flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
            <Terminal size={12} className="text-fg-on-emphasis" />
          </div>
          <span className="text-sm cursor-pointer hidden sm:inline font-mono" onClick={() => navigate('/')}>Sync<span className="text-accent-blue">Verse</span></span>
          <span className="ml-2 px-1.5 py-0.5 rounded-full bg-subtle text-fg-muted text-xs border border-border-default">
            {workspaces.length} room{workspaces.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-fg-muted hidden sm:inline">{user.firstName || user.username}</span>
          <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-6 h-6 rounded-full" } }} />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl text-fg-default font-semibold">My Rooms</h1>
            <p className="text-sm text-fg-muted mt-0.5">Your collaborative coding sessions</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowJoinModal(true)} className="flex items-center gap-2 px-3 py-2 bg-subtle hover:bg-emphasis border border-border-default text-fg-default rounded-md text-sm transition-colors">
              <LogIn size={14} /> <span className="hidden sm:inline">Join</span> Room
            </button>
            <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-3 py-2 bg-accent-green hover:brightness-110 text-white rounded-md text-sm font-semibold transition-all">
              <Plus size={14} /> <span className="hidden sm:inline">Create</span> Room
            </button>
          </div>
        </div>

        <div className="relative mb-5">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rooms…" className="w-full pl-9 pr-4 py-2.5 bg-overlay border border-border-default rounded-md text-sm text-fg-default placeholder:text-fg-subtle focus:outline-none focus:border-[#484f58] transition-colors" />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 sm:py-24 text-center">
            {search ? (
              <>
                <Search size={32} className="text-emphasis mb-4" />
                <p className="text-fg-muted mb-1">No rooms match "{search}"</p>
                <p className="text-sm text-fg-subtle">Try a different search term</p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-xl bg-overlay border border-border-default flex items-center justify-center mb-4">
                  <Layers size={24} className="text-fg-subtle" />
                </div>
                <p className="text-fg-muted mb-1">No rooms yet</p>
                <p className="text-sm text-fg-subtle mb-5">Create your first room to start collaborating.</p>
                <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-accent-green hover:brightness-110 text-white rounded-md text-sm font-semibold transition-all">
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
              <div key={room.roomId} onClick={() => navigate(`/room/${room.roomId}`)} className="group p-5 bg-overlay border border-border-default rounded-xl transition-all duration-300 cursor-pointer relative flex flex-col justify-between min-h-[160px] overflow-hidden hover:border-transparent hover:-translate-y-0.5" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 rounded-xl" style={{ border: `1px solid ${langColor}60`, background: `radial-gradient(circle at 50% 0%, ${langColor}15, transparent 70%)` }} />
                {room.ownerId === user.id && (
                  <button onClick={(e) => { e.stopPropagation(); setDeleteTarget({ roomId: room.roomId, name: room.name || 'Untitled Workspace' }); }} className="absolute top-3 right-3 p-1.5 rounded-md opacity-0 group-hover:opacity-100 bg-accent-red/10 text-accent-red hover:bg-accent-red hover:text-fg-on-emphasis transition-all z-10" title="Delete Room" aria-label="Delete room">
                    <Trash2 size={13} />
                  </button>
                )}
                <div className="flex items-start gap-3 mb-4 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-subtle flex items-center justify-center shrink-0 border border-border-default">
                    <Code2 size={18} style={{ color: langColor }} />
                  </div>
                  <div className="flex-1 min-w-0 pr-8">
                    <p className="text-[15px] text-fg-default truncate font-semibold">{room.name || 'Untitled Workspace'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-medium" style={{ color: langColor }}>{MONACO_TO_LABEL[room.language] ?? room.language}</span>
                      {room.ownerId === user.id && <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent-blue/10 text-accent-blue uppercase tracking-wide border border-accent-blue/20">Owner</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-1.5 text-xs text-fg-muted">
                    <Clock size={12} /> {timeAgo(room.updatedAt)}
                  </div>
                  <div className="flex -space-x-1">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] border-2 border-overlay bg-indigo-500 text-white font-bold shadow-sm">
                      {user.firstName ? user.firstName[0] : 'U'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border-default relative z-10 mt-auto">
                  <button onClick={e => handleCopyLink(room.roomId, e)} className="flex items-center gap-1.5 text-[11px] text-fg-muted hover:text-fg-default bg-subtle hover:bg-emphasis px-2 py-1 rounded transition-colors" title="Copy Invite Link" aria-label="Copy invite link">
                    <Link size={11} /> Copy Link
                  </button>
                  <div className="text-[11px] text-fg-muted group-hover:text-accent-blue flex items-center gap-1 font-medium transition-colors">
                    Join Room <ArrowRight size={12} className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                  </div>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreateRoomModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onCreate={handleCreate} />

      {/* Join Modal */}
      <JoinRoomModal open={showJoinModal} onClose={() => setShowJoinModal(false)} onJoin={handleJoin} />

      {/* Delete Modal */}
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

/* ── Create Room Modal ─────────────────────────────── */
function CreateRoomModal({ open, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [lang, setLang] = useState('JavaScript');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) { setError('Room name is required.'); return; }
    setCreating(true);
    try { await onCreate(name.trim(), lang); } catch {} finally { setCreating(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create New Room" width="max-w-md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-fg-muted mb-1.5">Room Name</label>
          <input autoFocus value={name} onChange={e => { setName(e.target.value); setError(''); }} placeholder="e.g. Sprint Planning, Hackathon Day 1"
            className="w-full px-3 py-2.5 rounded-md bg-canvas border border-border-default text-fg-default placeholder:text-fg-subtle text-sm focus:outline-none focus:border-accent-blue transition-colors"
            onKeyDown={e => e.key === 'Enter' && handleCreate()} />
          {error && <p className="text-xs text-accent-red mt-1 flex items-center gap-1"><AlertCircle size={11} /> {error}</p>}
        </div>
        <div>
          <label className="block text-sm text-fg-muted mb-1.5">Language</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {['JavaScript', 'TypeScript', 'Python', 'C++', 'Java', 'Go', 'Rust'].map(l => (
              <button key={l} onClick={() => setLang(l)}
                className={`px-3 py-2 rounded-md text-xs border transition-all ${lang === l ? 'bg-[#1c2128] font-medium shadow-sm' : 'border-border-default text-fg-muted hover:border-emphasis hover:text-fg-default bg-canvas'}`}
                style={lang === l ? { borderColor: LANG_COLORS[l] || '#58a6ff', color: LANG_COLORS[l] || '#58a6ff' } : {}}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-md border border-border-default text-fg-muted hover:text-fg-default hover:border-emphasis text-sm transition-colors">Cancel</button>
          <button onClick={handleCreate} disabled={creating} className="flex-1 py-2.5 rounded-md bg-accent-green hover:brightness-110 text-white text-sm transition-all flex justify-center items-center gap-2 font-semibold">
            {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Create Room'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ── Join Room Modal ────────────────────────────────── */
function JoinRoomModal({ open, onClose, onJoin }) {
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');

  const handleJoin = () => {
    if (!roomId.trim()) { setError('Room ID is required.'); return; }
    onJoin(roomId.trim());
  };

  return (
    <Modal open={open} onClose={onClose} title="Join a Room" description="Ask the room owner to share their Room ID." width="max-w-sm">
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-fg-muted mb-1.5">Room ID</label>
          <input autoFocus value={roomId} onChange={e => { setRoomId(e.target.value); setError(''); }} placeholder="e.g. 123e4567-e89b-..."
            className="w-full px-3 py-2.5 rounded-md bg-canvas border border-border-default text-fg-default placeholder:text-fg-subtle text-sm focus:outline-none focus:border-accent-blue transition-colors font-mono"
            onKeyDown={e => e.key === 'Enter' && handleJoin()} />
          {error && <p className="text-xs text-accent-red mt-1 flex items-center gap-1"><AlertCircle size={11} /> {error}</p>}
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-md border border-border-default text-fg-muted hover:text-fg-default hover:border-emphasis text-sm transition-colors">Cancel</button>
          <button onClick={handleJoin} className="flex-1 py-2.5 rounded-md bg-accent-blue hover:brightness-110 text-fg-on-emphasis text-sm flex items-center justify-center gap-2 transition-all font-semibold">Join</button>
        </div>
      </div>
    </Modal>
  );
}

/* ── Delete Room Modal ──────────────────────────────── */
function DeleteRoomModal({ roomName, onConfirm, onClose }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try { await onConfirm(); } finally { setDeleting(false); }
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Delete Room"
      description="This action cannot be undone."
      icon={<Trash2 size={18} className="text-accent-red" />}
      width="max-w-sm"
    >
      <p className="text-sm text-fg-muted leading-relaxed">
        Are you sure you want to delete <strong className="text-fg-default">{roomName}</strong>? All collaborators will lose access immediately.
      </p>
      <div className="flex gap-3 pt-4 border-t border-border-muted mt-4">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-md border border-border-default text-fg-muted hover:text-fg-default hover:border-emphasis text-sm transition-colors">Cancel</button>
        <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-md bg-accent-red hover:brightness-110 text-white text-sm transition-all flex justify-center items-center gap-2 font-semibold">
          {deleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</> : 'Delete Room'}
        </button>
      </div>
    </Modal>
  );
}
