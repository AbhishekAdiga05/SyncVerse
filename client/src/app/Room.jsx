import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Save, LogOut, MessageSquare, Zap, Play, Loader2,
  Users, ChevronDown, Check, WifiOff, Wifi, PenTool,
  Copy, Terminal, HelpCircle, X, Monitor, PanelRightClose, PanelRight,
} from 'lucide-react';
import { Editor } from "@monaco-editor/react";
import { io as socketIO } from "socket.io-client";
import { MonacoBinding } from "y-monaco";
import * as Y from "yjs";
import { SocketIOProvider } from "y-socket.io";
import { useUser } from "@clerk/clerk-react";

import { useAi } from "./hooks/useAi.js";
import ChatPanel from "./components/ChatPanelNew.jsx";
import AIReviewPanel from "./components/AIReviewPanel.jsx";
import WhiteboardPanel from "./components/WhiteboardPanel.jsx";
import TerminalPanel from "./components/Terminal.jsx";
import { toast } from 'sonner';
import { API_URL } from './config.js';

/* ─── constants ─────────────────────────────────────────── */
const LANGUAGES = [
  { id: 63,  label: "JavaScript", monaco: "javascript" },
  { id: 74,  label: "TypeScript", monaco: "typescript" },
  { id: 71,  label: "Python",     monaco: "python"     },
  { id: 54,  label: "C++",        monaco: "cpp"        },
  { id: 62,  label: "Java",       monaco: "java"       },
  { id: 95,  label: "Go",         monaco: "go"         },
  { id: 73,  label: "Rust",       monaco: "rust"       },
];

const LANG_COLOR = {
  JavaScript: '#d29922', TypeScript: '#58a6ff', Python: '#3fb950',
  'C++': '#38bdf8', Java: '#fb923c', Go: '#a371f7', Rust: '#f78166',
};

const COLORS = [
  "#ef4444","#f97316","#f59e0b","#10b981",
  "#06b6d4","#3b82f6","#8b5cf6","#d946ef","#f43f5e",
];

const SHORTCUTS = [
  { keys: "Ctrl + S",        desc: "Save code"             },
  { keys: "Ctrl + Enter",    desc: "Run code"              },
  { keys: "Ctrl + `",        desc: "Toggle terminal"       },
  { keys: "Ctrl + B",        desc: "Toggle sidebar"        },
  { keys: "Ctrl + Shift + F",desc: "Format code (Monaco)"  },
  { keys: "Ctrl + /",        desc: "Toggle comment"        },
  { keys: "Ctrl + Z",        desc: "Undo"                  },
  { keys: "Ctrl + Y",        desc: "Redo"                  },
  { keys: "Ctrl + D",        desc: "Duplicate selection"   },
  { keys: "?",               desc: "Show this panel"       },
  { keys: "Escape",          desc: "Close panels / menus"  },
];

function getInitials(name = "") {
  return name.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2) || "?";
}

/* ─── component ─────────────────────────────────────────── */
export default function Room() {
  const { roomId } = useParams();
  const navigate   = useNavigate();
  const { user, isLoaded } = useUser();

  const editorRef   = useRef(null);
  const bindingRef  = useRef(null);
  const providerRef = useRef(null);
  const langMenuRef = useRef(null);
  const usersMenuRef = useRef(null);
  const terminalRef = useRef(null);

  /* ui state */
  const [workspaceName, setWorkspaceName] = useState('Untitled Workspace');
  const [language, setLanguage]           = useState(LANGUAGES[0]);
  const [showLangMenu, setShowLangMenu]   = useState(false);
  const [showUsersMenu, setShowUsersMenu] = useState(false);
  const [codeSaved, setCodeSaved]         = useState(false);
  const [connected, setConnected]         = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [rightTab, setRightTab]           = useState('chat');
  const [showOutput, setShowOutput]       = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [idCopied, setIdCopied]           = useState(false);
  const [editingName, setEditingName]     = useState(false);
  const [sidebarOpen, setSidebarOpen]     = useState(true);

  /* collab state */
  const [users, setUsers]         = useState([]);
  const [userColor]               = useState(() => COLORS[Math.floor(Math.random() * COLORS.length)]);
  const [chatSocket, setChatSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  /* editor / run state */
  const ydoc  = useMemo(() => new Y.Doc(), []);
  const yText = useMemo(() => ydoc.getText("monaco"), [ydoc]);
  const [linesCount, setLinesCount] = useState(0);
  const [charsCount, setCharsCount] = useState(0);
  const [isRunning, setIsRunning]   = useState(false);
  const [output, setOutput]         = useState("");
  const [runCooldown, setRunCooldown] = useState(false);
  const aiHook = useAi();

  const username = user?.firstName || user?.username || "Guest";

  /* ─── effects ─────────────────────────────────────────── */
  useEffect(() => { if (isLoaded && !user) navigate('/'); }, [user, isLoaded, navigate]);

  useEffect(() => {
    fetch(`${API_URL}/api/workspaces/by-room/${roomId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.workspace) {
          if (d.workspace.name) setWorkspaceName(d.workspace.name);
          // Bug fix: restore the language that was chosen when creating the workspace
          if (d.workspace.language) {
            const saved = d.workspace.language.toLowerCase();
            const match = LANGUAGES.find(
              l => l.monaco === saved || l.label.toLowerCase() === saved
            );
            if (match) setLanguage(match);
          }
        }
      })
      .catch(() => {});
  }, [roomId]);

  useEffect(() => {
    if (!user) return;
    const s = socketIO(API_URL);
    setChatSocket(s);
    return () => s.disconnect();
  }, [user]);

  useEffect(() => {
    const update = () => {
      const t = yText.toString();
      setLinesCount(t.split('\n').length);
      setCharsCount(t.length);
    };
    yText.observe(update);
    update();
    return () => yText.unobserve(update);
  }, [yText]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) {
        setShowLangMenu(false);
      }
      if (usersMenuRef.current && !usersMenuRef.current.contains(e.target)) {
        setShowUsersMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* Global keyboard shortcuts */
  useEffect(() => {
    const handler = (e) => {
      /* ? → shortcuts modal */
      if (e.key === '?' && !e.ctrlKey && !e.metaKey
          && !['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        setShowShortcuts(s => !s);
        return;
      }
      /* Escape → close modals / menus */
      if (e.key === 'Escape') {
        setShowShortcuts(false);
        setShowLangMenu(false);
        setShowUsersMenu(false);
        return;
      }
      /* Ctrl+S → save */
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveRef.current();
        return;
      }
      /* Ctrl+Enter → run */
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRunCodeRef.current();
        return;
      }
      /* Ctrl+` → toggle terminal */
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        setShowOutput(s => !s);
        return;
      }
      /* Ctrl+B → toggle sidebar */
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen(s => !s);
        return;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── editor mount ───────────────────────────────────── */
  const handleMount = useCallback((editor) => {
    editorRef.current = editor;
    if (!user || !roomId) return;

    const provider = new SocketIOProvider(API_URL, roomId, ydoc, { autoConnect: true });
    providerRef.current = provider;

    provider.on("status", ({ status }) => setConnected(status === "connected"));
    provider.awareness.setLocalStateField("user", { name: username, username, color: userColor });

    const updateUsers = () => {
      const states = Array.from(provider.awareness.getStates().values());
      setUsers(states.filter(s => s.user?.username).map(s => s.user));
    };
    provider.awareness.on("change", updateUsers);
    updateUsers();

    bindingRef.current = new MonacoBinding(
      yText,
      editorRef.current.getModel(),
      new Set([editorRef.current]),
      provider.awareness
    );

    return () => {
      bindingRef.current?.destroy();
      provider.disconnect();
    };
  }, [roomId, user, username, userColor, ydoc, yText]);

  /* ─── run code ───────────────────────────────────────── */
  const handleRunCode = async (stdinInput = "") => {
    if (!editorRef.current || isRunning || runCooldown) return;
    const sourceCode = editorRef.current.getValue();
    setIsRunning(true);
    setOutput("");
    setShowOutput(true);
    terminalRef.current?.pushStdin(`[${language.label}] Run program ${stdinInput ? `with stdin: ${stdinInput}` : ''}`);
    try {
      const res  = await fetch(`${API_URL}/api/execution/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceCode, languageId: language.id, stdin: stdinInput }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Execution failed");
      const r = data.result;
      const outputText = r.stdout || r.stderr || r.compileOutput || r.message || "Program finished with no output.";
      setOutput(outputText);
      terminalRef.current?.pushOutput(outputText);
      toast.success("Code execution complete");
    } catch (err) {
      const errMsg = `Error: ${err.message}`;
      setOutput(errMsg);
      terminalRef.current?.pushError(errMsg);
      toast.error("Execution failed");
    } finally {
      setIsRunning(false);
      setRunCooldown(true);
      setTimeout(() => setRunCooldown(false), 2000);
    }
  };

  const handleSave = useCallback(async () => {
    try {
      await fetch(`${API_URL}/api/workspaces/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: workspaceName }),
      });
      setCodeSaved(true);
      toast.success('Code saved');
    } catch {
      toast.error('Save failed');
    }
    setTimeout(() => setCodeSaved(false), 2000);
  }, [roomId, workspaceName]);

  /* Refs so keyboard shortcuts always read latest closures */
  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;
  const handleRunCodeRef = useRef(handleRunCode);
  handleRunCodeRef.current = handleRunCode;

  const handleCopyRoomId = useCallback(() => {
    navigator.clipboard.writeText(roomId);
    setIdCopied(true);
    toast.success('Room ID copied!');
    setTimeout(() => setIdCopied(false), 2000);
  }, [roomId]);

  if (!isLoaded || !user) return null;

  /* ─── render ─────────────────────────────────────────── */
  return (
    <div className="h-screen flex flex-col bg-[#0d1117] text-[#e6edf3] overflow-hidden">

      {/* ══ Mobile gate overlay ═══════════════════════════════ */}
      <div className="mobile-gate">
        <div className="w-16 h-16 rounded-2xl bg-[#161b22] border border-[#30363d] flex items-center justify-center mb-2">
          <Monitor size={28} className="text-[#58a6ff]" />
        </div>
        <h2 className="text-lg font-semibold text-[#e6edf3]">Desktop Experience</h2>
        <p className="text-sm text-[#8b949e] max-w-xs" style={{ lineHeight: 1.6 }}>
          The collaborative editor is designed for desktop screens. Please open this page on a device with a larger display.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-4 px-5 py-2.5 bg-[#58a6ff] text-[#0d1117] rounded-md text-sm font-semibold hover:bg-[#4793e5] transition-colors"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* ══ 1px brand accent bar ═════════════════════════════ */}
      <div className="h-[2px] w-full shrink-0" style={{ background: 'linear-gradient(90deg, #58a6ff 0%, #a371f7 50%, #3fb950 100%)' }} />

      {/* ══ Keyboard Shortcuts Modal ═══════════════════════ */}
      {showShortcuts && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowShortcuts(false)}
          role="dialog"
          aria-label="Keyboard shortcuts"
        >
          <div
            className="bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl w-[420px] max-h-[80vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#21262d]">
              <div className="flex items-center gap-2">
                <HelpCircle size={16} className="text-[#58a6ff]" />
                <h2 className="text-sm font-semibold">Keyboard Shortcuts</h2>
              </div>
              <button
                onClick={() => setShowShortcuts(false)}
                className="p-1.5 rounded-md hover:bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3] transition-colors"
                aria-label="Close shortcuts"
              >
                <X size={15} />
              </button>
            </div>
            <div className="p-5 space-y-1.5">
              {SHORTCUTS.map(s => (
                <div key={s.keys} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[#21262d] transition-colors">
                  <span className="text-xs text-[#8b949e]">{s.desc}</span>
                  <kbd className="px-2 py-1 bg-[#0d1117] border border-[#30363d] rounded text-[10px] font-mono text-[#e6edf3] shadow-sm">{s.keys}</kbd>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-[#21262d] text-center">
              <span className="text-[10px] text-[#6e7681]">Press <kbd className="px-1.5 py-0.5 bg-[#21262d] border border-[#30363d] rounded text-[9px] font-mono">?</kbd> or <kbd className="px-1.5 py-0.5 bg-[#21262d] border border-[#30363d] rounded text-[9px] font-mono">Esc</kbd> to dismiss</span>
            </div>
          </div>
        </div>
      )}

      {/* ══ Top Bar ════════════════════════════════════════ */}
      <header className="h-12 border-b border-[#21262d] flex items-center px-3 sm:px-4 gap-2 sm:gap-3 shrink-0 relative z-50" style={{ background: 'rgba(13,17,23,0.97)', backdropFilter: 'blur(8px)' }}>

        {/* Logo */}
        <button onClick={() => navigate('/dashboard')} className="shrink-0 hover:opacity-75 transition-opacity flex items-center gap-2" title="Back to Dashboard" aria-label="Back to Dashboard">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#58a6ff] to-[#316dca] flex items-center justify-center">
            <Terminal size={12} strokeWidth={3} className="text-[#0d1117]" />
          </div>
          <span className="text-sm hidden md:block" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Pair<span className="text-[#58a6ff]">verse</span></span>
        </button>

        <span className="text-[#6e7681] hidden sm:inline">/</span>

        {/* Workspace name (inline editable) + copy room ID */}
        <div className="flex items-center gap-2 min-w-0">
          {editingName ? (
            <input
              autoFocus
              value={workspaceName}
              onChange={e => setWorkspaceName(e.target.value)}
              onBlur={() => {
                setEditingName(false);
                fetch(`${API_URL}/api/workspaces/${roomId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: workspaceName }),
                }).catch(() => {});
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === 'Escape') {
                  e.preventDefault();
                  setEditingName(false);
                }
              }}
              className="text-sm font-semibold bg-transparent border-b border-[#58a6ff] outline-none text-[#e6edf3] min-w-0 max-w-[200px] pb-px"
              style={{ caretColor: '#58a6ff' }}
            />
          ) : (
            <button
              onClick={() => setEditingName(true)}
              title="Click to rename workspace"
              className="text-sm font-semibold truncate hover:text-[#58a6ff] transition-colors text-left group flex items-center gap-1.5 max-w-[120px] sm:max-w-[200px]"
            >
              <span className="truncate">{workspaceName}</span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className="opacity-0 group-hover:opacity-60 transition-opacity shrink-0 text-[#8b949e]">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          )}
          <button
            onClick={handleCopyRoomId}
            title="Copy Room ID"
            aria-label="Copy Room ID"
            className="flex items-center gap-1 text-[10px] text-[#8b949e] font-mono bg-[#21262d] hover:bg-[#30363d] px-1.5 py-0.5 rounded transition-colors group shrink-0"
          >
            {roomId.slice(0, 8)}
            {idCopied
              ? <Check size={10} className="text-[#3fb950]" />
              : <Copy size={9} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            }
          </button>
        </div>

        <div className="flex-1" />

        {/* Language picker */}
        <div className="relative shrink-0 hidden sm:block" ref={langMenuRef}>
          <button
            onClick={() => setShowLangMenu(s => !s)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-medium transition-colors"
            aria-label="Select language"
          >
            <span className="w-2 h-2 rounded-full" style={{ background: LANG_COLOR[language.label] ?? '#8b949e' }} />
            {language.label}
            <ChevronDown size={11} className="text-[#8b949e]" />
          </button>
          {showLangMenu && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl overflow-hidden z-50" role="menu">
              {LANGUAGES.map(l => (
                <button
                  key={l.id}
                  role="menuitem"
                  onClick={() => {
                    setLanguage(l);
                    setShowLangMenu(false);
                    // Persist language change to database
                    fetch(`${API_URL}/api/workspaces/${roomId}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ language: l.monaco }),
                    }).catch(() => {});
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[#21262d] transition-colors ${l.id === language.id ? 'text-[#58a6ff]' : 'text-[#e6edf3]'}`}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: LANG_COLOR[l.label] ?? '#8b949e' }} />
                  {l.label}
                  {l.id === language.id && <Check size={10} className="ml-auto text-[#58a6ff]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Active users */}
        <div className="relative shrink-0" ref={usersMenuRef}>
          <button
            onClick={() => setShowUsersMenu(s => !s)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-[#21262d] transition-colors"
            aria-label={`${users.length} users online`}
          >
            <div className="flex -space-x-1.5">
              {users.slice(0, 3).map((u, i) => (
                <div key={i} className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] border-2 border-[#0d1117]"
                  style={{ background: u.color || '#888', color: '#0d1117', fontWeight: 700, zIndex: 10 - i }}>
                  {getInitials(u.username)}
                </div>
              ))}
            </div>
            <span className="text-xs text-[#8b949e] hidden sm:inline">{users.length}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-[#3fb950] pulse-connected' : 'bg-[#f85149]'}`} />
          </button>
          {showUsersMenu && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl overflow-hidden z-50" role="menu">
              <div className="px-3 py-2 border-b border-[#30363d]">
                <p className="text-[10px] text-[#8b949e] uppercase tracking-wide">Online · {users.length}</p>
              </div>
              {users.map((u, i) => (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-[#21262d]" role="menuitem">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px]" style={{ background: u.color, color: '#0d1117', fontWeight: 700 }}>
                    {getInitials(u.username)}
                  </div>
                  <p className="text-xs flex-1">{u.username}</p>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950]" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-[#21262d] hidden sm:block" />

        {/* Whiteboard toggle */}
        <button
          onClick={() => setShowWhiteboard(s => !s)}
          title={showWhiteboard ? 'Back to Editor' : 'Open Whiteboard'}
          aria-label={showWhiteboard ? 'Back to Editor' : 'Open Whiteboard'}
          className={`p-2 rounded-md transition-colors shrink-0 ${showWhiteboard ? 'bg-[#38bdf8]/10 text-[#38bdf8]' : 'text-[#8b949e] hover:bg-[#21262d] hover:text-[#e6edf3]'}`}
        >
          <PenTool size={15} />
        </button>

        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(s => !s)}
          title={sidebarOpen ? 'Collapse sidebar (Ctrl+B)' : 'Expand sidebar (Ctrl+B)'}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          className={`p-2 rounded-md transition-colors shrink-0 hidden md:flex ${sidebarOpen ? 'text-[#58a6ff] bg-[#58a6ff]/10' : 'text-[#8b949e] hover:bg-[#21262d] hover:text-[#e6edf3]'}`}
        >
          {sidebarOpen ? <PanelRightClose size={15} /> : <PanelRight size={15} />}
        </button>

        {/* Shortcuts */}
        <button
          onClick={() => setShowShortcuts(s => !s)}
          title="Keyboard Shortcuts (?)"
          aria-label="Keyboard shortcuts"
          className="p-2 rounded-md text-[#8b949e] hover:bg-[#21262d] hover:text-[#e6edf3] transition-colors shrink-0 hidden sm:flex"
        >
          <HelpCircle size={15} />
        </button>

        <div className="w-px h-5 bg-[#21262d]" />

        {/* Save */}
        <button
          onClick={handleSave}
          title="Save (Ctrl+S)"
          aria-label="Save code"
          className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md hover:bg-[#21262d] text-xs text-[#8b949e] hover:text-[#e6edf3] transition-colors shrink-0"
        >
          {codeSaved ? <Check size={13} className="text-[#3fb950]" /> : <Save size={13} />}
          <span className={`hidden sm:inline ${codeSaved ? 'text-[#3fb950]' : ''}`}>{codeSaved ? 'Saved' : 'Save'}</span>
        </button>

        {/* Leave */}
        <button
          onClick={() => navigate('/dashboard')}
          aria-label="Leave room"
          className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md hover:bg-[#f85149]/10 text-xs text-[#8b949e] hover:text-[#f85149] transition-colors shrink-0"
        >
          <LogOut size={13} /> <span className="hidden sm:inline">Leave</span>
        </button>
      </header>

      {/* ══ Body ═══════════════════════════════════════════ */}
      <div className="flex-1 flex flex-row overflow-hidden">

        {/* ── Left: Editor + Console ──────────────────────── */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-[#0d1117]">

          {/* ── File Tab bar ─────────────────────────────── */}
          <div className="flex items-center border-b border-[#21262d] shrink-0 bg-[#0d1117] overflow-x-auto">
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 border-r border-[#21262d] bg-[#161b22] shrink-0">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: LANG_COLOR[language.label] ?? '#8b949e', boxShadow: `0 0 6px ${LANG_COLOR[language.label] ?? '#8b949e'}60` }}
              />
              <span className="text-[11px] text-[#e6edf3] font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {showWhiteboard ? 'whiteboard.canvas' : `main.${language.monaco === 'cpp' ? 'cpp' : language.monaco === 'java' ? 'java' : language.monaco === 'python' ? 'py' : language.monaco === 'typescript' ? 'ts' : language.monaco === 'go' ? 'go' : language.monaco === 'rust' ? 'rs' : 'js'}`}
              </span>
            </div>
            <div className="flex-1" />
            {/* Editor sub-controls */}
            <div className="flex items-center gap-2 px-2 sm:px-3">
              <div className="flex items-center gap-1.5">
                {connected
                  ? <><span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] pulse-connected" style={{ boxShadow: '0 0 4px #3fb950' }} /><span className="text-[10px] text-[#3fb950] font-medium tracking-wide">LIVE</span></>
                  : <><span className="w-1.5 h-1.5 rounded-full bg-[#f85149]" /><span className="text-[10px] text-[#f85149] font-medium tracking-wide">OFFLINE</span></>
                }
              </div>
              <span className="text-[10px] text-[#484f58] hidden sm:inline">|</span>
              <span className="text-[10px] text-[#8b949e] hidden sm:inline">{linesCount} lines</span>
              <span className="text-[10px] text-[#484f58] hidden sm:inline">·</span>
              <span className="text-[10px] text-[#8b949e] hidden sm:inline">{charsCount} chars</span>
              <span className="text-[10px] text-[#484f58]">|</span>
              {/* Run button */}
              <button
                onClick={handleRunCode}
                disabled={isRunning}
                title="Run Code (Ctrl+Enter)"
                aria-label="Run code"
                className="flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: isRunning ? 'rgba(63,185,80,0.1)' : 'rgba(63,185,80,0.15)',
                  border: '1px solid rgba(63,185,80,0.4)',
                  color: '#3fb950',
                  boxShadow: isRunning ? 'none' : '0 0 12px rgba(63,185,80,0.2)',
                }}
              >
                {isRunning ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} fill="currentColor" />}
                {isRunning ? 'Running…' : 'Run'}
              </button>
            </div>
          </div>

          {/* Monaco / Whiteboard */}
          <div className="flex-1 overflow-hidden relative">
            {showWhiteboard ? (
              <WhiteboardPanel ydoc={ydoc} />
            ) : (
              <Editor
                height="100%"
                width="100%"
                language={language.monaco}
                theme="vs-dark"
                onMount={handleMount}
                options={{
                  minimap: { enabled: false },
                  padding: { top: 20, bottom: 20 },
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  lineHeight: 24,
                  scrollBeyondLastLine: false,
                }}
              />
            )}
          </div>

          {/* ── Terminal (animated) ──────────────────────── */}
          <div
            style={{
              overflow: 'hidden',
              maxHeight: showOutput ? '280px' : '0px',
              opacity: showOutput ? 1 : 0,
              transition: 'max-height 0.25s ease, opacity 0.2s ease',
            }}
          >
            <TerminalPanel
              ref={terminalRef}
              isRunning={isRunning}
              onExecute={handleRunCode}
              onClose={() => setShowOutput(false)}
            />
          </div>
        </div>

        {/* ── Divider ─────────────────────────────────────── */}
        {sidebarOpen && <div className="w-px bg-[#21262d] shrink-0" />}

        {/* ── Right: Sidebar (collapsible) ──────────────────── */}
        <div
          className="shrink-0 flex flex-col bg-[#0d1117] overflow-hidden transition-all duration-300"
          style={{
            width: sidebarOpen ? '360px' : '0px',
            opacity: sidebarOpen ? 1 : 0,
          }}
        >

          {/* Tab bar */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-[#21262d] shrink-0 bg-[#0d1117]">
            <button
              onClick={() => { setRightTab('chat'); setUnreadCount(0); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all relative"
              style={rightTab === 'chat' ? {
                background: 'rgba(88,166,255,0.12)',
                border: '1px solid rgba(88,166,255,0.3)',
                color: '#58a6ff',
                boxShadow: '0 0 10px rgba(88,166,255,0.1)',
              } : {
                background: 'transparent',
                border: '1px solid transparent',
                color: '#8b949e',
              }}
            >
              <MessageSquare size={13} />
              Chat
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#58a6ff] text-[#0d1117] text-[9px] font-bold flex items-center justify-center">{unreadCount}</span>
              )}
            </button>
            <button
              onClick={() => setRightTab('ai')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              style={rightTab === 'ai' ? {
                background: 'rgba(163,113,247,0.12)',
                border: '1px solid rgba(163,113,247,0.3)',
                color: '#a371f7',
                boxShadow: '0 0 10px rgba(163,113,247,0.1)',
              } : {
                background: 'transparent',
                border: '1px solid transparent',
                color: '#8b949e',
              }}
            >
              <Zap size={13} />
              AI Review
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden tab-fade-enter" key={rightTab}>
            {rightTab === 'chat' ? (
              <ChatPanel
                socket={chatSocket}
                roomId={roomId}
                username={username}
                userColor={userColor}
                onUnread={() => setUnreadCount(c => c + 1)}
              />
            ) : (
              <AIReviewPanel
                editorRef={editorRef}
                language={language.monaco}
                stderr={output}
                aiState={aiHook}
              />
            )}
          </div>
        </div>
      </div>

      {/* ══ Status bar ═════════════════════════════════════ */}
      <footer className="h-6 border-t border-[#21262d] flex items-center px-3 sm:px-4 gap-3 sm:gap-4 shrink-0" style={{ background: '#161b22' }}>
        <div className="flex items-center gap-1.5 text-[10px]" style={{ color: LANG_COLOR[language.label] ?? '#8b949e' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: LANG_COLOR[language.label] ?? '#8b949e', boxShadow: `0 0 4px ${LANG_COLOR[language.label] ?? '#8b949e'}` }} />
          {language.label}
        </div>
        <span className="text-[10px] text-[#484f58] hidden sm:inline">UTF-8</span>
        <span className="text-[10px] text-[#484f58] hidden sm:inline">LF</span>
        <div className="flex-1" />
        {/* Terminal toggle in status bar */}
        <button
          onClick={() => setShowOutput(s => !s)}
          className={`flex items-center gap-1 text-[10px] transition-colors px-1.5 py-0.5 rounded ${showOutput ? 'text-[#3fb950]' : 'text-[#8b949e] hover:text-[#e6edf3]'}`}
          title="Toggle Terminal (Ctrl+`)"
          aria-label="Toggle terminal"
        >
          <Terminal size={9} /> Terminal
        </button>
        <div className="flex items-center gap-1 text-[10px] text-[#484f58]">
          <Users size={9} /> {users.length} online
        </div>
        <button
          onClick={() => setShowShortcuts(true)}
          className="text-[10px] text-[#484f58] hover:text-[#e6edf3] transition-colors px-1 py-0.5 rounded hover:bg-[#21262d] hidden sm:inline"
          title="Keyboard Shortcuts"
          aria-label="Keyboard shortcuts"
        >
          ?
        </button>
        <span className="text-[10px] text-[#484f58] hidden sm:inline">PairForge</span>
      </footer>

      {/* Overlay to close menus */}
      {(showLangMenu || showUsersMenu) && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowLangMenu(false); setShowUsersMenu(false); }} />
      )}
    </div>
  );
}
