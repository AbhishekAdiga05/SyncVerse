import { Editor } from "@monaco-editor/react"
import { MonacoBinding } from "y-monaco"
import { useRef, useMemo, useState, useEffect } from "react"
import * as Y from "yjs"
import { SocketIOProvider } from "y-socket.io"
import { useParams, useNavigate } from "react-router-dom"
import { Users, Code2, Copy, Check, ArrowLeft, Play, Terminal, Loader2 } from "lucide-react"
import { useUser } from "@clerk/clerk-react"

// A preset list of aesthetic colors for remote cursors
const COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#10b981", 
  "#06b6d4", "#3b82f6", "#8b5cf6", "#d946ef", "#f43f5e"
]

const LANGUAGES = [
  { id: 63, label: "JavaScript", monaco: "javascript" },
  { id: 71, label: "Python", monaco: "python" },
  { id: 54, label: "C++", monaco: "cpp" },
  { id: 62, label: "Java", monaco: "java" },
]

export default function Room() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user, isLoaded } = useUser()
  
  const editorRef = useRef(null)
  const bindingRef = useRef(null)
  const providerRef = useRef(null)
  
  // Try to use Clerk's name, otherwise fallback to sessionStorage
  const [username, setUsername] = useState(() => sessionStorage.getItem("username") || "")
  const [tempUsername, setTempUsername] = useState("")
  const [users, setUsers] = useState([])
  const [copied, setCopied] = useState(false)
  const [editorReady, setEditorReady] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0])
  const [stdin, setStdin] = useState("")
  const [output, setOutput] = useState("")
  const [executionMeta, setExecutionMeta] = useState(null)
  const [isRunning, setIsRunning] = useState(false)

  // Automatically update the username if the user logs in via Clerk
  useEffect(() => {
    if (isLoaded && user) {
      const name = user.firstName || user.username || "Authenticated User"
      setUsername(name)
      sessionStorage.setItem("username", name)
    }
  }, [isLoaded, user])

  // Initialize Yjs Document exactly once
  const ydoc = useMemo(() => new Y.Doc(), [])
  const yText = useMemo(() => ydoc.getText("monaco"), [ydoc])
  
  // Generate a random color for this user exactly once
  const userColor = useMemo(() => COLORS[Math.floor(Math.random() * COLORS.length)], [])

  const handleJoin = (e) => {
    e.preventDefault()
    if(tempUsername.trim()) {
      sessionStorage.setItem("username", tempUsername)
      setUsername(tempUsername)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleMount = (editor) => {
    editorRef.current = editor
    setEditorReady(true) // Signals that Monaco is ready to be bound
  }

  const handleLanguageChange = (e) => {
    const nextLanguage = LANGUAGES.find((language) => language.id === Number(e.target.value))
    if (nextLanguage) setSelectedLanguage(nextLanguage)
  }

  const handleRunCode = async () => {
    if (!editorRef.current || isRunning) return

    const sourceCode = editorRef.current.getValue()
    setIsRunning(true)
    setOutput("Running...")
    setExecutionMeta(null)

    try {
      const response = await fetch("http://localhost:3000/api/execution/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceCode,
          languageId: selectedLanguage.id,
          stdin,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || "Code execution failed")
      }

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
      setOutput(error.message || "Code execution failed")
    } finally {
      setIsRunning(false)
    }
  }

  useEffect(() => {
    // Only connect when both the username is set AND the editor is mounted
    if (username && editorReady) {
      // Connect to Socket.io backend explicitly (port 3000)
      const provider = new SocketIOProvider("http://localhost:3000", roomId, ydoc, {
        autoConnect: true,
      })
      providerRef.current = provider

      // PHASE 2: Cursor & Presence Awareness
      // We set the local state. y-monaco uses `name` and `color` fields for remote cursors.
      provider.awareness.setLocalStateField("user", { 
        name: username, // For the cursor tooltip
        username: username, // For our sidebar list
        color: userColor // For the cursor color
      })

      // Track active collaborators for the sidebar
      const updateUsers = () => {
        const states = Array.from(provider.awareness.getStates().values())
        setUsers(states.filter(state => state.user && state.user.username).map(state => state.user))
      }
      
      provider.awareness.on("change", updateUsers)
      updateUsers() // Fetch initial list

      // PHASE 2: Bind Monaco to Yjs + Awareness
      // By passing provider.awareness as the 4th argument, we enable remote cursors!
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

      // Cleanup function on dismount
      return () => {
        if(bindingRef.current) bindingRef.current.destroy()
        provider.disconnect()
        window.removeEventListener("beforeunload", handleBeforeUnload)
      }
    }
  }, [username, editorReady, roomId, ydoc, yText, userColor])

  // Login Screen if no username
  if (!username) {
    return (
      <main className="h-screen w-full bg-gray-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-neutral-900 rounded-2xl p-8 border border-neutral-800 shadow-xl text-center">
          <Code2 className="text-amber-500 w-12 h-12 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Join Workspace</h2>
          <p className="text-neutral-400 mb-6 text-sm">Enter a username to collaborate in this room.</p>
          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Your name"
              required
              className="w-full p-3 rounded-lg bg-neutral-800 text-white border border-neutral-700 focus:outline-none focus:border-amber-500 transition-colors"
              value={tempUsername}
              onChange={(e) => setTempUsername(e.target.value)}
            />
            <button
              type="submit"
              className="w-full p-3 rounded-lg bg-amber-500 text-gray-950 font-bold hover:bg-amber-400 transition-colors"
            >
              Enter Room
            </button>
          </form>
        </div>
      </main>
    )
  }

  // Main Editor View
  return (
    <main className="h-screen w-full flex bg-gray-950 text-white font-sans overflow-hidden">
      {/* Sidebar - Collaborators */}
      <aside className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col shrink-0 transition-all">
        <div className="p-4 border-b border-neutral-800 flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-neutral-400 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Code2 className="text-amber-500 w-6 h-6" />
            <h1 className="font-bold text-lg tracking-tight">CodeWeave</h1>
          </div>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="flex items-center gap-2 text-neutral-400 mb-4 text-xs font-bold uppercase tracking-wider">
            <Users className="w-4 h-4" />
            <span>Collaborators ({users.length})</span>
          </div>
          <ul className="space-y-2">
            {users.map((u, index) => (
              <li key={index} className="flex items-center gap-3 p-2 rounded-md hover:bg-neutral-800 transition-colors">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: u.color || '#ccc' }}
                />
                <span className="text-sm font-medium">{u.username}</span>
                {u.username === username && <span className="text-xs text-neutral-500 ml-auto">(You)</span>}
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 border-t border-neutral-800">
          <button
            onClick={copyLink}
            className="w-full py-2 px-4 bg-neutral-800 hover:bg-neutral-700 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-colors border border-neutral-700"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy Room Link"}
          </button>
        </div>
      </aside>

      {/* Editor Section */}
      <section className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-neutral-900 border-b border-neutral-800 flex items-center px-4 justify-between shrink-0">
           <div className="text-sm text-neutral-400 flex items-center gap-2 bg-neutral-800 px-3 py-1.5 rounded-md border border-neutral-700">
              <span className="font-mono">{roomId}</span>
           </div>
           <div className="flex items-center gap-3">
              <select
                value={selectedLanguage.id}
                onChange={handleLanguageChange}
                className="h-9 rounded-md bg-neutral-800 border border-neutral-700 px-3 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                {LANGUAGES.map((language) => (
                  <option key={language.id} value={language.id}>
                    {language.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleRunCode}
                disabled={isRunning || !editorReady}
                className="h-9 px-4 rounded-md bg-amber-500 text-gray-950 font-bold text-sm hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {isRunning ? "Running" : "Run Code"}
              </button>
           </div>
        </header>

        <div className="flex-1 w-full min-h-0 flex bg-[#1e1e1e]">
          <div className="flex-1 min-w-0">
            <Editor
              height="100%"
              width="100%"
              language={selectedLanguage.monaco}
              defaultValue="// Start coding collaboratively here..."
              theme="vs-dark"
              onMount={handleMount}
              options={{
                minimap: { enabled: false },
                padding: { top: 16 },
                fontSize: 14,
              }}
            />
          </div>

          <aside className="w-80 xl:w-96 bg-neutral-950 border-l border-neutral-800 flex flex-col shrink-0">
            <div className="h-1/2 min-h-0 border-b border-neutral-800 flex flex-col">
              <div className="h-11 px-4 border-b border-neutral-800 flex items-center gap-2 text-sm font-semibold text-neutral-200">
                <Terminal className="w-4 h-4 text-amber-500" />
                Input
              </div>
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                spellCheck="false"
                placeholder="Program input goes here..."
                className="flex-1 min-h-0 w-full resize-none bg-neutral-950 p-4 font-mono text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none"
              />
            </div>

            <div className="h-1/2 min-h-0 flex flex-col">
              <div className="h-11 px-4 border-b border-neutral-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-neutral-200">
                  <Terminal className="w-4 h-4 text-amber-500" />
                  Output
                </div>
                {executionMeta && (
                  <div className="text-xs text-neutral-500 truncate">
                    {executionMeta.status}
                    {executionMeta.time ? ` | ${executionMeta.time}s` : ""}
                    {executionMeta.memory ? ` | ${executionMeta.memory} KB` : ""}
                  </div>
                )}
              </div>
              <pre className="flex-1 min-h-0 overflow-auto whitespace-pre-wrap break-words bg-neutral-950 p-4 font-mono text-sm text-neutral-100">
                {output || "Run code to see output here."}
              </pre>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
