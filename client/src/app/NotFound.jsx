import { useNavigate } from "react-router-dom"
import { Terminal, ArrowLeft } from "lucide-react"

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] flex flex-col">
      {/* Nav */}
      <nav className="border-b border-[#21262d] px-4 sm:px-6 h-14 flex items-center sticky top-0 z-50 bg-[#0d1117]/90 backdrop-blur-sm">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-7 h-7 rounded-md bg-[#58a6ff] flex items-center justify-center">
            <Terminal size={14} className="text-[#0d1117]" />
          </div>
          <span className="text-sm font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Pair<span className="text-[#58a6ff]">verse</span>
          </span>
        </button>
      </nav>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="text-center max-w-sm">
          <div className="inline-flex p-4 bg-[#58a6ff]/10 rounded-2xl border border-[#58a6ff]/20 mb-6">
            <Terminal className="text-[#58a6ff] w-10 h-10" />
          </div>
          <h1 className="text-6xl tracking-tighter mb-2" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 800 }}>404</h1>
          <p className="text-[#8b949e] mb-8">
            This page doesn&apos;t exist. Maybe it never did.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 rounded-xl text-sm inline-flex items-center gap-2 bg-[#58a6ff] hover:bg-[#4793e5] text-[#0d1117] font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" /> Go back home
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#21262d] px-6 py-4 text-center shrink-0">
        <p className="text-xs text-[#6e7681]">PairForge</p>
      </footer>
    </div>
  )
}
