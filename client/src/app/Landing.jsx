import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Users, Zap, MessageSquare, Save, ChevronRight, Shield, Terminal, PenTool, ArrowRight } from 'lucide-react';
import { SignedIn, SignedOut, useUser } from "@clerk/clerk-react";

function useReveal(delay = 0) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer = null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timer = setTimeout(() => setVisible(true), delay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [delay]);
  return [ref, visible];
}

const DEMO_CODE = `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// AI Review → Suggestion:
// ⚠ No memoization — O(2^n) time
// ✓ Use dynamic programming instead`;

const FEATURES = [
  {
    icon: <Users size={20} />,
    title: 'Real-Time Collaboration',
    desc: 'All users in a room share a single Yjs document. Keystrokes sync as CRDT operations — no locks, no conflicts.',
    color: '#58a6ff',
    bg: 'rgba(88,166,255,0.08)',
  },
  {
    icon: <Zap size={20} />,
    title: 'AI Code Review',
    desc: 'Select any code region and choose Explain, Refactor, Generate, or Debug. Only your highlighted code is sent.',
    color: '#a371f7',
    bg: 'rgba(163,113,247,0.08)',
  },
  {
    icon: <PenTool size={20} />,
    title: 'Collaborative Whiteboard',
    desc: 'Built-in tldraw canvas backed by Yjs. Toggle between code and drawings — both sync in real time.',
    color: '#38bdf8',
    bg: 'rgba(56,189,248,0.08)',
  },
  {
    icon: <MessageSquare size={20} />,
    title: 'Integrated Chat',
    desc: 'Side-panel chat scoped to the current room. Messages are ephemeral — no database overhead.',
    color: '#3fb950',
    bg: 'rgba(63,185,80,0.08)',
  },
  {
    icon: <Save size={20} />,
    title: 'Workspace Persistence',
    desc: 'Document state saves to MongoDB after 2 seconds of inactivity. Reopen any room and continue where you left off.',
    color: '#d29922',
    bg: 'rgba(210,153,34,0.08)',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const [heroRef, heroVisible] = useReveal(0);
  const [archRef, archVisible] = useReveal(0);
  const [stepsRef, stepsVisible] = useReveal(0);
  const [featuresRef, featuresVisible] = useReveal(0);
  const [ctaRef, ctaVisible] = useReveal(100);

  const handleGetStarted = () => {
    if (isSignedIn) {
      navigate('/dashboard');
    } else {
      navigate('/sign-up');
    }
  };

  const STEPS = [
    {
      step: '01',
      title: 'Create or Join a Room',
      desc: 'Each room is an isolated workspace with its own document state and chat session. Share the room ID to collaborate.',
      color: '#58a6ff',
      bg: 'rgba(88,166,255,0.07)',
      border: 'rgba(88,166,255,0.2)',
      cta: 'Go to Dashboard →',
      action: handleGetStarted,
    },
    {
      step: '02',
      title: 'Edit in Real Time',
      desc: 'Multiple users edit the same Monaco editor simultaneously. Yjs CRDTs resolve conflicting edits deterministically.',
      color: '#3fb950',
      bg: 'rgba(63,185,80,0.07)',
      border: 'rgba(63,185,80,0.2)',
      cta: null,
      action: null,
    },
    {
      step: '03',
      title: 'Chat, Draw, and Review',
      desc: 'Use the side panel for real-time chat, switch to the whiteboard for diagrams, or run AI review for code explanations and refactoring.',
      color: '#a371f7',
      bg: 'rgba(163,113,247,0.07)',
      border: 'rgba(163,113,247,0.2)',
      cta: null,
      action: null,
    },
    {
      step: '04',
      title: 'Run and Persist',
      desc: 'Execute code server-side via Judge0 in JavaScript, Python, C++, Java, Go, Rust, or TypeScript. Work auto-saves to MongoDB.',
      color: '#f78166',
      bg: 'rgba(247,129,102,0.07)',
      border: 'rgba(247,129,102,0.2)',
      cta: null,
      action: null,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] flex flex-col">

      {/* Nav */}
      <nav className="border-b border-[#21262d] px-6 py-3 flex items-center justify-between sticky top-0 z-50 bg-[#0d1117]/90 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#58a6ff] flex items-center justify-center">
            <Terminal size={14} className="text-[#0d1117]" />
          </div>
          <span style={{ fontFamily: 'monospace' }} className="text-[#e6edf3]">Pair<span className="text-[#58a6ff]">verse</span></span>
        </div>
        <div className="flex items-center gap-2">
          <SignedOut>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/sign-in')}
                className="px-4 py-2 text-sm text-[#8b949e] hover:text-[#e6edf3] font-medium transition-colors"
              >
                Sign in
              </button>
              <button
                onClick={() => navigate('/sign-up')}
                className="px-4 py-2 text-sm bg-[#e6edf3] hover:bg-white text-[#0d1117] rounded-md font-semibold transition-colors shadow-sm"
              >
                Get started
              </button>
            </div>
          </SignedOut>
          <SignedIn>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-sm bg-[#238636] hover:bg-[#2ea043] text-white rounded-md font-semibold transition-colors shadow-sm"
            >
              Open Dashboard →
            </button>
          </SignedIn>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 relative overflow-hidden" ref={heroRef}>
        {/* Background glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(88,166,255,0.08) 0%, transparent 70%)' }}
        />

        <div className={`inline-flex items-center gap-2 px-3 py-1 bg-[#161b22] border border-[#30363d] rounded-full text-xs text-[#8b949e] mb-6 reveal ${heroVisible ? 'visible' : ''}`} style={{ transitionDelay: '0ms' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse" />
          React · Express · MongoDB · Socket.IO · Yjs · tldraw
        </div>

        <h1 className={`text-5xl md:text-6xl max-w-4xl mx-auto mb-4 reveal ${heroVisible ? 'visible' : ''}`} style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', transitionDelay: '100ms' }}>
          Collaborative code editor
          <br />
          <span style={{ color: '#58a6ff' }}>with real-time sync.</span>
        </h1>

        <p className={`text-[#8b949e] text-lg max-w-xl mx-auto mb-8 reveal ${heroVisible ? 'visible' : ''}`} style={{ lineHeight: 1.7, transitionDelay: '200ms' }}>
          A full-stack collaborative editing platform with CRDT-based conflict resolution, AI-assisted code review, collaborative whiteboarding, multi-language execution, and persistent workspaces.
        </p>

        <div className={`flex items-center gap-3 flex-wrap justify-center mt-4 reveal ${heroVisible ? 'visible' : ''}`} style={{ transitionDelay: '300ms' }}>
          <SignedOut>
            <button
              onClick={() => navigate('/sign-up')}
              className="flex items-center gap-2 px-6 py-3 bg-[#58a6ff] hover:bg-[#4793e5] text-[#0d1117] rounded-md transition-all text-sm shadow-lg hover:scale-105 active:scale-95"
              style={{ fontWeight: 600 }}
            >
              Get started <ChevronRight size={16} />
            </button>
            <button
              onClick={() => navigate('/sign-in')}
              className="flex items-center gap-2 px-6 py-3 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#e6edf3] rounded-md transition-all text-sm hover:scale-105 active:scale-95 hover:border-[#58a6ff]/30"
              style={{ fontWeight: 500 }}
            >
              Sign in
            </button>
          </SignedOut>
          <SignedIn>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-8 py-3 bg-[#58a6ff] hover:bg-[#4793e5] text-[#0d1117] rounded-md transition-all text-sm shadow-lg hover:scale-105 active:scale-95"
              style={{ fontWeight: 600 }}
            >
              Open Dashboard <ArrowRight size={16} />
            </button>
          </SignedIn>
        </div>

        {/* Hero code preview */}
        <div className={`mt-16 w-full max-w-3xl mx-auto rounded-xl overflow-hidden border border-[#30363d] text-left float-anim reveal ${heroVisible ? 'visible' : ''}`} style={{ transitionDelay: '400ms', boxShadow: '0 0 30px rgba(88,166,255,0.06), 0 8px 32px rgba(0,0,0,0.3)' }}>
          {/* Window chrome */}
          <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-[#30363d]">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#f85149]" />
              <span className="w-3 h-3 rounded-full bg-[#d29922]" />
              <span className="w-3 h-3 rounded-full bg-[#3fb950]" />
            </div>
            <div className="flex items-center gap-2 text-xs text-[#8b949e]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950]" />
              3 users connected
            </div>
            <div className="text-xs text-[#8b949e]" style={{ fontFamily: 'monospace' }}>fibonacci.js</div>
          </div>
          <div className="flex">
            {/* Line numbers */}
            <div className="py-4 px-4 bg-[#0d1117] text-[#3d444d] text-xs select-none border-r border-[#21262d]" style={{ fontFamily: 'monospace', lineHeight: '1.7' }}>
              {DEMO_CODE.split('\n').map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            {/* Code */}
            <div className="py-4 px-5 bg-[#0d1117] text-sm flex-1 overflow-x-auto" style={{ fontFamily: 'monospace', lineHeight: '1.7' }}>
              <pre className="text-[#e6edf3]">{DEMO_CODE}</pre>
            </div>
          </div>
          {/* Bottom bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-t border-[#30363d]">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-1">
                {['AJ', 'MK', 'SR'].map((initials, i) => (
                  <div key={i} className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] border border-[#0d1117]"
                    style={{ background: ['#58a6ff', '#3fb950', '#a371f7'][i], color: '#0d1117', fontWeight: 600 }}>
                    {initials[0]}
                  </div>
                ))}
              </div>
              <span className="text-xs text-[#8b949e]">Alex, Maria, and Sanjay are editing</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#a371f7]/15 text-[#a371f7]">AI Review ready</span>
          </div>
        </div>
      </section>

      {/* Architecture highlights */}
      <section className="border-y border-[#21262d] py-8 px-6" ref={archRef}>
        <div className={`max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-center text-xs text-[#8b949e]`}>
          <div className="col-span-full text-center mb-1 reveal ${archVisible ? 'visible' : ''}">
            <span className="text-[10px] text-[#3d444d] uppercase tracking-widest" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 600 }}>Powered by</span>
          </div>
          {[
            ['Yjs CRDT', 'Conflict-free sync'],
            ['Monaco Editor', 'VS Code-grade editing'],
            ['7 Languages', 'Judge0 execution'],
            ['tldraw', 'Collaborative canvas'],
            ['OpenRouter', 'AI code review'],
            ['MongoDB', 'Persistent workspaces'],
          ].map(([label, sub], i) => (
            <div key={label} className={`px-2 py-2 reveal ${archVisible ? 'visible' : ''}`} style={{ transitionDelay: `${i * 80}ms` }}>
              <span className="text-[#e6edf3] font-semibold block mb-0.5 text-sm">{label}</span>
              {sub}
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 px-6 border-b border-[#21262d]" ref={stepsRef}>
        <div className="max-w-4xl mx-auto">
          <div className={`text-center mb-12 reveal ${stepsVisible ? 'visible' : ''}`} style={{ transitionDelay: '0ms' }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#161b22] border border-[#30363d] rounded-full text-xs text-[#8b949e] mb-4">
              <ArrowRight size={11} /> Workflow
            </div>
            <h2 className="text-3xl mb-3" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 700 }}>How to use Pairverse</h2>
            <p className="text-[#8b949e] text-sm max-w-lg mx-auto" style={{ lineHeight: 1.7 }}>
              From room creation to code execution — the full collaboration flow.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((s, i) => (
              <div
                key={s.step}
                className={`relative p-5 rounded-xl border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg reveal ${stepsVisible ? 'visible' : ''}`}
                style={{ background: s.bg, borderColor: s.border, transitionDelay: `${i * 100 + 100}ms`, boxShadow: `0 4px 12px rgba(0,0,0,0.1)` }}
              >
                {/* Step number */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#0d1117]/60 border border-[#30363d]"
                    style={{ fontFamily: 'monospace', color: s.color }}>
                    {s.step}
                  </span>
                  {i < STEPS.length - 1 && (
                    <ArrowRight size={12} className="text-[#3d444d]" />
                  )}
                </div>
                <h3 className="text-[#e6edf3] mb-2" style={{ fontSize: '14px', fontWeight: 600 }}>{s.title}</h3>
                <p className="text-[#8b949e] text-xs" style={{ lineHeight: 1.65 }}>{s.desc}</p>
                {s.cta && s.action && (
                  <button
                    onClick={s.action}
                    className="mt-3 flex items-center gap-1 text-xs transition-colors hover:opacity-80"
                    style={{ color: s.color }}
                  >
                    {s.cta}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Auth banner */}
          <div className={`mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-[#161b22] border border-[#30363d] transition-all duration-300 hover:border-[#3fb950]/30 reveal ${stepsVisible ? 'visible' : ''}`} style={{ transitionDelay: '500ms' }}>
            <div className="shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#238636]/20 border border-[#238636]/30 flex items-center justify-center">
                <Shield size={14} className="text-[#3fb950]" />
              </div>
              <span className="text-sm text-[#e6edf3]" style={{ fontWeight: 500 }}>Authentication</span>
            </div>
            <div className="flex-1 text-xs text-[#8b949e]" style={{ lineHeight: 1.6 }}>
              Uses Clerk for session management. Sign in with Google, GitHub, or email to create and access workspaces.
            </div>
            <button
              onClick={handleGetStarted}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-md bg-[#238636] hover:bg-[#2ea043] text-white text-xs transition-all hover:scale-105 active:scale-95"
              style={{ fontWeight: 500 }}
            >
              Get started
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6" ref={featuresRef}>
        <div className="max-w-4xl mx-auto">
          <div className={`text-center mb-12 reveal ${featuresVisible ? 'visible' : ''}`} style={{ transitionDelay: '0ms' }}>
            <h2 className="text-3xl mb-3" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 700 }}>Capabilities</h2>
            <p className="text-[#8b949e]">What the editor provides out of the box.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div key={f.title} className={`p-5 rounded-xl border border-[#30363d] bg-[#161b22] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#58a6ff]/20 hover:shadow-lg reveal ${featuresVisible ? 'visible' : ''}`}
                style={{ transitionDelay: `${i * 100 + 100}ms` }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110" style={{ background: f.bg, color: f.color }}>
                  {f.icon}
                </div>
                <h3 className="text-[#e6edf3] mb-1.5" style={{ fontSize: '15px', fontWeight: 500 }}>{f.title}</h3>
                <p className="text-[#8b949e] text-sm" style={{ lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 pb-20" ref={ctaRef}>
        <div className={`max-w-2xl mx-auto p-8 rounded-xl border border-[#30363d] bg-[#161b22] text-center reveal ${ctaVisible ? 'visible' : ''}`} style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
          <Terminal size={28} className="text-[#58a6ff] mx-auto mb-4" />
          <h2 className="text-2xl mb-2" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 700 }}>Start collaborating</h2>
          <p className="text-[#8b949e] mb-6 text-sm">Create a room, share the ID, and begin editing in real-time.</p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <SignedOut>
              <button
                onClick={() => navigate('/sign-up')}
                className="px-6 py-2.5 bg-[#58a6ff] hover:bg-[#4793e5] text-[#0d1117] rounded-md transition-all text-sm shadow-sm hover:scale-105 active:scale-95"
                style={{ fontWeight: 600 }}
              >
                Get started
              </button>
              <button
                onClick={() => navigate('/sign-in')}
                className="px-6 py-2.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#e6edf3] rounded-md transition-all text-sm hover:scale-105 active:scale-95 hover:border-[#58a6ff]/30"
                style={{ fontWeight: 500 }}
              >
                Sign in
              </button>
            </SignedOut>
            <SignedIn>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2.5 bg-[#58a6ff] hover:bg-[#4793e5] text-[#0d1117] rounded-md transition-all text-sm shadow-sm hover:scale-105 active:scale-95"
                style={{ fontWeight: 600 }}
              >
                Open Dashboard →
              </button>
            </SignedIn>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#21262d] px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-[#58a6ff] flex items-center justify-center">
            <Terminal size={10} className="text-[#0d1117]" />
          </div>
          <span className="text-xs text-[#8b949e]" style={{ fontFamily: 'monospace' }}>Pairverse</span>
        </div>
        <span className="text-xs text-[#3d444d]">React · Express · MongoDB · Socket.IO · Yjs · tldraw</span>
      </footer>
    </div>
  );
}
