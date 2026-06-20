import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  Code2, ExternalLink, ArrowRight, Users, Play, Sparkles,
  Share2, Edit3, Zap, CheckCircle, Copy, Globe
} from "lucide-react"
import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/clerk-react"

/* ── Animated Code Block ───────────────────────────────────── */
function AnimatedCode() {
  const lines = [
    ["// Priya is typing...", "text-neutral-500"],
    ["function merge(doc) {", "text-sky-300"],
    ["  const conflicts = ", "text-white"],
    ["    doc.getConflicts()", "text-white"],
    ["  if (conflicts.length === 0)", "text-white"],
    ["    return doc", "text-white"],
    ["  return doc.resolveAll()", "text-white"],
    ["}", "text-sky-300"],
  ]

  const [lineIdx, setLineIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [phase, setPhase] = useState("typing")

  useEffect(() => {
    if (phase === "typing") {
      const line = lines[lineIdx]
      if (!line || charIdx >= line[0].length) {
        if (lineIdx >= lines.length - 1) {
          const t = setTimeout(() => setPhase("pause"), 500)
          return () => clearTimeout(t)
        }
        const t = setTimeout(() => { setLineIdx(p => p + 1); setCharIdx(0) }, 200)
        return () => clearTimeout(t)
      }
      const t = setTimeout(() => setCharIdx(p => p + 1), 30 + Math.random() * 40)
      return () => clearTimeout(t)
    }
    if (phase === "pause") {
      const t = setTimeout(() => { setLineIdx(0); setCharIdx(0); setPhase("typing") }, 3000)
      return () => clearTimeout(t)
    }
  }, [lineIdx, charIdx, phase])

  return (
    <div className="code-block p-4 sm:p-6 shadow-2xl shadow-amber-500/5">
      <div className="flex items-center gap-1.5 mb-4 pb-3 border-b border-neutral-800/60">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        <span className="ml-2 text-[10px] text-neutral-600 font-mono">workspace.js</span>
        <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          2 collaborators
        </span>
      </div>
      <div className="text-sm leading-7">
        {lines.slice(0, lineIdx).map((line, i) => (
          <div key={i} className="flex">
            <span className="line-numbers">{String(i + 1).padStart(2, " ")}</span>
            <span className={line[1]}>{line[0]}</span>
          </div>
        ))}
        {lines[lineIdx] && (
          <div className="flex">
            <span className="line-numbers">{String(lineIdx + 1).padStart(2, " ")}</span>
            <span className={lines[lineIdx][1]}>{lines[lineIdx][0].slice(0, charIdx)}</span>
            <span className="cursor-blink" />
          </div>
        )}
        {/* Simulated collaborator cursor */}
        {lineIdx >= 3 && (
          <div className="relative h-0 mt-1">
            <div className="absolute left-[88px] -top-0.5 flex flex-col items-start">
              <span className="text-[8px] leading-none bg-emerald-500 text-black px-1 rounded font-bold">PK</span>
              <div className="w-0.5 h-4 bg-emerald-500" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Scroll Reveal Hook ─────────────────────────────────────── */
function useReveal(ref) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const o = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("visible"); o.unobserve(el) } },
      { threshold: 0.1 }
    )
    o.observe(el)
    return () => o.disconnect()
  }, [ref])
}

/* ── Features ──────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: <Users className="w-5 h-5" />,
    title: "Real-time collaboration",
    desc: "Multiple developers edit the same document simultaneously. Every keystroke is synced via Yjs CRDTs — no conflicts, no data loss, no race conditions.",
    highlights: ["Live cursors with user colors", "Deterministic conflict resolution", "Auto-save to MongoDB"],
  },
  {
    icon: <Play className="w-5 h-5" />,
    title: "Multi-language execution",
    desc: "Write and run code in JavaScript, Python, C++, and Java directly in the browser. Each execution runs in an isolated sandbox via Judge0 CE.",
    highlights: ["Stdout, stderr, and compile errors", "Execution time & memory tracking", "Stdin support for interactive programs"],
  },
  {
    icon: <Sparkles className="w-5 h-5" />,
    title: "AI-assisted development",
    desc: "Explain, refactor, generate, or debug selected code with Google Gemini. Context-aware responses that never write to your document without your consent.",
    highlights: ["Explain complex code in plain language", "Refactor for readability & performance", "Generate code from natural language"],
  },
]

/* ── How It Works Steps ────────────────────────────────────── */
const STEPS = [
  {
    icon: <Edit3 className="w-5 h-5" />,
    title: "Create a workspace",
    desc: "Choose a language (JS, Python, C++, Java), name your session, and get a unique room link instantly.",
  },
  {
    icon: <Share2 className="w-5 h-5" />,
    title: "Share the link",
    desc: "Send the room link to anyone. They join instantly — no account required for collaborators.",
  },
  {
    icon: <Code2 className="w-5 h-5" />,
    title: "Code together",
    desc: "Edit with live cursors, run code inline, and get AI assistance. Everything syncs in real time.",
  },
]

/* ── Component ─────────────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate()
  const { user } = useUser()
  const [scrolled, setScrolled] = useState(false)

  const featuresRef = useRef(null)
  const stepsRef = useRef(null)
  const stackRef = useRef(null)
  const ctaRef = useRef(null)
  useReveal(featuresRef)
  useReveal(stepsRef)
  useReveal(stackRef)
  useReveal(ctaRef)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 48)
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [])

  const handleGetStarted = () => {
    navigate("/dashboard")
  }

  return (
    <main className="min-h-screen w-full bg-[#09090b] text-white overflow-x-hidden relative z-10">

      {/* ═══════════════════════════════════════════════════════ */}
      {/* Nav                                                      */}
      {/* ═══════════════════════════════════════════════════════ */}
      <nav className={`sticky top-0 z-50 h-14 flex items-center px-6 gap-4 transition-all duration-300
        bg-[#09090b]/85 backdrop-blur-md border-b border-neutral-800/40
        ${scrolled ? "shadow-[0_4px_24px_rgba(0,0,0,0.4)]" : ""}`}>
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="p-1.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <Code2 className="text-amber-400 w-5 h-5" />
          </div>
          <span className="text-base font-bold tracking-tight">CodeWeave</span>
        </div>

        <div className="hidden md:flex items-center gap-1 ml-6">
          <a href="#features" className="px-3 py-1.5 text-sm text-neutral-400 hover:text-white rounded-md hover:bg-white/5 transition-all">Features</a>
          <a href="#how-it-works" className="px-3 py-1.5 text-sm text-neutral-400 hover:text-white rounded-md hover:bg-white/5 transition-all">How it works</a>
          <a href="#stack" className="px-3 py-1.5 text-sm text-neutral-400 hover:text-white rounded-md hover:bg-white/5 transition-all">Tech</a>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-3">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-500 hover:text-white transition-colors"
            title="GitHub"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
          <button
            onClick={handleGetStarted}
            className="btn-primary px-4 py-1.5 rounded-lg text-sm flex items-center gap-1.5"
          >
            Get Started <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <SignedIn>
            <button
              onClick={() => navigate("/dashboard")}
              className="text-sm text-neutral-400 hover:text-white transition-colors px-2"
            >
              Dashboard
            </button>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-sm text-neutral-400 hover:text-white transition-colors px-2">
                Sign in
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* Hero                                                     */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="relative px-4 pt-20 pb-28 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/8 border border-amber-500/20 rounded-full text-amber-400 text-xs font-semibold mb-6 tracking-wide">
              <Zap className="w-3 h-3" />
              Open source · Real-time CRDT sync
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.02] mb-6">
              Code together,
              <br />
              <span className="gradient-text">in real time.</span>
            </h1>
            <p className="text-base sm:text-lg text-neutral-400 max-w-lg leading-relaxed mb-8">
              A collaborative code editor with CRDT-powered syncing, multi-language execution in the browser, and AI-assisted development via Gemini.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleGetStarted}
                className="btn-primary px-6 py-3 rounded-xl text-base flex items-center gap-2 bounce"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </button>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="px-6 py-3 rounded-xl border border-neutral-700 text-neutral-300
                             font-semibold text-base hover:border-neutral-500 hover:text-white
                             transition-all bounce">
                    Create free account
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <a href="#features"
                  className="px-6 py-3 rounded-xl border border-neutral-700 text-neutral-300
                             font-semibold text-base hover:border-neutral-500 hover:text-white
                             transition-all bounce">
                  See features
                </a>
              </SignedIn>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="float-anim">
              <AnimatedCode />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* Features                                                 */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section id="features" ref={featuresRef} className="reveal max-w-5xl mx-auto px-4 pb-28">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Everything you need to collaborate on code
          </h2>
          <p className="text-neutral-500 max-w-xl mx-auto">
            Real-time editing, inline code execution, and AI assistance — built on open-source infrastructure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title}
              className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-6
                         hover:border-neutral-700 hover:bg-neutral-900 transition-all duration-200">
              <div className="text-amber-400 mb-4">{f.icon}</div>
              <h3 className="text-white font-semibold text-lg mb-3">{f.title}</h3>
              <p className="text-neutral-400 text-sm leading-relaxed mb-4">{f.desc}</p>
              <ul className="space-y-1.5">
                {f.highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2 text-xs text-neutral-500">
                    <CheckCircle className="w-3 h-3 text-amber-500/60 shrink-0" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* How It Works                                             */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section id="how-it-works" ref={stepsRef} className="reveal max-w-4xl mx-auto px-4 pb-28">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            How it works
          </h2>
          <p className="text-neutral-500 max-w-lg mx-auto">
            From zero to collaborative coding in under a minute.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-8 left-[calc(16.66%+1rem)] right-[calc(16.66%+1rem)] h-px bg-gradient-to-r from-amber-500/30 via-amber-500/10 to-transparent" />

          {STEPS.map((step, i) => (
            <div key={step.title} className="flex flex-col items-center text-center relative">
              <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 relative z-10">
                {step.icon}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono text-amber-500/60">0{i + 1}</span>
              </div>
              <h3 className="text-white font-semibold text-base mb-2">{step.title}</h3>
              <p className="text-neutral-500 text-sm leading-relaxed max-w-xs">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* Editor Preview (full-width visual)                        */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-4 pb-28">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            What it looks like
          </h2>
          <p className="text-neutral-500 max-w-lg mx-auto">
            A familiar editor experience, enhanced for collaboration.
          </p>
        </div>

        <div className="rounded-xl overflow-hidden border border-neutral-800 shadow-2xl">
          {/* Toolbar mockup */}
          <div className="h-10 bg-neutral-900 border-b border-neutral-800 flex items-center px-4 gap-3">
            <div className="flex items-center gap-1 text-xs text-neutral-600">
              <Code2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono">workspace.js</span>
            </div>
            <span className="text-neutral-700">/</span>
            <div className="flex items-center gap-1">
              <span className="flex -space-x-1">
                {["#10b981","#3b82f6","#f59e0b","#8b5cf6"].map((c, i) => (
                  <div key={i}
                    className="w-5 h-5 rounded-full border-2 border-neutral-900 text-[7px] font-bold flex items-center justify-center text-white"
                    style={{ backgroundColor: c, zIndex: 4 - i }}>
                    {["PK","AJ","RL","SM"][i]}
                  </div>
                ))}
              </span>
              <span className="text-[10px] text-neutral-600 ml-1">4 online</span>
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500 text-black font-bold">Run</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">AI</span>
            </div>
          </div>
          {/* Editor area mockup */}
          <div className="bg-[#1e1e2e] flex h-56">
            <div className="flex-1 p-4 font-mono text-xs leading-6 text-neutral-400">
              <div className="flex gap-4"><span className="text-neutral-700 w-4 shrink-0 text-right">1</span><span className="text-neutral-500">// @collaborators: Priya, Alex, Rahul</span></div>
              <div className="flex gap-4"><span className="text-neutral-700 w-4 shrink-0 text-right">2</span><span className="text-violet-400">import</span><span className="text-white"> React </span><span className="text-violet-400">from</span><span className="text-emerald-400"> 'react'</span></div>
              <div className="flex gap-4"><span className="text-neutral-700 w-4 shrink-0 text-right">3</span> </div>
              <div className="flex gap-4"><span className="text-neutral-700 w-4 shrink-0 text-right">4</span><span className="text-violet-400">function</span><span className="text-sky-300"> App</span><span className="text-white">() {"{"}</span></div>
              <div className="flex gap-4"><span className="text-neutral-700 w-4 shrink-0 text-right">5</span><span className="text-white">  </span><span className="text-violet-400">const</span><span className="text-white"> [count, setCount] = </span><span className="text-amber-400">useState</span><span className="text-white">(</span><span className="text-amber-400">0</span><span className="text-white">)</span></div>
              <div className="flex gap-4"><span className="text-neutral-700 w-4 shrink-0 text-right">6</span><span className="text-white">  </span><span className="text-violet-400">return</span><span className="text-white"> (</span></div>
              {/* Simulate Priya's cursor */}
              <div className="relative">
                <div className="flex gap-4"><span className="text-neutral-700 w-4 shrink-0 text-right">7</span><span className="text-white">    {"<"}div{">"}Hello, world{"</"}div{">"}</span></div>
                <div className="absolute left-[72px] top-0 flex flex-col items-start">
                  <span className="text-[7px] leading-none bg-emerald-500 text-black px-0.5 rounded font-bold">PK</span>
                  <div className="w-0.5 h-4 bg-emerald-500" />
                </div>
              </div>
              <div className="flex gap-4"><span className="text-neutral-700 w-4 shrink-0 text-right">8</span><span className="text-white">  )</span></div>
              <div className="flex gap-4"><span className="text-neutral-700 w-4 shrink-0 text-right">9</span><span className="text-white">{"}"}</span></div>
            </div>
            {/* Side panel mockup */}
            <div className="w-48 bg-neutral-900 border-l border-neutral-800 p-3">
              <div className="text-[10px] text-neutral-600 font-semibold uppercase tracking-wider mb-3">Collaborators</div>
              {[
                { name: "You", color: "#f59e0b" },
                { name: "Priya", color: "#10b981" },
                { name: "Alex", color: "#3b82f6" },
              ].map((p) => (
                <div key={p.name} className="flex items-center gap-2 py-1.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0" style={{ backgroundColor: p.color }}>
                    {p.name[0]}
                  </div>
                  <span className="text-xs text-neutral-400">{p.name}</span>
                  {p.name === "You" && <span className="text-[9px] text-neutral-700">you</span>}
                </div>
              ))}
            </div>
          </div>
          {/* Status bar mockup */}
          <div className="h-6 bg-[#0d0d0f] border-t border-neutral-800/60 flex items-center px-4 gap-4 text-[10px] text-neutral-600 font-mono">
            <span className="text-amber-400">JavaScript</span>
            <span>Ln 7, Col 16</span>
            <span className="flex-1" />
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              3 collaborators
            </span>
            <span className="text-emerald-500">Auto-saved</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* Tech Stack                                               */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section id="stack" ref={stackRef} className="reveal max-w-4xl mx-auto px-4 pb-28 text-center">
        <p className="text-xs text-neutral-600 uppercase tracking-widest font-semibold mb-6">
          Built with
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {[
            "React 19", "Yjs CRDTs", "Monaco Editor", "Socket.io",
            "Node.js", "MongoDB", "Judge0 CE", "Gemini API", "Clerk Auth",
          ].map((t) => (
            <span key={t}
              className="px-3.5 py-1.5 rounded-full text-xs font-mono text-neutral-400
                         bg-neutral-900 border border-neutral-800 hover:border-amber-500/30
                         hover:text-amber-300 transition-all bounce cursor-default">
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* CTA                                                       */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section ref={ctaRef} className="reveal max-w-3xl mx-auto px-4 pb-24 text-center">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-violet-500/5
                          rounded-3xl blur-2xl pointer-events-none" />
          <div className="relative border border-neutral-800 bg-neutral-900/50 backdrop-blur-sm
                          rounded-2xl p-10 sm:p-14">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight">
              Ready to start coding together?
            </h2>
            <p className="text-neutral-400 mb-8 max-w-md mx-auto">
              Create a free workspace and share the link with anyone. No credit card required — just open your browser.
            </p>
            <button
              onClick={handleGetStarted}
              className="btn-primary px-8 py-3.5 rounded-xl text-base inline-flex items-center gap-2 mx-auto bounce"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* Footer                                                   */}
      {/* ═══════════════════════════════════════════════════════ */}
      <footer className="border-t border-neutral-800/60 py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-amber-500/10 rounded-md border border-amber-500/20">
              <Code2 className="text-amber-400 w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-semibold text-neutral-300">CodeWeave</span>
            <span className="text-xs text-neutral-700 ml-1">v0.1.0</span>
          </div>
          <p className="text-xs text-neutral-600">
            Built with React, Yjs, Monaco &amp; Node.js &middot; MIT
          </p>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-600 hover:text-neutral-400 transition-colors text-xs"
          >
            GitHub
          </a>
        </div>
      </footer>

    </main>
  )
}
