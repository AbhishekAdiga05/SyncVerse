import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Save, LogOut, Play, Loader2,
  Users, ChevronDown, Check, PenTool,
  Copy, Terminal, HelpCircle, X, PanelRightClose, PanelRight,
  Search,
} from 'lucide-react';
import { Editor } from "@monaco-editor/react";
import { io as socketIO } from "socket.io-client";
import { MonacoBinding } from "y-monaco";
import * as Y from "yjs";
import { SocketIOProvider } from "y-socket.io";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle, usePanelRef } from 'react-resizable-panels';

import { useAi } from "./hooks/useAi.js";
import ChatPanel from "./components/ChatPanelNew.jsx";
import AIReviewPanel from "./components/AIReviewPanel.jsx";
import WhiteboardPanel from "./components/WhiteboardPanel.jsx";
import TerminalPanel from "./components/Terminal.jsx";
import ConnectionBanner from "./components/ConnectionBanner.jsx";
import CommandPalette from "./components/CommandPalette.jsx";
import SidebarRail from "./components/ui/SidebarRail.jsx";
import { toast } from 'sonner';
import { API_URL } from './config.js';

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
  { keys: "Ctrl + J",        desc: "Toggle terminal"       },
  { keys: "Ctrl + B",        desc: "Toggle sidebar"        },
  { keys: "Ctrl + K",        desc: "Command palette"       },
  { keys: "Ctrl + Shift + F",desc: "Format code (Monaco)"  },
  { keys: "Ctrl + /",        desc: "Toggle comment"        },
  { keys: "?",               desc: "Show shortcuts"        },
  { keys: "Escape",          desc: "Close panels / menus"  },
];

function getInitials(name = "") {
  return name.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2) || "?";
}

const FILE_EXT = {
  javascript: 'js', typescript: 'ts', python: 'py',
  cpp: 'cpp', java: 'java', go: 'go', rust: 'rs',
};

export default function Room() {
  const { roomId } = useParams();
  const navigate   = useNavigate();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  const editorRef    = useRef(null);
  const bindingRef   = useRef(null);
  const providerRef  = useRef(null);
  const langMenuRef  = useRef(null);
  const usersMenuRef = useRef(null);
  const terminalRef  = useRef(null);
  const mountedRef   = useRef(false);

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
  const [showPalette, setShowPalette]     = useState(false);
  const [idCopied, setIdCopied]           = useState(false);
  const [editingName, setEditingName]     = useState(false);
  const [sidebarOpen, setSidebarOpen]     = useState(true);
  const sidebarPanelRef = usePanelRef();
  const terminalPanelRef = useRef(null);
  const rightTabRef = useRef(rightTab);
  rightTabRef.current = rightTab;

  const [users, setUsers]         = useState([]);
  const [userColor]               = useState(() => COLORS[Math.floor(Math.random() * COLORS.length)]);
  const [chatSocket, setChatSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const ydoc  = useMemo(() => new Y.Doc(), []);
  const yText = useMemo(() => ydoc.getText("monaco"), [ydoc]);
  const [linesCount, setLinesCount] = useState(0);
  const [charsCount, setCharsCount] = useState(0);
  const [isRunning, setIsRunning]   = useState(false);
  const [output, setOutput]         = useState("");
  const [runCooldown, setRunCooldown] = useState(false);
  const aiHook = useAi(getToken);

  const username = user?.firstName || user?.username || "Guest";
  const langColor = LANG_COLOR[language.label] || '#8b949e';

  useEffect(() => { if (isLoaded && !user) navigate('/'); }, [user, isLoaded, navigate]);
  useEffect(() => { try { localStorage.removeItem('react-resizable-panels:room-layout'); } catch {} }, []);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const r = await fetch(`${API_URL}/api/workspaces/by-room/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = await r.json();
        if (d.success && d.workspace) {
          if (d.workspace.name) setWorkspaceName(d.workspace.name);
          if (d.workspace.language) {
            const saved = d.workspace.language.toLowerCase();
            const match = LANGUAGES.find(l => l.monaco === saved || l.label.toLowerCase() === saved);
            if (match) setLanguage(match);
          }
        }
      } catch {}
    })();
  }, [roomId, getToken]);

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
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) setShowLangMenu(false);
      if (usersMenuRef.current && !usersMenuRef.current.contains(e.target)) setShowUsersMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        setShowShortcuts(s => !s);
        return;
      }
      if (e.key === 'Escape') {
        setShowShortcuts(false); setShowPalette(false); setShowLangMenu(false); setShowUsersMenu(false);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSaveRef.current(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleRunCodeRef.current(); return; }
      if ((e.ctrlKey || e.metaKey) && (e.key === '`' || e.key.toLowerCase() === 'j')) { e.preventDefault(); e.stopPropagation(); toggleTerminal(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') { e.preventDefault(); e.stopPropagation(); toggleSidebar(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); e.stopPropagation(); setShowPalette(s => !s); return; }
    };
    window.addEventListener('keydown', handler, { capture: true });
    return () => window.removeEventListener('keydown', handler, { capture: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    bindingRef.current = new MonacoBinding(yText, editorRef.current.getModel(), new Set([editorRef.current]), provider.awareness);

    mountedRef.current = true;
  }, [roomId, user, username, userColor, ydoc, yText]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (bindingRef.current) { try { bindingRef.current.destroy(); } catch {} bindingRef.current = null; }
      if (providerRef.current) { try { providerRef.current.disconnect(); } catch {} providerRef.current = null; }
    };
  }, []);

  const handleRunCode = async (stdinInput = "") => {
    if (!editorRef.current || isRunning || runCooldown) return;
    const sourceCode = editorRef.current.getValue();
    setIsRunning(true); setOutput(""); setShowOutput(true);
    terminalRef.current?.pushStdin(`[${language.label}] Run program ${stdinInput ? `with stdin: ${stdinInput}` : ''}`);
    try {
      const token = await getToken();
      const res  = await fetch(`${API_URL}/api/execution/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
      const code = editorRef.current?.getValue() || '';
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/workspaces/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: workspaceName, code }),
      });
      if (!res.ok) throw new Error('Save request failed');
      setCodeSaved(true);
      toast.success('Workspace saved');
    } catch { toast.error('Save failed'); }
    setTimeout(() => setCodeSaved(false), 2000);
  }, [roomId, workspaceName, getToken]);

  const toggleSidebar = useCallback(() => {
    const panel = sidebarPanelRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) panel.expand(); else panel.collapse();
  }, []);

  const toggleTerminal = useCallback(() => {
    setShowOutput(prev => !prev);
  }, []);

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

  const paletteActions = useMemo(() => [
    {
      label: 'Editor',
      items: [
        { id: 'save', icon: <Save size={14} />, label: 'Save', shortcut: 'Ctrl+S', onAction: handleSave },
        { id: 'run', icon: <Play size={14} />, label: 'Run Code', shortcut: 'Ctrl+Enter', onAction: () => handleRunCode() },
        { id: 'copy-id', icon: <Copy size={14} />, label: 'Copy Room ID', onAction: handleCopyRoomId },
      ],
    },
    {
      label: 'Panels',
      items: [
        { id: 'terminal', icon: <Terminal size={14} />, label: 'Toggle Terminal', shortcut: 'Ctrl+J', onAction: toggleTerminal },
        { id: 'sidebar', icon: <PanelRight size={14} />, label: 'Toggle Sidebar', shortcut: 'Ctrl+B', onAction: toggleSidebar },
        { id: 'whiteboard', icon: <PenTool size={14} />, label: 'Toggle Whiteboard', onAction: () => setShowWhiteboard(s => !s) },
        { id: 'shortcuts', icon: <HelpCircle size={14} />, label: 'Keyboard Shortcuts', shortcut: '?', onAction: () => setShowShortcuts(true) },
      ],
    },
    {
      label: 'Navigation',
      items: [
        { id: 'leave', icon: <LogOut size={14} />, label: 'Leave Room', onAction: () => navigate('/dashboard') },
      ],
    },
  ], [handleSave, handleCopyRoomId, navigate]);

  if (!isLoaded || !user) return null;

  return (
    <div className="h-screen flex flex-col bg-canvas text-fg-default overflow-hidden select-none">

      <ConnectionBanner connected={connected} onReconnect={() => providerRef.current?.connect()} />

      <div className="h-[1.5px] w-full shrink-0" style={{ background: 'linear-gradient(90deg, #58a6ff 0%, #a371f7 50%, #3fb950 100%)' }} />

      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowShortcuts(false)} role="dialog" aria-label="Keyboard shortcuts">
          <div className="bg-overlay border border-border-default rounded-2xl shadow-2xl w-[420px] max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-muted">
              <div className="flex items-center gap-2">
                <HelpCircle size={16} className="text-accent-blue" />
                <h2 className="text-sm font-semibold">Keyboard Shortcuts</h2>
              </div>
              <button onClick={() => setShowShortcuts(false)} className="p-1.5 rounded-md hover:bg-subtle text-fg-muted hover:text-fg-default transition-colors" aria-label="Close shortcuts"><X size={15} /></button>
            </div>
            <div className="p-5 space-y-1.5">
              {SHORTCUTS.map(s => (
                <div key={s.keys} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-subtle transition-colors">
                  <span className="text-xs text-fg-muted">{s.desc}</span>
                  <kbd className="px-2 py-1 bg-canvas border border-border-default rounded text-[10px] font-mono text-fg-default shadow-sm">{s.keys}</kbd>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-border-muted text-center">
              <span className="text-[10px] text-fg-subtle">Press <kbd className="px-1.5 py-0.5 bg-subtle border border-border-default rounded text-[9px] font-mono">?</kbd> or <kbd className="px-1.5 py-0.5 bg-subtle border border-border-default rounded text-[9px] font-mono">Esc</kbd> to dismiss</span>
            </div>
          </div>
        </div>
      )}

      <CommandPalette open={showPalette} onClose={() => setShowPalette(false)} actions={paletteActions} />

      {/* ─── Top Bar ─────────────────────────────────────── */}
      <header className="h-14 border-b border-[#21262d] flex items-center px-4 sm:px-5 gap-3 shrink-0 relative z-50" style={{ background: 'rgba(13,17,23,0.92)', backdropFilter: 'blur(12px)' }}>
        <button onClick={() => navigate('/dashboard')} className="shrink-0 hover:opacity-75 transition-opacity flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg" title="Back to Dashboard">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#58a6ff] to-[#316dca] flex items-center justify-center">
            <Terminal size={14} strokeWidth={3} className="text-fg-on-emphasis" />
          </div>
          <span className="text-sm hidden md:block font-mono font-bold">Sync<span className="text-accent-blue">Verse</span></span>
        </button>

        <span className="text-fg-subtle text-sm mx-0.5 hidden sm:inline">/</span>

        {/* Workspace name */}
        <div className="flex items-center gap-2.5 min-w-0">
          {editingName ? (
            <input autoFocus value={workspaceName} onChange={e => setWorkspaceName(e.target.value)}
              onBlur={async () => { setEditingName(false); try { const token = await getToken(); await fetch(`${API_URL}/api/workspaces/${roomId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ name: workspaceName }) }); } catch {} }}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); setEditingName(false); } }}
              className="text-sm font-semibold bg-transparent border-b border-accent-blue outline-none text-fg-default min-w-0 max-w-[200px] pb-px" style={{ caretColor: '#58a6ff' }} />
          ) : (
            <button onClick={() => setEditingName(true)} title="Rename workspace" className="text-sm font-semibold truncate hover:text-accent-blue transition-colors text-left group flex items-center gap-1.5 max-w-[140px] sm:max-w-[220px]">
              <span className="truncate">{workspaceName}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-50 transition-opacity shrink-0 text-fg-muted">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          )}
          <button onClick={handleCopyRoomId} title="Copy Room ID" className="flex items-center gap-1.5 text-xs text-fg-muted font-mono bg-subtle hover:bg-emphasis px-2.5 py-1 rounded-lg transition-colors group shrink-0">
            {roomId.slice(0, 8)}
            {idCopied ? <Check size={11} className="text-accent-green" /> : <Copy size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
          </button>
        </div>

        <div className="flex-1" />

        {/* Right side toolbar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Connection indicator */}
          <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium ${connected ? 'text-[#3fb950] bg-[rgba(63,185,80,0.08)]' : 'text-[#f85149] bg-[rgba(248,81,73,0.08)]'}`}>
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-[#3fb950]' : 'bg-[#f85149]'}`} style={connected ? { boxShadow: '0 0 8px rgba(63,185,80,0.6)' } : {}} />
            <span className="hidden sm:inline">{connected ? 'Connected' : 'Offline'}</span>
          </div>

          <span className="w-px h-6 bg-border-muted mx-1 hidden sm:block" />

          {/* Language picker */}
          <div className="relative" ref={langMenuRef}>
            <button onClick={() => setShowLangMenu(s => !s)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-fg-muted hover:text-fg-default hover:bg-subtle transition-colors">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: langColor }} />
              <span className="hidden sm:inline">{language.label}</span>
              <span className="sm:hidden">{language.monaco}</span>
              <ChevronDown size={11} className="text-fg-muted" />
            </button>
            {showLangMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-40 bg-overlay border border-border-default rounded-xl shadow-2xl overflow-hidden z-50" role="menu">
                {LANGUAGES.map(l => (
                  <button key={l.id} role="menuitem" onClick={async () => { setLanguage(l); setShowLangMenu(false); try { const token = await getToken(); await fetch(`${API_URL}/api/workspaces/${roomId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ language: l.monaco }) }); } catch {} }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-3 text-xs hover:bg-subtle transition-colors ${l.id === language.id ? 'text-accent-blue' : 'text-fg-default'}`}>
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: LANG_COLOR[l.label] ?? '#8b949e' }} />
                    {l.label}
                    {l.id === language.id && <Check size={11} className="ml-auto text-accent-blue" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="w-px h-6 bg-border-muted mx-1 hidden sm:block" />

          {/* Users */}
          <div className="relative" ref={usersMenuRef}>
            <button onClick={() => setShowUsersMenu(s => !s)} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-subtle transition-colors">
              <div className="flex -space-x-1.5">
                {users.slice(0, 3).map((u, i) => (
                  <div key={i} className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] border-2 border-canvas font-bold shrink-0" style={{ background: u.color || '#888', color: '#0d1117', zIndex: 10 - i }}>
                    {getInitials(u.username)}
                  </div>
                ))}
              </div>
              <span className="text-xs font-medium text-fg-muted hidden sm:inline">{users.length}</span>
            </button>
            {showUsersMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-overlay border border-border-default rounded-xl shadow-2xl overflow-hidden z-50" role="menu">
                <div className="px-4 py-2.5 border-b border-border-default">
                  <p className="text-[10px] text-fg-muted uppercase tracking-wide font-semibold">Online &middot; {users.length}</p>
                </div>
                {users.map((u, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-subtle" role="menuitem">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ background: u.color, color: '#0d1117' }}>{getInitials(u.username)}</div>
                    <p className="text-xs font-medium flex-1">{u.username}</p>
                    <span className="w-2 h-2 rounded-full bg-accent-green" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tool buttons */}
          <div className="flex items-center gap-1">
            <button onClick={() => setShowWhiteboard(s => !s)} title={showWhiteboard ? 'Back to Editor' : 'Whiteboard'}
              className={`p-2.5 rounded-lg transition-colors ${showWhiteboard ? 'bg-accent-cyan/10 text-accent-cyan' : 'text-fg-muted hover:bg-subtle hover:text-fg-default'}`}>
              <PenTool size={17} />
            </button>
            <button onClick={toggleSidebar} title={sidebarOpen ? 'Collapse sidebar (Ctrl+B)' : 'Expand sidebar (Ctrl+B)'}
              className={`p-2.5 rounded-lg transition-colors ${sidebarOpen ? 'text-accent-blue bg-accent-blue/10' : 'text-fg-muted hover:bg-subtle hover:text-fg-default'}`}>
              {sidebarOpen ? <PanelRightClose size={17} /> : <PanelRight size={17} />}
            </button>
            <button onClick={toggleTerminal} title="Toggle Terminal (Ctrl+J)"
              className={`p-2.5 rounded-lg transition-colors hidden sm:flex ${showOutput ? 'text-accent-green bg-accent-green/10' : 'text-fg-muted hover:bg-subtle hover:text-fg-default'}`}>
              <Terminal size={17} />
            </button>
            <button onClick={() => setShowPalette(s => !s)} title="Command Palette (Ctrl+K)" className="p-2.5 rounded-lg text-fg-muted hover:bg-subtle hover:text-fg-default transition-colors hidden sm:flex">
              <Search size={17} />
            </button>
            <button onClick={() => setShowShortcuts(s => !s)} title="Keyboard Shortcuts (?)" className="p-2.5 rounded-lg text-fg-muted hover:bg-subtle hover:text-fg-default transition-colors hidden sm:flex">
              <HelpCircle size={17} />
            </button>
          </div>

          <span className="w-px h-6 bg-border-muted mx-1" />

          {/* Save */}
          <button onClick={handleSave} title="Save (Ctrl+S)"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${codeSaved ? 'text-accent-green bg-accent-green/10' : 'text-fg-muted hover:text-fg-default hover:bg-subtle'}`}>
            {codeSaved ? <Check size={15} /> : <Save size={15} />}
            <span className="hidden sm:inline">{codeSaved ? 'Saved' : 'Save'}</span>
          </button>

          {/* Leave */}
          <button onClick={() => navigate('/dashboard')} title="Leave room"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium text-fg-muted hover:text-accent-red hover:bg-accent-red/10 transition-colors">
            <LogOut size={15} /> <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </header>

      {/* ─── Body ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <div className="flex-1 flex flex-row overflow-hidden w-full">
          <PanelGroup direction="horizontal" className="flex-1 w-full" autoSaveId="room-layout-horizontal-fixed-v1">
            {/* Editor / Whiteboard */}
            <Panel defaultSize={65} minSize={20}>
              <div className="flex flex-col h-full">
                {/* Tab bar */}
                <div className="flex items-center border-b border-[#21262d] shrink-0 min-h-[33px]" style={{ background: 'rgba(22,27,34,0.6)' }}>
                  <div className="flex items-center gap-2 px-3 py-1 border-r border-[#21262d]" style={{ background: 'rgba(13,17,23,0.5)' }}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: langColor, boxShadow: `0 0 5px ${langColor}60` }} />
                    <span className="text-[11px] text-fg-default font-medium font-mono">
                      {showWhiteboard ? 'whiteboard.canvas' : `main.${FILE_EXT[language.monaco] || 'js'}`}
                    </span>
                    <span className="text-[9px] text-fg-muted px-1.5 py-0.5 rounded font-mono" style={{ background: 'rgba(255,255,255,0.04)' }}>{language.label}</span>
                  </div>
                  <div className="flex-1" />
                  <div className="flex items-center gap-2 px-2 sm:px-3">
                    <span className="text-[10px] text-fg-muted hidden sm:inline font-mono">{linesCount} lines</span>
                    <span className="text-[9px] text-fg-disabled hidden sm:inline" style={{ opacity: 0.3 }}>&#183;</span>
                    <span className="text-[10px] text-fg-muted hidden sm:inline font-mono">{charsCount} chars</span>
                    <button onClick={handleRunCode} disabled={isRunning} title="Run Code (Ctrl+Enter)"
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 active:scale-95"
                      style={{ background: isRunning ? 'rgba(63,185,80,0.1)' : 'rgba(63,185,80,0.15)', border: '1px solid rgba(63,185,80,0.4)', color: '#3fb950' }}>
                      {isRunning ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} fill="currentColor" />}
                      {isRunning ? 'Running' : 'Run'}
                    </button>
                  </div>
                </div>
                {/* Editor */}
                <div className="flex-1 overflow-hidden">
                  {showWhiteboard ? <WhiteboardPanel ydoc={ydoc} /> : (
                    <Editor height="100%" width="100%" language={language.monaco} theme="vs-dark" onMount={handleMount}
                      options={{ minimap: { enabled: false }, padding: { top: 16, bottom: 16 }, fontSize: 14, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", lineHeight: 24, scrollBeyondLastLine: false }} />
                  )}
                </div>
              </div>
            </Panel>

            {/* Resize handle */}
            <PanelResizeHandle className="group w-[4px] cursor-col-resize shrink-0 relative" style={{ background: 'var(--border-muted)' }}>
              <div className="absolute inset-y-0 left-0 w-[4px] transition-all duration-150 group-hover:bg-[#58a6ff] group-data-[resize-handle-active]:bg-[#58a6ff]" style={{ opacity: 0.5 }} />
              <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-[rgba(88,166,255,0.06)] group-data-[resize-handle-active]:bg-[rgba(88,166,255,0.06)] transition-all duration-150" />
            </PanelResizeHandle>

            {/* Sidebar */}
            <Panel panelRef={sidebarPanelRef} defaultSize={35} minSize={15} collapsible collapsedSize={0} id="sidebar-panel"
              onResize={() => { const p = sidebarPanelRef.current; if (p) setSidebarOpen(!p.isCollapsed()); }}>
              <div className="h-full flex flex-col bg-canvas overflow-hidden min-w-0">
                <div className="flex-1 overflow-hidden" key={rightTab}>
                  {rightTab === 'chat' ? (
                    <ChatPanel socket={chatSocket} roomId={roomId} username={username} userColor={userColor}
                      onUnread={() => { if (rightTabRef.current !== 'chat') setUnreadCount(c => c + 1); }} />
                  ) : (
                    <AIReviewPanel editorRef={editorRef} language={language.monaco} stderr={output} aiState={aiHook} />
                  )}
                </div>
              </div>
            </Panel>
          </PanelGroup>

          {/* Sidebar rail */}
          <div className="shrink-0 flex h-full">
            <SidebarRail activeTab={rightTab} onTabChange={(id) => {
              setRightTab(id);
              if (id === 'chat') setUnreadCount(0);
              const p = sidebarPanelRef.current;
              if (p && p.isCollapsed()) p.expand();
            }} unreadCount={unreadCount} />
          </div>
        </div>

        {/* Terminal */}
        {showOutput && (
          <div className="shrink-0 w-full border-t border-border-muted" style={{ height: '220px', animation: 'slide-up 0.15s ease' }}>
            <TerminalPanel ref={terminalRef} isRunning={isRunning} onExecute={handleRunCode} onClose={() => setShowOutput(false)} />
          </div>
        )}
      </div>

      {/* ─── Status Bar ──────────────────────────────────── */}
      <footer className="h-5 border-t border-[#21262d] flex items-center px-2 sm:px-3 gap-2 sm:gap-3 shrink-0" style={{ background: '#161b22' }}>
        <div className="flex items-center gap-1.5 text-[10px] font-medium" style={{ color: langColor }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: langColor, boxShadow: `0 0 4px ${langColor}` }} />
          {language.label}
        </div>
        <span className="text-[9px] text-fg-disabled hidden sm:inline font-mono" style={{ opacity: 0.5 }}>UTF-8</span>
        <span className="text-[9px] text-fg-disabled hidden sm:inline font-mono" style={{ opacity: 0.5 }}>LF</span>
        <div className="flex-1" />
        <button onClick={toggleTerminal} className={`flex items-center gap-1 text-[9px] transition-all px-1.5 py-0.5 rounded ${showOutput ? 'text-accent-green' : 'text-fg-muted hover:text-fg-default hover:bg-[rgba(255,255,255,0.04)]'}`}>
          <Terminal size={8} /> Terminal
        </button>
        <div className="flex items-center gap-1 text-[9px] text-fg-muted">
          <Users size={8} /> {users.length}
        </div>
        <button onClick={() => setShowShortcuts(true)} className="text-[9px] text-fg-disabled hover:text-fg-default transition-colors px-1 py-0.5 rounded hover:bg-[rgba(255,255,255,0.04)] hidden sm:inline font-mono" title="Keyboard Shortcuts">?</button>
        <span className="text-[9px] text-fg-disabled font-mono hidden sm:inline" style={{ opacity: 0.4 }}>SyncVerse</span>
      </footer>

      {/* Overlay */}
      {(showLangMenu || showUsersMenu) && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowLangMenu(false); setShowUsersMenu(false); }} />
      )}
    </div>
  );
}
