import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { v4 as uuidV4 } from "uuid"
import {
  Code2, Plus, Users, ExternalLink, Pencil, Check, X,
  Trash2, Clock, ArrowRight, Search, Edit3, Share2,
} from "lucide-react"
import { UserButton, useUser } from "@clerk/clerk-react"
import { useToast } from "./components/Toast"

/* ── Helpers ───────────────────────────────────────────────────── */
const LANG_META = {
  javascript: { label: "JavaScript", dot: "bg-yellow-400",  border: "#eab308", bg: "bg-yellow-500/10 text-yellow-400" },
  python:     { label: "Python",     dot: "bg-blue-400",    border: "#60a5fa", bg: "bg-blue-500/10 text-blue-400"   },
  cpp:        { label: "C++",        dot: "bg-sky-400",     border: "#38bdf8", bg: "bg-sky-500/10 text-sky-400"     },
  java:       { label: "Java",       dot: "bg-orange-400",  border: "#fb923c", bg: "bg-orange-500/10 text-orange-400"},
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

/* ── WorkspaceCard ─────────────────────────────────────────────── */
function WorkspaceCard({ ws, onOpen, onDelete, onRename }) {
  const [editing, setEditing] = useState(false)
  const [nameVal, setNameVal] = useState(ws.name || "Untitled Workspace")
  const inputRef = useRef(null)
  const lang = LANG_META[ws.language] || LANG_META.javascript

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  const commit = () => {
    if (nameVal.trim() && nameVal !== ws.name) onRename(ws.roomId, nameVal.trim())
    setEditing(false)
  }
  const cancel = () => { setNameVal(ws.name || "Untitled Workspace"); setEditing(false) }

  return (
    <div
      className="group relative bg-neutral-900 border border-neutral-800 rounded-xl p-4
                 hover:border-neutral-700 hover:bg-neutral-800/50 transition-all duration-200
                 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30 cursor-pointer"
      style={{ borderLeft: `3px solid ${lang.border}40` }}
      onClick={() => !editing && onOpen(ws.roomId)}
    >
      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium mb-3 ${lang.bg}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${lang.dot}`} />
        {lang.label}
      </div>

      <div className="flex items-start justify-between gap-2 mb-2">
        {editing ? (
          <div className="flex items-center gap-1 flex-1" onClick={e => e.stopPropagation()}>
            <input
              ref={inputRef}
              value={nameVal}
              onChange={e => setNameVal(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") cancel() }}
              className="flex-1 bg-neutral-700 text-white text-sm font-semibold px-2 py-1
                         rounded border border-amber-500/60 focus:outline-none"
            />
            <button onClick={commit} className="text-emerald-400 hover:text-emerald-300 transition p-1"><Check className="w-4 h-4" /></button>
            <button onClick={cancel} className="text-neutral-400 hover:text-neutral-300 transition p-1"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <h3 className="text-white font-semibold text-sm leading-snug flex-1 truncate">
            {ws.name || "Untitled Workspace"}
          </h3>
        )}

        {!editing && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
               onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-md text-neutral-500 hover:text-white hover:bg-neutral-700 transition"
              title="Rename"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(ws.roomId)}
              className="p-1.5 rounded-md text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <p className="text-[10px] text-neutral-600 font-mono truncate mb-3">{ws.roomId}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-neutral-600">
          <Clock className="w-3 h-3" />
          <span>{timeAgo(ws.updatedAt)}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-amber-500 opacity-0 group-hover:opacity-100
                        transition-opacity font-medium">
          <ExternalLink className="w-3 h-3" />
          Open
        </div>
      </div>
    </div>
  )
}

/* ── Language Options ──────────────────────────────────────────── */
const LANG_OPTIONS = [
  { id: "javascript", label: "JavaScript", icon: "JS", color: "border-yellow-500/40 hover:border-yellow-500 text-yellow-400" },
  { id: "python",     label: "Python",     icon: "Py", color: "border-blue-500/40 hover:border-blue-500 text-blue-400"   },
  { id: "cpp",        label: "C++",        icon: "C+", color: "border-sky-500/40 hover:border-sky-500 text-sky-400"     },
  { id: "java",       label: "Java",       icon: "Jv", color: "border-orange-500/40 hover:border-orange-500 text-orange-400"},
]

/* ── Main Dashboard ────────────────────────────────────────────── */
export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useUser()
  const toast = useToast()

  const [workspaces, setWorkspaces]     = useState([])
  const [loading, setLoading]           = useState(true)
  const [creating, setCreating]         = useState(false)
  const [workspaceName, setWorkspaceName] = useState("")
  const [selectedLang, setSelectedLang] = useState("javascript")
  const [joinId, setJoinId]             = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [search, setSearch]             = useState("")

  useEffect(() => { document.title = "Dashboard — CodeWeave" }, [])

  useEffect(() => {
    if (!user) return
    setTimeout(() => setLoading(true), 0)
    fetch(`http://localhost:3000/api/workspaces/${user.id}`)
      .then(r => r.json())
      .then(data => { if (data.success) setWorkspaces(data.workspaces) })
      .finally(() => setLoading(false))
  }, [user])

  const createRoom = async (e) => {
    e.preventDefault()
    setCreating(true)
    const id = uuidV4()
    try {
      const res = await fetch("http://localhost:3000/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: id, ownerId: user.id, name: workspaceName.trim() || "Untitled Workspace", language: selectedLang }),
      })
      const data = await res.json()
      if (data.success) {
        setWorkspaces(prev => [data.workspace, ...prev])
        toast("Workspace created", "success")
      }
    } catch (err) { console.error("Create workspace failed", err) }
    setCreating(false)
    setWorkspaceName("")
    navigate(`/room/${id}`)
  }

  const joinRoom = (e) => {
    e.preventDefault()
    if (joinId.trim()) navigate(`/room/${joinId.trim()}`)
  }

  const handleDelete = async (roomId) => {
    setWorkspaces(prev => prev.filter(w => w.roomId !== roomId))
    setDeleteConfirm(null)
    try {
      await fetch(`http://localhost:3000/api/workspaces/${roomId}`, { method: "DELETE" })
      toast("Workspace deleted", "info")
    } catch (err) { console.error("Delete failed", err) }
  }

  const handleRename = async (roomId, newName) => {
    setWorkspaces(prev => prev.map(w => w.roomId === roomId ? { ...w, name: newName } : w))
    try {
      await fetch(`http://localhost:3000/api/workspaces/${roomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      })
    } catch (err) { console.error("Rename failed", err) }
  }

  const filtered = workspaces.filter(w =>
    !search || w.name?.toLowerCase().includes(search.toLowerCase())
  )

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return "Good morning"
    if (h < 17) return "Good afternoon"
    return "Good evening"
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-white">

      {/* ── Topbar ──────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 h-14 flex items-center px-6 gap-4
                      bg-[#09090b]/85 backdrop-blur-md border-b border-neutral-800/40">
        <button onClick={() => navigate("/")} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="p-1.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <Code2 className="text-amber-400 w-4 h-4" />
          </div>
          <span className="text-sm font-bold tracking-tight">CodeWeave</span>
        </button>

        <div className="hidden sm:flex items-center gap-1 ml-2">
          <span className="text-neutral-700">/</span>
          <span className="text-sm text-neutral-300 font-medium px-2">Dashboard</span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-500 hidden sm:block">
            {greeting()}, <span className="text-white font-medium">{user?.firstName || user?.username}</span>
          </span>
          <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
        </div>
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">

        {/* ── Main grid ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left — Create + Join */}
          <div className="lg:col-span-2 space-y-4">

            {/* Create card */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <Plus className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold">New Workspace</h2>
              </div>
              <p className="text-neutral-600 text-xs mb-4">Start a fresh collaborative session</p>

              <form onSubmit={createRoom} className="space-y-3">
                <div className="grid grid-cols-4 gap-1.5">
                  {LANG_OPTIONS.map(l => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setSelectedLang(l.id)}
                      className={`flex flex-col items-center py-2.5 rounded-lg border text-xs font-bold
                                  transition-all ${l.color}
                                  ${selectedLang === l.id
                                    ? "bg-white/5 border-opacity-100"
                                    : "bg-neutral-800 border-neutral-700 text-neutral-500"
                                  }`}
                    >
                      <span className="text-sm font-bold">{l.icon}</span>
                      <span className="text-[9px] mt-0.5 font-normal text-neutral-500">{l.label}</span>
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Workspace name (optional)"
                  className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg
                             text-sm text-white placeholder:text-neutral-600 focus:outline-none
                             focus:border-amber-500 transition-colors"
                  value={workspaceName}
                  onChange={e => setWorkspaceName(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary w-full py-2.5 rounded-lg text-sm flex items-center justify-center gap-2"
                >
                  {creating
                    ? <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Creating…</>
                    : <><Plus className="w-4 h-4" /> Create Workspace</>
                  }
                </button>
              </form>
            </div>

            {/* Join — compact */}
            <form onSubmit={joinRoom} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-neutral-400" />
                <h2 className="text-sm font-bold">Join a Room</h2>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Room ID"
                  className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg
                             text-sm text-white font-mono placeholder:text-neutral-600 focus:outline-none
                             focus:border-amber-500 transition-colors"
                  value={joinId}
                  onChange={e => setJoinId(e.target.value)}
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700
                             text-white font-semibold text-sm rounded-lg transition-colors
                             flex items-center gap-1.5 shrink-0"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Right — Workspace list */}
          <div className="lg:col-span-3">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 h-full min-h-[480px] flex flex-col">
              {/* Header with search */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Code2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <h2 className="text-sm font-bold">Workspaces</h2>
                  <span className="text-xs text-neutral-600 font-mono bg-neutral-800 px-2 py-1 rounded-md shrink-0">
                    {workspaces.length}
                  </span>
                </div>
                <div className="relative w-40 sm:w-48">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Filter…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg
                               text-xs text-white placeholder:text-neutral-600 focus:outline-none
                               focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex-1 flex flex-col gap-3">
                  {[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-neutral-800/50 animate-pulse" />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                  {search ? (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-neutral-800 border border-neutral-800 flex items-center justify-center mb-4">
                        <Search className="w-7 h-7 text-neutral-700" />
                      </div>
                      <p className="text-white font-semibold mb-1">No matches</p>
                      <p className="text-neutral-600 text-sm">Try a different search term.</p>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-neutral-800 border border-neutral-800 flex items-center justify-center mb-4">
                        <Code2 className="w-7 h-7 text-neutral-700" />
                      </div>
                      <p className="text-white font-semibold mb-1">No workspaces yet</p>
                      <p className="text-neutral-600 text-sm max-w-xs mb-6">
                        Workspaces are persistent coding sessions that save automatically. Create one to get started.
                      </p>
                      <div className="flex flex-col gap-2 items-center">
                        <button
                          onClick={() => {
                            const nameInput = document.querySelector('input[placeholder="Workspace name (optional)"]')
                            nameInput?.focus()
                          }}
                          className="flex items-center gap-2 px-5 py-2.5 bg-amber-500/10 border border-amber-500/20
                                     text-amber-400 text-sm font-semibold rounded-lg hover:bg-amber-500/15 transition bounce"
                        >
                          <Plus className="w-4 h-4" /> Create your first workspace
                        </button>
                        <div className="flex items-center gap-2 mt-3 text-[10px] text-neutral-700">
                          <span className="flex items-center gap-1"><Edit3 className="w-3 h-3" /> Pick a language</span>
                          <span className="text-neutral-800">·</span>
                          <span className="flex items-center gap-1"><Share2 className="w-3 h-3" /> Share the link</span>
                          <span className="text-neutral-800">·</span>
                          <span className="flex items-center gap-1"><Code2 className="w-3 h-3" /> Code together</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scroll">
                  {filtered.map(ws => {
                    if (deleteConfirm === ws.roomId) {
                      return (
                        <div key={ws._id} className="bg-red-950/30 border border-red-800/40 rounded-xl p-4 flex items-center justify-between gap-3">
                          <p className="text-sm text-red-200">Delete <span className="font-semibold">"{ws.name}"</span>?</p>
                          <div className="flex gap-2">
                            <button onClick={() => handleDelete(ws.roomId)} className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-400 transition">Delete</button>
                            <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 bg-neutral-700 text-white text-xs font-semibold rounded-lg hover:bg-neutral-600 transition">Cancel</button>
                          </div>
                        </div>
                      )
                    }
                    return (
                      <WorkspaceCard
                        key={ws._id}
                        ws={ws}
                        onOpen={id => navigate(`/room/${id}`)}
                        onDelete={id => setDeleteConfirm(id)}
                        onRename={handleRename}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
