import { useNavigate } from "react-router-dom"
import { Code2, ArrowLeft } from "lucide-react"

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <main className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-4 relative z-10">
      <div className="text-center max-w-sm">
        <div className="inline-flex p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 mb-6">
          <Code2 className="text-amber-400 w-10 h-10" />
        </div>
        <h1 className="text-6xl font-black tracking-tighter mb-2">404</h1>
        <p className="text-neutral-400 mb-8">
          This page doesn&apos;t exist. Maybe it never did.
        </p>
        <button
          onClick={() => navigate("/")}
          className="btn-primary px-6 py-3 rounded-xl text-sm inline-flex items-center gap-2 bounce"
        >
          <ArrowLeft className="w-4 h-4" /> Go back home
        </button>
      </div>
    </main>
  )
}
