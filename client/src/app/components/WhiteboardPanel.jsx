import { useCallback, useEffect, useRef, useState } from "react"
import { Tldraw, useEditor } from "tldraw"
import "tldraw/tldraw.css"
import { MousePointer2, Pencil, Square, Circle, Type } from "lucide-react"

function MinimalToolbar() {
  const editor = useEditor()
  const [activeTool, setActiveTool] = useState("select")

  useEffect(() => {
    if (!editor) return
    const id = editor.getCurrentToolId()
    if (id) setActiveTool(id)
  }, [editor])

  const handleClick = useCallback(
    (toolId) => {
      editor.setCurrentTool(toolId)
      setActiveTool(toolId)
    },
    [editor]
  )

  const tools = [
    { id: "select", icon: MousePointer2, label: "Select" },
    { id: "draw", icon: Pencil, label: "Draw" },
    { id: "rectangle", icon: Square, label: "Rectangle" },
    { id: "ellipse", icon: Circle, label: "Ellipse" },
    { id: "text", icon: Type, label: "Text" },
  ]

  return (
    <div className="minimal-tldraw-toolbar">
      {tools.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          className={`minimal-tool-btn ${activeTool === id ? "active" : ""}`}
          onClick={() => handleClick(id)}
          title={label}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  )
}

export default function WhiteboardPanel({ ydoc }) {
  const editorRef = useRef(null)
  const yMapRef = useRef(null)
  const applyingRemote = useRef(false)
  const syncTimerRef = useRef(null)
  const lastHashRef = useRef("")

  function simpleHash(obj) {
    let h = 0
    const s = JSON.stringify(obj)
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) - h) + s.charCodeAt(i)
      h = h & h
    }
    return String(h)
  }

  useEffect(() => {
    const yMap = ydoc.getMap("tldraw")
    yMapRef.current = yMap

    const yObserver = (_events, transaction) => {
      if (transaction.origin === "wb") return
      if (applyingRemote.current) return

      const editor = editorRef.current
      if (!editor) return

      const raw = yMap.get("raw")
      if (!raw) return

      applyingRemote.current = true
      editor.store.mergeRemoteChanges(() => {
        try {
          editor.store.put(raw)
        } catch (e) {
          console.warn("Failed to apply remote shapes", e)
        }
      })
      applyingRemote.current = false
    }

    yMap.observe(yObserver)

    return () => {
      yMap.unobserve(yObserver)
    }
  }, [ydoc])

  const scheduleSync = useCallback(() => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
    syncTimerRef.current = setTimeout(() => {
      const editor = editorRef.current
      const yMap = yMapRef.current
      if (!editor || !yMap || applyingRemote.current) return

      const records = editor.store.serialize("document")
      const hash = simpleHash(records)
      if (hash === lastHashRef.current) return

      lastHashRef.current = hash
      const raw = Object.values(records)
      if (raw.length === 0) return

      ydoc.transact(() => {
        yMap.set("raw", raw)
      }, "wb")
    }, 400)
  }, [ydoc])

  const handleMount = useCallback(
    (editor) => {
      editorRef.current = editor
      editor.user.updateUserPreferences({ colorScheme: "dark" })

      const yMap = yMapRef.current
      if (!yMap) return

      const raw = yMap.get("raw")
      if (raw && raw.length > 0) {
        try {
          editor.store.put(raw)
          lastHashRef.current = simpleHash(editor.store.serialize("document"))
        } catch (e) {
          console.warn("Failed to load whiteboard data", e)
        }
      }

      const unlisten = editor.store.listen(scheduleSync, {
        scope: "document",
        source: "user",
      })

      return () => {
        if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
        if (typeof unlisten === "function") unlisten()
      }
    },
    [scheduleSync]
  )

  return (
    <div className="whiteboard-container">
      <Tldraw
        onMount={handleMount}
        autoFocus={false}
        components={{
          ContextMenu: null,
          ActionsMenu: null,
          HelpMenu: null,
          ZoomMenu: null,
          MainMenu: null,
          Minimap: null,
          StylePanel: null,
          PageMenu: null,
          NavigationPanel: null,
          RichTextToolbar: null,
          ImageToolbar: null,
          VideoToolbar: null,
          KeyboardShortcutsDialog: null,
          QuickActions: null,
          HelperButtons: null,
          DebugPanel: null,
          DebugMenu: null,
          MenuPanel: null,
          SharePanel: null,
          CursorChatBubble: null,
          Dialogs: null,
          Toasts: null,
          TopPanel: null,
          PeopleMenu: null,
          PeopleMenuAvatar: null,
          PeopleMenuItem: null,
          PeopleMenuFacePile: null,
          UserPresenceEditor: null,
          A11y: null,
          FollowingIndicator: null,
          Toolbar: MinimalToolbar,
        }}
      />
    </div>
  )
}
