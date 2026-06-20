import { useEffect } from "react"

const SHORTCUTS = [
  { keys: "Ctrl+Enter",       desc: "Run code" },
  { keys: "Ctrl+B",           desc: "Toggle sidebar" },
  { keys: "Ctrl+I",           desc: "Toggle AI panel" },
  { keys: "Ctrl+Shift+F",     desc: "Format code" },
  { keys: "Escape",           desc: "Close panels / modals" },
  { keys: "Ctrl+M",           desc: "Toggle minimap" },
  { keys: "Ctrl+L",           desc: "Clear output" },
  { keys: "?",                 desc: "Show this panel" },
]

export default function ShortcutsPanel({ onClose }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <div className="shortcuts-overlay" onClick={onClose}>
      <div className="shortcuts-modal" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-300 text-xs px-2 py-1 rounded hover:bg-neutral-800 transition"
          >
            Esc
          </button>
        </div>
        <div className="space-y-1">
          {SHORTCUTS.map(s => (
            <div key={s.keys} className="shortcut-row">
              <kbd>{s.keys}</kbd>
              <span>{s.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
