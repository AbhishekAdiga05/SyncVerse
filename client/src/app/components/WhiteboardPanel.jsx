import { useCallback, useEffect, useRef } from "react"
import { Tldraw } from "tldraw"
import "tldraw/tldraw.css"

/**
 * WhiteboardPanel — collaborative whiteboard backed by Yjs.
 *
 * Toolbar reduced to essentials: select, draw, text, shapes (rect/ellipse),
 * connectors (arrow/line), and eraser. Extraneous shapes and panels removed.
 */
export default function WhiteboardPanel({ ydoc }) {
  const editorRef      = useRef(null)
  const yMapRef        = useRef(null)
  const syncTimerRef   = useRef(null)
  const applyingRef    = useRef(false)   // prevents echo loop
  const cleanupRef     = useRef(null)

  /* ─── Yjs observer: remote → editor ─────────────────── */
  useEffect(() => {
    const yMap = ydoc.getMap("tldraw_v2")
    yMapRef.current = yMap

    const observer = (_events, transaction) => {
      if (transaction.origin === "local_wb") return   // skip own writes
      if (applyingRef.current) return
      const editor = editorRef.current
      if (!editor) return

      const snapshot = yMap.get("snapshot")
      if (!snapshot) return

      applyingRef.current = true
      try {
        editor.store.mergeRemoteChanges(() => {
          editor.loadSnapshot(snapshot)
        })
      } catch (e) {
        console.warn("[Whiteboard] failed to apply remote snapshot", e)
      } finally {
        applyingRef.current = false
      }
    }

    yMap.observe(observer)
    return () => yMap.unobserve(observer)
  }, [ydoc])

  /* ─── Local change → Yjs (debounced 300 ms) ─────────── */
  const scheduleSync = useCallback(() => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
    syncTimerRef.current = setTimeout(() => {
      if (applyingRef.current) return
      const editor = editorRef.current
      const yMap   = yMapRef.current
      if (!editor || !yMap) return

      try {
        const snapshot = editor.getSnapshot()
        ydoc.transact(() => {
          yMap.set("snapshot", snapshot)
        }, "local_wb")
      } catch (e) {
        console.warn("[Whiteboard] failed to sync snapshot", e)
      }
    }, 300)
  }, [ydoc])

  /* ─── Editor mount ───────────────────────────────────── */
  const handleMount = useCallback((editor) => {
    editorRef.current = editor

    // Dark mode
    editor.user.updateUserPreferences({ colorScheme: "dark" })

    // Remove unnecessary tools — keep only essentials for diagramming
    const removeTools = ['diamond','triangle','hexagon','cloud','star','oval','sticky-note','frame','highlight','laser']
    removeTools.forEach(id => { try { editor.deleteTool(id) } catch {} })

    // Load any existing snapshot from Yjs
    const yMap    = yMapRef.current
    const snapshot = yMap?.get("snapshot")
    if (snapshot) {
      try { editor.loadSnapshot(snapshot) } catch (e) {
        console.warn("[Whiteboard] failed to load initial snapshot", e)
      }
    }

    // Listen for local changes
    const unlisten = editor.store.listen(scheduleSync, {
      scope: "document",
      source: "user",
    })

    cleanupRef.current = () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
      if (typeof unlisten === "function") unlisten()
    }
  }, [scheduleSync])

  useEffect(() => {
    return () => cleanupRef.current?.()
  }, [])

  return (
    <div style={{ width: "100%", height: "100%", background: "#1c1c1e" }}>
      <Tldraw
        onMount={handleMount}
        autoFocus={false}
        components={{
          HelpMenu: null,
          NavigationPanel: null,
        }}
      />
    </div>
  )
}
