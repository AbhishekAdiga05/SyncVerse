import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Users, Zap, MessageSquare, Save, ChevronRight, Shield, Terminal, PenTool, ArrowRight, Play, Loader2 } from 'lucide-react';
import { SignedIn, SignedOut, useUser } from "@clerk/clerk-react";
import { API_URL } from './config.js';

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

/* ── Syntax-highlighted demo code ──────────────────────────── */
function DemoCode() {
  return (
    <pre style={{ margin: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', lineHeight: '1.7' }}>
      <span style={{ color: '#ff7b72' }}>function</span>{' '}
      <span style={{ color: '#d2a8ff' }}>fibonacci</span>
      <span style={{ color: '#e6edf3' }}>(</span>
      <span style={{ color: '#ffa657' }}>n</span>
      <span style={{ color: '#e6edf3' }}>)</span>
      {' '}
      <span style={{ color: '#e6edf3' }}>{'{'}</span>{'\n'}
      {'  '}
      <span style={{ color: '#ff7b72' }}>if</span>
      {' '}
      <span style={{ color: '#e6edf3' }}>(n {'<='} </span>
      <span style={{ color: '#79c0ff' }}>1</span>
      <span style={{ color: '#e6edf3' }}>) </span>
      <span style={{ color: '#ff7b72' }}>return</span>
      {' '}
      <span style={{ color: '#ffa657' }}>n</span>
      <span style={{ color: '#e6edf3' }}>;</span>{'\n'}
      {'  '}
      <span style={{ color: '#ff7b72' }}>return</span>
      {' '}
      <span style={{ color: '#d2a8ff' }}>fibonacci</span>
      <span style={{ color: '#e6edf3' }}>(n - </span>
      <span style={{ color: '#79c0ff' }}>1</span>
      <span style={{ color: '#e6edf3' }}>) + </span>
      <span style={{ color: '#d2a8ff' }}>fibonacci</span>
      <span style={{ color: '#e6edf3' }}>(n - </span>
      <span style={{ color: '#79c0ff' }}>2</span>
      <span style={{ color: '#e6edf3' }}>);</span>{'\n'}
      <span style={{ color: '#e6edf3' }}>{'}'}</span>{'\n'}
      {'\n'}
      <span style={{ color: '#8b949e' }}>{'// AI Review → Suggestion:'}</span>{'\n'}
      <span style={{ color: '#8b949e' }}>{'// ⚠ No memoization — O(2^n) time'}</span>{'\n'}
      <span style={{ color: '#8b949e' }}>{'// ✓ Use dynamic programming instead'}</span>
    </pre>
  );
}

const DEMO_LINES = 8;

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
  {
    icon: <Play size={20} />,
    title: 'Code Execution',
    desc: 'Run code server-side via Judge0 CE across 7 languages — JavaScript, Python, C++, Java, Go, Rust, and TypeScript with sandboxed execution.',
    color: '#f78166',
    bg: 'rgba(247,129,102,0.08)',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const [heroRef, heroVisible] = useReveal(0);
  const [archRef, archVisible] = useReveal(0);
  const [stepsRef, stepsVisible] = useReveal(0);
  const [featuresRef, featuresVisible] = useReveal(0);
  const [playRef, playVisible] = useReveal(0);

  const PLAY_LANGS = [
    { id: 63, label: 'JavaScript', def: '// Write JavaScript here\nconsole.log("Hello from SyncVerse!");' },
    { id: 71, label: 'Python', def: '# Write Python here\nprint("Hello from SyncVerse!")' },
    { id: 54, label: 'C++', def: '#include <iostream>\nint main() {\n  std::cout << "Hello from SyncVerse!" << std::endl;\n  return 0;\n}' },
  ];
  const [playCode, setPlayCode] = useState(PLAY_LANGS[0].def);
  const [playLang, setPlayLang] = useState(PLAY_LANGS[0]);
  const [playOutput, setPlayOutput] = useState('');
  const [playRunning, setPlayRunning] = useState(false);

  const handlePlayRun = async () => {
    setPlayRunning(true);
    setPlayOutput('');
    try {
      const res = await fetch(`${API_URL}/api/execution/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceCode: playCode, languageId: playLang.id, stdin: '' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Execution failed');
      const r = data.result;
      setPlayOutput(r.stdout || r.stderr || r.compile_output || 'No output');
    } catch (err) {
      setPlayOutput(`Error: ${err.message}`);
    }
    setPlayRunning(false);
  };

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
      <nav className="border-b border-[#21262d] px-4 sm:px-6 h-14 flex items-center justify-between sticky top-0 z-50 bg-[#0d1117]/90 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#58a6ff] flex items-center justify-center">
            <Terminal size={14} className="text-[#0d1117]" />
          </div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace" }} className="text-[#e6edf3] text-sm font-semibold">Sync<span className="text-[#58a6ff]">Verse</span></span>
        </div>
        <div className="hidden sm:flex items-center gap-1 mr-auto ml-8">
          <a href="#workflow" className="px-3 py-1.5 text-xs text-[#8b949e] hover:text-[#e6edf3] transition-colors rounded-md hover:bg-[#21262d]">How it works</a>
          <a href="#features" className="px-3 py-1.5 text-xs text-[#8b949e] hover:text-[#e6edf3] transition-colors rounded-md hover:bg-[#21262d]">Features</a>
          <a href="#try-it" className="px-3 py-1.5 text-xs text-[#8b949e] hover:text-[#e6edf3] transition-colors rounded-md hover:bg-[#21262d]">Try it</a>
        </div>
        <div className="flex items-center gap-2">
          <SignedOut>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/sign-in')}
                aria-label="Sign in"
                className="px-3 sm:px-4 py-2 text-sm text-[#8b949e] hover:text-[#e6edf3] font-medium transition-colors"
              >
                Sign in
              </button>
              <button
                onClick={() => navigate('/sign-up')}
                aria-label="Get started"
                className="px-3 sm:px-4 py-2 text-sm bg-[#e6edf3] hover:bg-white text-[#0d1117] rounded-md font-semibold transition-colors shadow-sm"
              >
                Get started
              </button>
            </div>
          </SignedOut>
          <SignedIn>
            <button
              onClick={() => navigate('/dashboard')}
              aria-label="Open Dashboard"
              className="px-3 sm:px-4 py-2 text-sm bg-[#238636] hover:bg-[#2ea043] text-white rounded-md font-semibold transition-colors shadow-sm"
            >
              Open Dashboard →
            </button>
          </SignedIn>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 py-16 sm:py-24 relative overflow-hidden" ref={heroRef}>
        {/* Background glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] sm:w-[600px] h-[200px] sm:h-[300px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(88,166,255,0.08) 0%, transparent 70%)' }}
        />

        <div className={`inline-flex items-center gap-2 px-3 py-1 bg-[#161b22] border border-[#30363d] rounded-full text-xs text-[#8b949e] mb-6 reveal ${heroVisible ? 'visible' : ''}`} style={{ transitionDelay: '0ms' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse" />
          <span className="hidden sm:inline">React · Express · MongoDB · Socket.IO · Yjs · tldraw</span>
          <span className="sm:hidden">Full-stack collaborative editor</span>
        </div>

        <h1 className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl mx-auto mb-4 reveal ${heroVisible ? 'visible' : ''}`} style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.04em', transitionDelay: '100ms' }}>
          Collaborative code editor
          <br />
          <span className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent">with real-time sync.</span>
        </h1>

          <p className={`text-[#8b949e] text-base sm:text-lg max-w-2xl mx-auto mb-8 reveal ${heroVisible ? 'visible' : ''}`} style={{ lineHeight: 1.6, transitionDelay: '200ms' }}>
            A full-stack collaborative editing platform with CRDT-based conflict resolution, AI-assisted code review, collaborative whiteboarding, multi-language execution, and persistent workspaces.
          </p>

        <div className={`flex items-center gap-3 flex-wrap justify-center mt-4 reveal ${heroVisible ? 'visible' : ''}`} style={{ transitionDelay: '300ms' }}>
          <SignedOut>
            <button
              onClick={() => navigate('/sign-up')}
              className="flex items-center gap-2 px-5 sm:px-6 py-3 bg-[#58a6ff] hover:bg-[#4793e5] text-[#0d1117] rounded-md transition-all text-sm shadow-lg hover:scale-105 active:scale-95"
              style={{ fontWeight: 600 }}
            >
              Get started <ChevronRight size={16} />
            </button>
            <button
              onClick={() => navigate('/sign-in')}
              className="flex items-center gap-2 px-5 sm:px-6 py-3 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#e6edf3] rounded-md transition-all text-sm hover:scale-105 active:scale-95 hover:border-[#58a6ff]/30"
              style={{ fontWeight: 500 }}
            >
              Sign in
            </button>
          </SignedOut>
            <SignedIn>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 px-6 sm:px-8 py-3 bg-[#58a6ff] hover:bg-[#4793e5] text-[#0d1117] rounded-md transition-all text-sm shadow-lg hover:scale-105 active:scale-95"
                style={{ fontWeight: 600 }}
              >
                Enter Workspace <ArrowRight size={16} />
              </button>
            </SignedIn>
        </div>

        {/* Hero code preview with syntax highlighting */}
        <div className={`mt-12 sm:mt-16 w-full max-w-3xl mx-auto rounded-xl overflow-hidden border border-[#30363d] text-left float-anim reveal ${heroVisible ? 'visible' : ''}`} style={{ transitionDelay: '400ms', boxShadow: '0 0 30px rgba(88,166,255,0.06), 0 8px 32px rgba(0,0,0,0.3)' }}>
          {/* Window chrome */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-[#161b22] border-b border-[#30363d]">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#f85149]" />
              <span className="w-3 h-3 rounded-full bg-[#d29922]" />
              <span className="w-3 h-3 rounded-full bg-[#3fb950]" />
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#8b949e]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] pulse-connected" />
              3 users connected
            </div>
            <div className="text-xs text-[#8b949e]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>fibonacci.js</div>
          </div>
          <div className="flex overflow-x-auto">
            {/* Line numbers */}
            <div className="py-4 px-2 sm:px-4 bg-[#0d1117] text-[#6e7681] text-xs select-none border-r border-[#21262d] shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace", lineHeight: '1.7' }}>
              {Array.from({ length: DEMO_LINES }, (_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            {/* Code */}
            <div className="py-4 px-3 sm:px-5 bg-[#0d1117] text-sm flex-1 overflow-x-auto">
              <DemoCode />
            </div>
          </div>
          {/* Bottom bar */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-[#161b22] border-t border-[#30363d]">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-1">
                {['AJ', 'MK', 'SR'].map((initials, i) => (
                  <div key={i} className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] border border-[#0d1117]"
                    style={{ background: ['#58a6ff', '#3fb950', '#a371f7'][i], color: '#0d1117', fontWeight: 600 }}>
                    {initials[0]}
                  </div>
                ))}
              </div>
              <span className="text-xs text-[#8b949e] hidden sm:inline">Alex, Maria, and Sanjay are editing</span>
              <span className="text-xs text-[#8b949e] sm:hidden">3 editing</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#a371f7]/15 text-[#a371f7]">AI Review ready</span>
          </div>
        </div>
      </section>

      {/* Architecture highlights */}
      <section className="border-y border-[#21262d] py-8 px-4 sm:px-6" ref={archRef}>
        <div className="max-w-3xl mx-auto">
          <div className={`text-center mb-4 reveal ${archVisible ? 'visible' : ''}`}>
            <span className="text-[10px] text-[#6e7681] uppercase tracking-widest" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 600 }}>Powered by</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-center text-xs text-[#8b949e]">
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
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="workflow" className="py-16 sm:py-20 px-4 sm:px-6 border-b border-[#21262d]" ref={stepsRef}>
        <div className="max-w-4xl mx-auto">
          <div className={`text-center mb-10 sm:mb-12 reveal ${stepsVisible ? 'visible' : ''}`} style={{ transitionDelay: '0ms' }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#161b22] border border-[#30363d] rounded-full text-xs text-[#8b949e] mb-4">
              <ArrowRight size={11} /> Workflow
            </div>
            <h2 className="text-2xl sm:text-3xl mb-3" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 700, letterSpacing: '-0.02em' }}>How to use SyncVerse</h2>
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
                {/* Step number circle */}
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 bg-[#0d1117] relative z-10"
                    style={{ borderColor: s.color, color: s.color }}>
                    {s.step}
                  </div>
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
      <section id="features" className="py-16 sm:py-20 px-4 sm:px-6" ref={featuresRef}>
        <div className="max-w-4xl mx-auto">
          <div className={`text-center mb-10 sm:mb-12 reveal ${featuresVisible ? 'visible' : ''}`} style={{ transitionDelay: '0ms' }}>
            <h2 className="text-2xl sm:text-3xl mb-3" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 700, letterSpacing: '-0.02em' }}>Features</h2>
            <p className="text-[#8b949e]">What the editor provides out of the box.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div key={f.title} className={`group p-5 rounded-xl border border-[#30363d] bg-[#161b22] transition-all duration-300 hover:-translate-y-1 hover:border-[#58a6ff]/20 hover:shadow-xl reveal ${featuresVisible ? 'visible' : ''}`}
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

      {/* Try It Now */}
      <section id="try-it" className="py-16 sm:py-20 px-4 sm:px-6 border-t border-[#21262d]" ref={playRef}>
        <div className="max-w-4xl mx-auto">
          <div className={`text-center mb-8 reveal ${playVisible ? 'visible' : ''}`}>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#161b22] border border-[#30363d] rounded-full text-xs text-[#8b949e] mb-4">
              <Play size={11} /> Try It Now
            </div>
            <h2 className="text-2xl sm:text-3xl mb-2" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 700, letterSpacing: '-0.02em' }}>No login required</h2>
            <p className="text-[#8b949e] text-sm">Write and run code directly in your browser.</p>
          </div>

          <div className={`rounded-xl border border-[#30363d] overflow-hidden reveal ${playVisible ? 'visible' : ''}`} style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-[#30363d]">
              <div className="flex items-center gap-2">
                {PLAY_LANGS.map(l => (
                  <button
                    key={l.id}
                    onClick={() => { setPlayLang(l); setPlayCode(l.def); setPlayOutput(''); }}
                    className={`px-3 py-1.5 rounded-md text-xs transition-all ${
                      playLang.id === l.id
                        ? 'bg-[#58a6ff]/15 text-[#58a6ff] border border-[#58a6ff]/30'
                        : 'text-[#8b949e] hover:text-[#e6edf3] border border-transparent'
                    }`}
                    style={{ fontWeight: playLang.id === l.id ? 600 : 400 }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              <button
                onClick={handlePlayRun}
                disabled={playRunning}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-all disabled:opacity-50"
                style={{
                  background: playRunning ? 'rgba(63,185,80,0.1)' : 'rgba(63,185,80,0.15)',
                  border: '1px solid rgba(63,185,80,0.4)',
                  color: '#3fb950',
                }}
              >
                {playRunning ? <Loader2 size={12} className="animate-spin" /> : <Play size={11} fill="currentColor" />}
                {playRunning ? 'Running...' : 'Run'}
              </button>
            </div>

            {/* Editor + Output */}
            <div className="flex flex-col sm:flex-row">
              <div className="flex-1 min-w-0 border-b sm:border-b-0 sm:border-r border-[#21262d]">
                <textarea
                  value={playCode}
                  onChange={e => setPlayCode(e.target.value)}
                  className="w-full bg-[#0d1117] text-[#e6edf3] p-4 outline-none resize-none"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '13px',
                    lineHeight: 1.7,
                    minHeight: '220px',
                    caretColor: '#58a6ff',
                  }}
                  spellCheck={false}
                />
              </div>
              <div className="w-full sm:w-64 lg:w-80 bg-[#0d1117] p-4">
                <div className="text-[10px] text-[#6e7681] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Terminal size={10} /> Output
                </div>
                <pre className="text-sm text-[#e6edf3] whitespace-pre-wrap" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', lineHeight: 1.6, minHeight: '180px' }}>
                  {playOutput || <span className="text-[#484f58]">Click "Run" to execute code</span>}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#21262d] px-4 sm:px-6 py-5 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-[#58a6ff] flex items-center justify-center">
            <Terminal size={10} className="text-[#0d1117]" />
          </div>
          <span className="text-xs text-[#8b949e]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>SyncVerse</span>
        </div>
        <span className="text-xs text-[#6e7681] flex-wrap">React · Express · MongoDB · Socket.IO · Yjs · tldraw</span>
      </footer>
    </div>
  );
}
