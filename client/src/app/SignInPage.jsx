import { SignIn } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Terminal, Code2, Users, Zap } from "lucide-react";

const FEATURES = [
  { icon: <Code2 size={14} />, text: "Real-time collaborative code editor" },
  { icon: <Users size={14} />, text: "Multi-user sync via CRDT (Yjs)" },
  { icon: <Zap size={14} />, text: "AI-powered code review & execution" },
];

export default function SignInPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col">
      <nav className="border-b border-[#21262d] px-4 sm:px-6 h-14 flex items-center justify-between shrink-0 sticky top-0 z-50 bg-[#0d1117]/90 backdrop-blur-sm">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-7 h-7 rounded-md bg-[#58a6ff] flex items-center justify-center">
            <Terminal size={14} className="text-[#0d1117]" />
          </div>
          <span className="text-[#e6edf3] text-sm font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Pair<span className="text-[#58a6ff]">verse</span>
          </span>
        </button>
        <button
          onClick={() => navigate("/sign-up")}
          className="text-xs text-[#8b949e] hover:text-[#e6edf3] transition-colors"
        >
          No account?{" "}
          <span className="text-[#58a6ff] font-semibold">Sign Up →</span>
        </button>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] sm:w-[800px] h-[300px] sm:h-[400px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(88,166,255,0.06) 0%, transparent 70%)" }}
        />

        <div className="w-full max-w-[420px]">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-[24px] sm:text-[28px] mb-1.5 text-white" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 700, letterSpacing: '-0.02em' }}>
              Welcome back
            </h1>
            <p className="text-sm text-[#8b949e]">Sign in to continue to your workspace</p>
          </div>

          <SignIn
            path="/sign-in"
            routing="path"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/dashboard"
            appearance={{
              variables: {
                colorBackground: "#161b22",
                colorText: "#e6edf3",
                colorTextSecondary: "#8b949e",
                colorPrimary: "#58a6ff",
                colorInputBackground: "#0d1117",
                colorInputText: "#e6edf3",
                colorNeutral: "#e6edf3",
                borderRadius: "0.5rem",
                fontFamily: "Inter, system-ui, sans-serif",
              },
              elements: {
                card: {
                  background: "#161b22",
                  border: "1px solid #21262d",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                  borderRadius: "12px",
                  padding: "1.5rem 1.5rem 2rem",
                  color: "#e6edf3",
                },
                headerTitle: { display: "none" },
                headerSubtitle: { display: "none" },
                socialButtonsBlockButton: {
                  background: "#21262d",
                  border: "1px solid #30363d",
                  color: "#e6edf3",
                  borderRadius: "8px",
                  fontSize: "0.8125rem",
                  height: "40px",
                },
                socialButtonsBlockButton__hover: { background: "#30363d" },
                socialButtonsProviderIcon: { color: "#e6edf3" },
                dividerLine: { background: "#21262d" },
                dividerText: { color: "#8b949e" },
                formFieldLabel: { color: "#e6edf3", fontSize: "0.8125rem" },
                formFieldInput: {
                  background: "#0d1117",
                  border: "1px solid #30363d",
                  color: "#e6edf3",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  height: "42px",
                },
                formFieldInput__focused: { borderColor: "#58a6ff" },
                formButtonPrimary: {
                  background: "#58a6ff",
                  color: "#0d1117",
                  fontWeight: "600",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  height: "42px",
                },
                footerActionText: { color: "#8b949e" },
                footerActionLink: { color: "#58a6ff" },
                identityPreviewText: { color: "#e6edf3" },
                identityPreviewEditButtonIcon: { color: "#8b949e" },
                alertText: { color: "#e6edf3" },
                formResendCodeLink: { color: "#58a6ff" },
              },
            }}
          />

          <div className="mt-6 pt-5 border-t border-[#21262d]">
            <div className="flex items-center gap-3 sm:gap-4 justify-center flex-wrap">
              {FEATURES.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[11px] text-[#8b949e]">
                  <span className="text-[#58a6ff]">{f.icon}</span>
                  <span className="hidden sm:inline">{f.text}</span>
                  <span className="sm:hidden">{f.text.split(' ').slice(0, 3).join(' ')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-[#21262d] px-6 py-4 text-center shrink-0">
        <p className="text-xs text-[#6e7681]">
          Secured by <span className="text-[#8b949e] font-medium">Clerk</span> · PairForge
        </p>
      </footer>
    </div>
  );
}
