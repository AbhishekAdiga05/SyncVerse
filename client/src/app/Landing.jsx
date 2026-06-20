import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Code2, Users, Play, Sparkles, Zap, ArrowRight,
  ChevronRight, Shield, GitBranch, Globe
} from "lucide-react"
import {
  SignedIn, SignedOut, SignInButton, useUser
} from "@clerk/clerk-react"

/* ── Data ──────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: <Users className="w-6 h-6" />,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    glow: "hover:shadow-[0_0_30px_rgba(245,158,11,0.08)]",
    title: "Real-time Collaboration",
    desc: "Conflict-free CRDT syncing via Yjs. Every keystroke from every user arrives and merges deterministically — no race conditions, no data loss.",
    badge: "Powered by Yjs",
  },
  {
    icon: <Play className="w-6 h-6" />,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    glow: "hover:shadow-[0_0_30px_rgba(16,185,129,0.08)]",
    title: "Multi-language Execution",
    desc: "Run JavaScript, Python, C++, and Java in an isolated sandbox. See stdout, stderr, compile errors, execution time, and memory — all inline.",
    badge: "Powered by Judge0",
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
    glow: "hover:shadow-[0_0_30px_rgba(139,92,246,0.08)]",
    title: "AI Intent Mode",
    desc: "Explain, refactor, generate, or debug selected code with Gemini. Context-aware prompts. Markdown responses. Never written to the shared doc without you.",
    badge: "Powered by Gemini",
  },
]

const STEPS = [
  {
    num: "01",
    title: "Create a Workspace",
    desc: "Name your session, choose a language, and click Create. A unique room link is generated instantly.",
  },
  {
    num: "02",
    title: "Invite Collaborators",
    desc: "Share the room link. Anyone with the link joins instantly — no account required to collaborate.",
  },
  {
    num: "03",
    title: "Code, Run, Ship",
    desc: "Edit together with live cursors, execute code in the browser, and get AI assistance on the fly.",
  },
]

const TECH = [
  { label: "Yjs CRDTs",      detail: "conflict-free sync" },
  { label: "Monaco Editor",  detail: "VS Code engine" },
  { label: "Judge0 CE",      detail: "sandboxed execution" },
  { label: "Clerk",          detail: "authentication" },
  { label: "MongoDB",        detail: "persistence" },
  { label: "Gemini API",     detail: "AI assistant" },
]

/* ── Component ─────────────────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate()
  const { user } = useUser()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 48)
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [])

  return (
    <main className="min-h-screen w-full bg-[#09090b] text-white overflow-x-hidden">

      {/* ── Ambient background orbs ──────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="orb-amber -top-32 -left-32" />
        <div className="orb-violet top-1/3 right-0 translate-x-1/3" />
        <div className="orb-amber bottom-0 left-1/2 -translate-x-1/2 opacity-40" />
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SECTION 1 — Sticky Navbar                                  */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <nav className={`sticky top-0 z-50 h-14 flex items-center px-6 gap-6 transition-all duration-300
        bg-[#09090b]/85 backdrop-blur-md border-b border-neutral-800/40
        ${scrolled ? "shadow-[0_4px_24px_rgba(0,0,0,0.4)]" : ""}`}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="p-1.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <Code2 className="text-amber-400 w-5 h-5" />
          </div>
          <span className="text-base font-bold tracking-tight">CodeWeave</span>
        </div>

        {/* Center nav links */}
        <div className="hidden md:flex items-center gap-1 flex-1">
          <a href="#features" className="px-3 py-1.5 text-sm text-neutral-400 hover:text-white rounded-md hover:bg-white/5 transition-all">Features</a>
          <a href="#how-it-works" className="px-3 py-1.5 text-sm text-neutral-400 hover:text-white rounded-md hover:bg-white/5 transition-all">How it works</a>
          <a href="#tech" className="px-3 py-1.5 text-sm text-neutral-400 hover:text-white rounded-md hover:bg-white/5 transition-all">Stack</a>
        </div>

        {/* Right: auth */}
        <div className="flex items-center gap-3 ml-auto">
          <SignedOut>
            <SignInButton mode="modal" afterSignInUrl="/dashboard">
              <button className="text-sm text-neutral-400 hover:text-white transition-colors px-3 py-1.5 rounded-md hover:bg-white/5">
                Sign in
              </button>
            </SignInButton>
            <SignInButton mode="modal" afterSignInUrl="/dashboard">
              <button className="btn-primary px-4 py-1.5 rounded-lg text-sm">
                Get started free
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <span className="text-sm text-neutral-400 hidden sm:block">
              Hey, <span className="text-white font-medium">{user?.firstName || user?.username}</span>
            </span>
            <button
              onClick={() => navigate("/dashboard")}
              className="btn-primary px-4 py-1.5 rounded-lg text-sm flex items-center gap-1.5"
            >
              Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </SignedIn>
        </div>
      </nav>

      <div className="relative z-10">

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SECTION 2 — Hero                                           */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="text-center px-4 pt-24 pb-20 max-w-5xl mx-auto">

          {/* Badge */}
          <div className="fade-up fade-up-1 inline-flex items-center gap-2 px-3.5 py-1.5
                          bg-amber-500/8 border border-amber-500/20 rounded-full
                          text-amber-400 text-xs font-semibold mb-8 tracking-wide">
            <Zap className="w-3.5 h-3.5" />
            Now with Gemini AI · Try free
          </div>

          {/* H1 */}
          <h1 className="fade-up fade-up-2 text-6xl sm:text-7xl font-black tracking-tighter leading-[1.02] mb-6">
            Code together.
            <br />
            <span className="gradient-text">Ship faster.</span>
          </h1>

          {/* Subheadline */}
          <p className="fade-up fade-up-3 text-lg text-neutral-400 max-w-xl mx-auto leading-relaxed mb-10">
            The collaborative code editor with conflict-free CRDT syncing,
            multi-language sandboxed execution, and AI-powered assistance.
            Built for developers who move fast.
          </p>

          {/* CTAs */}
          <div className="fade-up fade-up-4 flex items-center justify-center gap-3 flex-wrap mb-6">
            <SignedOut>
              <SignInButton mode="modal" afterSignInUrl="/dashboard">
                <button className="btn-primary px-7 py-3 rounded-xl text-base flex items-center gap-2">
                  Start coding free <ArrowRight className="w-4 h-4" />
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <button
                onClick={() => navigate("/dashboard")}
                className="btn-primary px-7 py-3 rounded-xl text-base flex items-center gap-2"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            </SignedIn>
            <a
              href="#features"
              className="px-7 py-3 rounded-xl border border-neutral-700 text-neutral-300
                         font-semibold text-base hover:border-neutral-500 hover:text-white
                         transition-all"
            >
              See features
            </a>
          </div>

          {/* Trust strip */}
          <p className="fade-up fade-up-5 text-xs text-neutral-600 flex items-center justify-center gap-3 flex-wrap">
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> No credit card required</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> 4 languages</span>
            <span>·</span>
            <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" /> Free forever</span>
          </p>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SECTION 3 — Product Preview (browser chrome)              */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="max-w-5xl mx-auto px-4 mb-28 relative">
          {/* Glow behind the preview */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-48
                          bg-amber-500/5 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative rounded-2xl overflow-hidden border border-neutral-800
                          shadow-[0_0_80px_rgba(0,0,0,0.7)] transition-transform
                          hover:-translate-y-1 duration-300">
            {/* Browser chrome bar */}
            <div className="h-9 bg-neutral-900 border-b border-neutral-800 flex items-center px-4 gap-3 shrink-0">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/50" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <span className="w-3 h-3 rounded-full bg-green-500/50" />
              </div>
              <div className="flex-1 max-w-sm mx-auto h-5 bg-neutral-800 rounded flex items-center px-3 gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500/60 animate-pulse" />
                <span className="text-[10px] text-neutral-500 font-mono">codeweave.app/room/abc-123</span>
              </div>
            </div>

            {/* Mock editor UI */}
            <div className="bg-[#1e1e2e] flex h-72 overflow-hidden">
              {/* Sidebar strip */}
              <div className="w-11 bg-neutral-900/80 border-r border-neutral-800 flex flex-col items-center pt-3 gap-3 shrink-0">
                <div className="icon-rail-btn active"><Code2 className="w-4 h-4" /></div>
                <div className="icon-rail-btn"><Users className="w-4 h-4" /></div>
                <div className="icon-rail-btn"><Sparkles className="w-4 h-4" /></div>
              </div>

              {/* Code area */}
              <div className="flex-1 p-4 font-mono text-xs leading-6 overflow-hidden">
                <div className="text-neutral-600 mb-1 text-[10px]">1  </div>
                {[
                  { ln: "2", code: <><span className="text-violet-400">const</span><span className="text-sky-300"> merge</span><span className="text-white"> = (</span><span className="text-orange-300">doc</span><span className="text-white">) =&gt; {"{"}</span></> },
                  { ln: "3", code: <><span className="text-white">  </span><span className="text-violet-400">if</span><span className="text-white"> (doc.</span><span className="text-sky-300">conflicts</span><span className="text-white">.</span><span className="text-emerald-400">length</span><span className="text-white"> === </span><span className="text-amber-400">0</span><span className="text-white">) return doc;</span></> },
                  { ln: "4", code: <><span className="text-white">  </span><span className="text-violet-400">return</span><span className="text-white"> doc.</span><span className="text-sky-300">resolveAll</span><span className="text-white">();</span></> },
                  { ln: "5", code: <span className="text-white">{"}"}</span> },
                  { ln: "6", code: null },
                  { ln: "7", code: <><span className="text-neutral-600">// CRDT guarantees convergence</span></> },
                  { ln: "8", code: <><span className="text-violet-400">export default</span><span className="text-white"> merge;</span></> },
                ].map(({ ln, code }) => (
                  <div key={ln} className="flex gap-4">
                    <span className="text-neutral-700 w-4 shrink-0 text-right">{ln}</span>
                    <span>{code}</span>
                  </div>
                ))}

                {/* Cursor decoration (simulated collaborator) */}
                <div className="relative mt-1">
                  <div className="absolute left-10 -top-1 flex flex-col items-start">
                    <span className="text-[9px] bg-emerald-500 text-black px-1 rounded font-bold">Priya</span>
                    <div className="w-0.5 h-4 bg-emerald-500" />
                  </div>
                </div>
              </div>

              {/* AI panel strip */}
              <div className="w-56 bg-neutral-900 border-l border-neutral-800 flex flex-col shrink-0">
                <div className="h-8 px-3 border-b border-neutral-800 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-violet-400" />
                  <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">AI Intent Mode</span>
                </div>
                <div className="flex gap-1 p-2 border-b border-neutral-800">
                  {["Explain","Refactor"].map(a => (
                    <span key={a} className="text-[9px] px-2 py-1 rounded bg-neutral-800 border border-neutral-700 text-neutral-400">{a}</span>
                  ))}
                </div>
                <div className="p-3">
                  <div className="bg-neutral-800 rounded-lg p-2.5 border border-violet-500/10">
                    <div className="flex items-center gap-1 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                      <span className="text-[9px] text-violet-400 font-semibold">Gemini</span>
                    </div>
                    <p className="text-[9px] text-neutral-300 leading-4">
                      This function resolves CRDT conflicts by calling <code className="text-amber-400">resolveAll()</code> on the document. It returns early if no conflicts exist.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status bar */}
            <div className="status-bar border-t border-neutral-800">
              <span className="text-amber-400">JavaScript</span>
              <span>Ln 8, Col 22</span>
              <div className="status-divider" />
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                2 collaborators
              </span>
              <span className="text-emerald-500">✓ Accepted</span>
              <span>0.024s</span>
            </div>
          </div>

          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-12
                          bg-gradient-to-t from-[#09090b] to-transparent pointer-events-none" />
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SECTION 4 — Feature Cards                                  */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section id="features" className="max-w-5xl mx-auto px-4 mb-28">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-neutral-600 uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl font-bold tracking-tight mb-3">What makes CodeWeave different</h2>
            <p className="text-neutral-500 max-w-md mx-auto">Built on production-grade infrastructure. Not a toy — a real collaborative development environment.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title}
                className={`group relative bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6
                            hover:border-neutral-700 hover:-translate-y-1 transition-all duration-200 ${f.glow}`}>
                {/* Icon */}
                <div className={`inline-flex p-2.5 rounded-xl border mb-5 ${f.bg}`}>
                  <span className={f.color}>{f.icon}</span>
                </div>
                {/* Content */}
                <h3 className="text-base font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed mb-5">{f.desc}</p>
                {/* Badge */}
                <div className="pt-4 border-t border-neutral-800">
                  <span className="text-[10px] font-mono text-neutral-600">{f.badge}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SECTION 5 — How It Works                                   */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section id="how-it-works" className="max-w-4xl mx-auto px-4 mb-28">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-neutral-600 uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl font-bold tracking-tight mb-3">Get started in 3 steps</h2>
            <p className="text-neutral-500">From zero to collaborative in under a minute.</p>
          </div>

          <div className="flex flex-col md:flex-row items-start gap-6">
            {STEPS.map((step, i) => (
              <div key={step.num} className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
                {/* Number + connector */}
                <div className="flex items-center gap-4 mb-5 w-full">
                  <div className="w-10 h-10 rounded-full border-2 border-amber-500/40 bg-amber-500/8
                                  text-amber-400 font-bold text-sm flex items-center justify-center shrink-0">
                    {step.num}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="hidden md:flex flex-1 items-center">
                      <div className="flex-1 h-px border-t border-dashed border-neutral-800" />
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-700 -ml-1" />
                    </div>
                  )}
                </div>
                <h3 className="text-base font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SECTION 6 — Tech Credibility Strip                         */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section id="tech" className="max-w-4xl mx-auto px-4 mb-28 text-center">
          <p className="text-xs text-neutral-600 uppercase tracking-widest font-semibold mb-6">
            Built on battle-tested infrastructure
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {TECH.map((t) => (
              <div key={t.label}
                className="flex flex-col items-center px-5 py-3 rounded-xl border border-neutral-800
                           bg-neutral-900/50 opacity-60 hover:opacity-100 transition-opacity duration-200">
                <span className="text-xs font-mono font-semibold text-neutral-300">{t.label}</span>
                <span className="text-[10px] text-neutral-600 mt-0.5">{t.detail}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SECTION 7 — Bottom CTA Banner                              */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-4xl mx-auto px-4 mb-20">
          <div className="relative">
            {/* Glow layer */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/8 via-transparent to-violet-500/8
                            rounded-3xl blur-2xl pointer-events-none" />
            <div className="relative border border-neutral-800 bg-neutral-900/70 backdrop-blur-sm
                            rounded-3xl p-12 text-center">
              <h2 className="text-3xl font-bold mb-3 tracking-tight">Ready to build something great?</h2>
              <p className="text-neutral-400 mb-8 max-w-md mx-auto">
                Create a free workspace in seconds. No setup, no configuration — just open your browser and code.
              </p>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="btn-primary px-8 py-3.5 rounded-xl text-base flex items-center gap-2 mx-auto">
                    Create Free Workspace <ArrowRight className="w-4 h-4" />
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="btn-primary px-8 py-3.5 rounded-xl text-base flex items-center gap-2 mx-auto"
                >
                  Go to Dashboard <ArrowRight className="w-4 h-4" />
                </button>
              </SignedIn>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* FOOTER                                                      */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <footer className="border-t border-neutral-800/60 py-8 px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="p-1 bg-amber-500/10 rounded-md border border-amber-500/20">
              <Code2 className="text-amber-400 w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-semibold">CodeWeave</span>
          </div>
          <p className="text-xs text-neutral-600">
            Built with React, Node.js, Yjs, Judge0, Clerk, MongoDB &amp; Gemini.
          </p>
        </footer>

      </div>
    </main>
  )
}
