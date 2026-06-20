import { Editor } from "@monaco-editor/react"
import { MonacoBinding } from "y-monaco"
import { useRef, useMemo, useState, useEffect, useCallback } from "react"
import * as Y from "yjs"
import { SocketIOProvider } from "y-socket.io"
import { useParams, useNavigate } from "react-router-dom"
import {
  Users, Code2, Copy, Check, ArrowLeft, Play,
  Terminal, Loader2, Trash2, ChevronDown, Sparkles,
  PanelLeftClose, PanelLeftOpen, Home
} from "lucide-react"
import { useUser } from "@clerk/clerk-react"
import { useAi } from "./hooks/useAi.js"
import AiPanel from "./components/AiPanel.jsx"
import ShortcutsPanel from "./components/ShortcutsPanel"
import { useToast } from "./components/Toast"

const COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#10b981",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#d946ef", "#f43f5e"
]

const LANGUAGES = [
  { id: 63, label: "JavaScript", monaco: "javascript", icon: "JS" },
  { id: 71, label: "Python",     monaco: "python",     icon: "Py" },
  { id: 54, label: "C++",        monaco: "cpp",         icon: "C+" },
  { id: 62, label: "Java",       monaco: "java",        icon: "Jv" },
]

const STATUS_STYLE = {
  "Accepted":              "text-green-400 bg-green-500/10",
  "Wrong Answer":          "text-red-400 bg-red-500/10",
  "Time Limit Exceeded":   "text-orange-400 bg-orange-500/10",
  "Runtime Error (NZEC)":  "text-red-400 bg-red-500/10",
  "Compilation Error":     "text-yellow-400 bg-yellow-500/10",
  "Internal Error":        "text-red-400 bg-red-500/10",
}

function getInitials(name = "") {
  return name.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2) || "?"
}

export default function Room() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user, isLoaded } = useUser()

  const editorRef    = useRef(null)
  const bindingRef   = useRef(null)
  const providerRef  = useRef(null)

  const [username, setUsername]         = useState(() => sessionStorage.getItem("username") || "")
  const [tempUsername, setTempUsername] = useState("")
  const [users, setUsers]               = useState([])
  const [copied, setCopied]             = useState(false)
  const [editorReady, setEditorReady]   = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0])
  const [workspaceName, setWorkspaceName] = useState("Untitled Workspace")

  const [stdin, setStdin]               = useState("")
  const [output, setOutput]             = useState("")
  const [executionMeta, setExecutionMeta] = useState(null)
  const [isRunning, setIsRunning]       = useState(false)

  // AI Intent Mode
  const [showAiPanel, setShowAiPanel]   = useState(() => localStorage.getItem("codewave-ai-panel") === "true")
  const aiHook                          = useAi()

  // Sidebar collapse
  const [sidebarOpen, setSidebarOpen]   = useState(() => {
    const saved = localStorage.getItem("codewave-sidebar")
    return saved !== null ? saved === "true" : true
  })

  // Connection status
  const [connected, setConnected]       = useState(false)

  // Shortcuts, minimap, font size
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showMinimap, setShowMinimap]   = useState(() => localStorage.getItem("codewave-minimap") === "true")
  const [fontSize, setFontSize]         = useState(() => Number(localStorage.getItem("codewave-fontsize")) || 14)
  const toast                          = useToast()

  // Load workspace metadata (name)
  useEffect(() => {
    fetch(`http://localhost:3000/api/workspaces/by-room/${roomId}`)
      .then(r => r.json())
      .then(data => { if (data.success && data.workspace?.name) setWorkspaceName(data.workspace.name) })
      .catch(() => {})
  }, [roomId])

  useEffect(() => { document.title = `${workspaceName} — CodeWeave` }, [workspaceName])

  // Persist user preferences
  useEffect(() => { localStorage.setItem("codewave-sidebar", String(sidebarOpen)) }, [sidebarOpen])
  useEffect(() => { localStorage.setItem("codewave-ai-panel", String(showAiPanel)) }, [showAiPanel])
  useEffect(() => { localStorage.setItem("codewave-minimap", String(showMinimap)) }, [showMinimap])
  useEffect(() => { localStorage.setItem("codewave-fontsize", String(fontSize)) }, [fontSize])

  // Auto-fill username from Clerk
  useEffect(() => {
    if (isLoaded && user) {
      const name = user.firstName || user.username || "Authenticated User"
      setUsername(name)
      sessionStorage.setItem("username", name)
    }
  }, [isLoaded, user])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        setShowShortcuts(p => !p)
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault()
        setSidebarOpen(p => !p)
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "i") {
        e.preventDefault()
        setShowAiPanel(p => !p)
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "m") {
        e.preventDefault()
        setShowMinimap(p => !p)
        return
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const ydoc      = useMemo(() => new Y.Doc(), [])
  const yText     = useMemo(() => ydoc.getText("monaco"), [ydoc])
  const userColor = useMemo(() => COLORS[Math.floor(Math.random() * COLORS.length)], [])

  const handleJoin = (e) => {
    e.preventDefault()
    if (tempUsername.trim()) {
      sessionStorage.setItem("username", tempUsername)
      setUsername(tempUsername)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    toast("Room link copied to clipboard", "success")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleMount = (editor) => {
    editorRef.current = editor
    setEditorReady(true)
  }

  const handleLanguageChange = (e) => {
    const next = LANGUAGES.find(l => l.id === Number(e.target.value))
    if (next) setSelectedLanguage(next)
  }

  const handleRunCode = async () => {
    if (!editorRef.current || isRunning) return

    const sourceCode = editorRef.current.getValue()
    setIsRunning(true)
    setOutput("")
    setExecutionMeta(null)

    try {
      const response = await fetch("http://localhost:3000/api/execution/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceCode, languageId: selectedLanguage.id, stdin }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.message || data.error || "Execution failed")

      const result = data.result
      const visibleOutput =
        result.stdout ||
        result.stderr ||
        result.compileOutput ||
        result.message ||
        result.status?.description ||
        "Program finished with no output."

      setOutput(visibleOutput)
      setExecutionMeta({
        status: result.status?.description || "Finished",
        time: result.time,
        memory: result.memory,
      })
    } catch (error) {
      setOutput(`Error: ${error.message}`)
      setExecutionMeta({ status: "Error" })
    } finally {
      setIsRunning(false)
    }
  }

  useEffect(() => {
    if (username && editorReady) {
      const provider = new SocketIOProvider("http://localhost:3000", roomId, ydoc, { autoConnect: true })
      providerRef.current = provider

      provider.on("status", ({ status }) => {
        setConnected(status === "connected")
      })

      provider.awareness.setLocalStateField("user", {
        name: username,
        username: username,
        color: userColor,
      })

      const updateUsers = () => {
        const states = Array.from(provider.awareness.getStates().values())
        setUsers(states.filter(s => s.user?.username).map(s => s.user))
      }

      provider.awareness.on("change", updateUsers)
      updateUsers()

      bindingRef.current = new MonacoBinding(
        yText,
        editorRef.current.getModel(),
        new Set([editorRef.current]),
        provider.awareness
      )

      function handleBeforeUnload() {
        provider.awareness.setLocalStateField("user", null)
      }
      window.addEventListener("beforeunload", handleBeforeUnload)

      return () => {
        if (bindingRef.current) bindingRef.current.destroy()
        provider.disconnect()
        window.removeEventListener("beforeunload", handleBeforeUnload)
      }
    }
  }, [username, editorReady, roomId, ydoc, yText, userColor])

  const handleReconnect = () => {
    if (providerRef.current) {
      providerRef.current.connect()
      toast("Attempting to reconnect...", "info")
    }
  }

  // ── Join screen ──
  if (!username) {
    return (
      <main className="h-screen w-full bg-[#09090b] flex items-center justify-center p-4 relative z-10">
        <div className="relative w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 mb-4">
              <Code2 className="text-amber-400 w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Join Workspace</h1>
            <p className="text-neutral-400 text-sm">Enter your name to start collaborating</p>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl">
            {/* Room info badge */}
            <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono bg-neutral-800/50 px-3 py-2 rounded-lg mb-5 truncate">
              <span className="w-2 h-2 rounded-full bg-amber-500/60 shrink-0" />
              Room: {roomId}
              <button
                onClick={copyLink}
                className="ml-auto p-1 rounded hover:bg-neutral-700 transition text-neutral-500 hover:text-neutral-300 shrink-0"
                title="Copy room link"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>

            <form onSubmit={handleJoin} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Your display name"
                required
                autoFocus
                className="w-full px-3 py-2.5 rounded-lg bg-neutral-800 text-white border border-neutral-700 focus:outline-none focus:border-amber-500 transition-colors placeholder:text-neutral-500 text-sm"
                value={tempUsername}
                onChange={e => setTempUsername(e.target.value)}
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-amber-500 text-gray-950 font-bold text-sm hover:bg-amber-400 transition-colors active:scale-[0.98]"
              >
                Enter Room
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-neutral-800">
              <p className="text-[10px] text-neutral-700 text-center">
                Share the room link to invite collaborators
              </p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const statusStyle = STATUS_STYLE[executionMeta?.status] || "text-neutral-400 bg-neutral-800"

  // ── Main Editor View ──
  return (
    <main className="h-screen w-full flex bg-[#09090b] text-white font-sans overflow-hidden relative">

      {/* Connection banner */}
      {username && !connected && (
        <div className="connection-banner">
          <span>Disconnected from collaboration server — changes won&apos;t sync</span>
          <button onClick={handleReconnect}>Reconnect</button>
        </div>
      )}

      {/* ── Sidebar ── */}
      <aside className={`bg-neutral-900 border-r border-neutral-800 flex flex-col shrink-0 transition-all duration-200
        ${sidebarOpen ? "w-60" : "w-12"}`}>

        {/* Toggle + Logo row */}
        <div className="px-2 py-2.5 border-b border-neutral-800 flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(p => !p)}
            className="icon-rail-btn shrink-0"
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
          {sidebarOpen && (
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <Code2 className="text-amber-400 w-4 h-4 shrink-0" />
              <span className="font-bold text-sm tracking-tight truncate">{workspaceName}</span>
            </div>
          )}
        </div>

        {/* Nav icons (always visible) */}
        <div className="flex flex-col items-center gap-1 px-1 py-2 border-b border-neutral-800">
          <button
            onClick={() => navigate("/dashboard")}
            className="icon-rail-btn w-full"
            title="Dashboard"
          >
            <Home className="w-4 h-4" />
            {sidebarOpen && <span className="text-xs text-neutral-500 ml-2 flex-1 text-left">Dashboard</span>}
          </button>
          <button
            onClick={() => setSidebarOpen(true)}
            className="icon-rail-btn active w-full"
            title="Collaborators"
          >
            <Users className="w-4 h-4" />
            {sidebarOpen && <span className="text-xs text-neutral-400 ml-2 flex-1 text-left">Collaborators</span>}
          </button>
        </div>

        {/* Room ID — only when expanded */}
        {sidebarOpen && (
          <div className="px-4 py-2.5 border-b border-neutral-800">
            <p className="text-[10px] text-neutral-600 mb-1 font-semibold uppercase tracking-widest">Room</p>
            <p className="text-xs text-neutral-400 font-mono truncate">{roomId}</p>
          </div>
        )}

        {/* Collaborators list — only when expanded */}
        {sidebarOpen && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center gap-1.5 text-neutral-600 mb-3 text-[10px] font-semibold uppercase tracking-widest">
              <Users className="w-3 h-3" />
              <span>Online</span>
              <span className="ml-auto bg-neutral-800 text-neutral-500 px-1.5 py-0.5 rounded-md">{users.length}</span>
            </div>
            <ul className="space-y-1">
              {users.map((u, idx) => (
                <li key={idx} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-neutral-800 transition-colors">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ backgroundColor: u.color || "#888" }}
                  >
                    {getInitials(u.username)}
                  </div>
                  <span className="text-sm font-medium truncate flex-1">{u.username}</span>
                  {u.username === username && (
                    <span className="text-[10px] text-neutral-700">you</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Spacer when collapsed */}
        {!sidebarOpen && <div className="flex-1" />}

        {/* Copy link */}
        <div className="p-2 border-t border-neutral-800">
          <button
            onClick={copyLink}
            className={`icon-rail-btn w-full ${copied ? "text-emerald-400" : ""}`}
            title={copied ? "Copied!" : "Copy Room Link"}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {sidebarOpen && (
              <span className={`text-xs ml-2 flex-1 text-left ${copied ? "text-emerald-400" : "text-neutral-500"}`}>
                {copied ? "Copied!" : "Copy link"}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* ── Editor Section ── */}
      <section className="flex-1 flex flex-col min-w-0">

        {/* Toolbar */}
        <header className="h-12 bg-neutral-900 border-b border-neutral-800 flex items-center px-4 gap-3 shrink-0">

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm min-w-0">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-neutral-600 hover:text-neutral-300 transition-colors flex items-center gap-1"
            >
              <Home className="w-3.5 h-3.5" />
            </button>
            <span className="text-neutral-700">/</span>
            <span className="text-neutral-400 text-xs font-medium truncate max-w-[140px]">{workspaceName}</span>
          </div>

          {/* Language select */}
          <div className="relative ml-2">
            <select
              value={selectedLanguage.id}
              onChange={handleLanguageChange}
              className="h-8 pl-3 pr-8 rounded-md bg-neutral-800 border border-neutral-700 text-xs text-white font-medium focus:outline-none focus:border-amber-500 appearance-none cursor-pointer"
            >
              {LANGUAGES.map(l => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
          </div>

          <div className="flex-1" />

          {/* Live collaborator avatar strip */}
          {users.length > 0 && (
            <div className="flex items-center -space-x-1.5 mr-1">
              {users.slice(0, 4).map((u, i) => (
                <div
                  key={i}
                  title={u.username}
                  className="w-6 h-6 rounded-full border-2 border-neutral-900 flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                  style={{ backgroundColor: u.color || "#888", zIndex: 10 - i }}
                >
                  {getInitials(u.username)}
                </div>
              ))}
              {users.length > 4 && (
                <div className="w-6 h-6 rounded-full border-2 border-neutral-900 bg-neutral-700 flex items-center justify-center text-[9px] font-bold text-neutral-400">
                  +{users.length - 4}
                </div>
              )}
            </div>
          )}

          {/* Minimap toggle */}
          <button
            onClick={() => setShowMinimap(p => !p)}
            title="Toggle minimap"
            className={`h-8 px-2.5 rounded-md text-[10px] font-bold transition-all duration-150 border
              ${ showMinimap
                ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                : "bg-neutral-800 text-neutral-500 border-neutral-700 hover:text-neutral-300 hover:border-neutral-600"
              }`}
          >
            Map
          </button>

          {/* AI toggle */}
          <button
            onClick={() => setShowAiPanel(p => !p)}
            title="Toggle AI Intent Mode"
            className={`h-8 px-3 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all duration-150 border
              ${ showAiPanel
                ? "bg-violet-500/20 text-violet-300 border-violet-500/40 btn-ai-active"
                : "bg-neutral-800 text-neutral-300 border-neutral-700 hover:border-violet-500/40 hover:text-violet-300"
              }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> AI
          </button>

          {/* Shortcuts */}
          <button
            onClick={() => setShowShortcuts(p => !p)}
            title="Keyboard shortcuts"
            className="h-8 px-2 rounded-md text-xs font-bold text-neutral-500 border border-neutral-700
                       hover:text-neutral-300 hover:border-neutral-600 transition-all bg-neutral-800"
          >
            ?
          </button>

          {/* Run button */}
          <button
            onClick={handleRunCode}
            disabled={isRunning || !editorReady}
            className="h-8 px-4 rounded-md bg-amber-500 text-gray-950 font-bold text-xs
                       hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors flex items-center gap-1.5 active:scale-95"
          >
            {isRunning
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Running…</>
              : <><Play className="w-3.5 h-3.5" /> Run Code</>
            }
          </button>
        </header>

        {/* Editor + I/O panel */}
        <div className="flex-1 w-full min-h-0 flex flex-col lg:flex-row">

          {/* Monaco editor */}
          <div className="flex-1 min-h-0 min-h-[300px] lg:min-h-0">
            <Editor
              height="100%"
              width="100%"
              language={selectedLanguage.monaco}
              defaultValue="// Start coding collaboratively here..."
              theme="vs-dark"
              onMount={handleMount}
              options={{
                minimap: { enabled: showMinimap },
                padding: { top: 16 },
                fontSize: fontSize,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontLigatures: true,
                scrollBeyondLastLine: false,
              }}
            />
          </div>

          {/* I/O panel + AI panel */}
          <aside className="w-full lg:w-80 xl:w-96 bg-neutral-950 border-t lg:border-t-0 lg:border-l border-neutral-800 flex flex-col shrink-0">

            {/* ── Stdin + Output (always visible) ── */}
            <div className={`flex flex-col min-h-0 transition-all duration-200 ${showAiPanel ? "h-1/2" : "flex-1"}`}>

              {/* Input */}
              <div className="h-2/5 min-h-0 border-b border-neutral-800 flex flex-col">
                <div className="h-10 px-4 border-b border-neutral-800 flex items-center gap-2 shrink-0">
                  <Terminal className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Stdin</span>
                </div>
                <textarea
                  value={stdin}
                  onChange={e => setStdin(e.target.value)}
                  spellCheck="false"
                  placeholder="Program input goes here…"
                  className="flex-1 min-h-0 w-full resize-none bg-neutral-950 p-4 font-mono text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Output */}
              <div className="flex-1 min-h-0 flex flex-col">
                <div className="h-10 px-4 border-b border-neutral-800 flex items-center gap-2 shrink-0">
                  <Terminal className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Output</span>

                  <div className="flex-1" />

                  {/* Execution meta */}
                  {executionMeta && (
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle}`}>
                        {executionMeta.status}
                      </span>
                      {executionMeta.time && (
                        <span className="text-xs text-neutral-500">{executionMeta.time}s</span>
                      )}
                      {executionMeta.memory && (
                        <span className="text-xs text-neutral-500">{executionMeta.memory}KB</span>
                      )}
                    </div>
                  )}

                  {/* Clear button */}
                  {output && (
                    <button
                      onClick={() => { setOutput(""); setExecutionMeta(null); }}
                      className="p-1 rounded text-neutral-600 hover:text-neutral-400 transition"
                      title="Clear output"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <pre className="flex-1 min-h-0 overflow-auto whitespace-pre-wrap break-words bg-neutral-950 p-4 font-mono text-xs text-neutral-100 leading-relaxed">
                  {isRunning
                    ? <span className="text-amber-400 animate-pulse">● Running…</span>
                    : output || <span className="text-neutral-600">Run code to see output here.</span>
                  }
                </pre>
              </div>
            </div>

            {/* ── AI Panel (slides in when toggled) ── */}
            {showAiPanel && (
              <div className="flex-1 min-h-0 border-t border-violet-500/20">
                <AiPanel
                  editorRef={editorRef}
                  language={selectedLanguage.monaco}
                  stderr={output}   // reuse output state — contains stderr from Judge0
                  aiState={aiHook}
                  onTrigger={aiHook.triggerAi}
                  onClear={aiHook.clearAi}
                />
              </div>
            )}
          </aside>
        </div>

        {/* ── Status Bar ── */}
        <div className="status-bar">
          <span className="text-amber-400">{selectedLanguage.label}</span>
          <span>UTF-8</span>
          <div className="status-divider" />
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400" : "bg-red-400"} animate-pulse`} />
            {users.length} {users.length === 1 ? "collaborator" : "collaborators"}
            <span className="text-neutral-700 ml-0.5">· {connected ? "connected" : "connecting"}</span>
          </span>
          {executionMeta && (
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${statusStyle}`}>
              {executionMeta.status}
            </span>
          )}
          {executionMeta?.time   && <span>{executionMeta.time}s</span>}
          {executionMeta?.memory && <span>{executionMeta.memory} KB</span>}
        </div>
      </section>

      {/* Shortcuts panel */}
      {showShortcuts && <ShortcutsPanel onClose={() => setShowShortcuts(false)} />}

    </main>
  )
}
