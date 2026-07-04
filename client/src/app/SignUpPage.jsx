import { SignUp } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Terminal, Shield, PenTool, MessageSquare } from "lucide-react";

const FEATURES = [
  { icon: <Shield size={14} />, text: "Free and secure collaboration" },
  { icon: <PenTool size={14} />, text: "Built-in whiteboard & diagrams" },
  { icon: <MessageSquare size={14} />, text: "Real-time chat & AI review" },
];

export default function SignUpPage() {
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
            Sync<span className="text-[#58a6ff]">Verse</span>
          </span>
        </button>
        <button
          onClick={() => navigate("/sign-in")}
          className="text-xs text-[#8b949e] hover:text-[#e6edf3] transition-colors"
        >
          Already have an account?{" "}
          <span className="text-[#58a6ff] font-semibold">Log In →</span>
        </button>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] sm:w-[800px] h-[300px] sm:h-[400px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(163,113,247,0.06) 0%, transparent 70%)" }}
        />

        <div className="w-full max-w-[420px]">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-[24px] sm:text-[28px] mb-1.5 text-white" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 700, letterSpacing: '-0.02em' }}>
              Create your account
            </h1>
            <p className="text-sm text-[#8b949e]">Join SyncVerse and start collaborating for free</p>
          </div>

          <SignUp
            path="/sign-up"
            routing="path"
            signInUrl="/sign-in"
            fallbackRedirectUrl="/dashboard"
            appearance={{
              variables: {
                colorBackground: "#161b22",
                colorText: "#e6edf3",
                colorTextSecondary: "#8b949e",
                colorPrimary: "#a371f7",
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
                formFieldInput__focused: { borderColor: "#a371f7" },
                formButtonPrimary: {
                  background: "#a371f7",
                  color: "#ffffff",
                  fontWeight: "600",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  height: "42px",
                },
                footerActionText: { color: "#8b949e" },
                footerActionLink: { color: "#a371f7" },
                identityPreviewText: { color: "#e6edf3" },
                identityPreviewEditButtonIcon: { color: "#8b949e" },
                alertText: { color: "#e6edf3" },
                formResendCodeLink: { color: "#a371f7" },
              },
            }}
          />

          <div className="mt-6 pt-5 border-t border-[#21262d]">
            <div className="flex items-center gap-3 sm:gap-4 justify-center flex-wrap">
              {FEATURES.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[11px] text-[#8b949e]">
                  <span className="text-[#a371f7]">{f.icon}</span>
                  {f.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-[#21262d] px-6 py-4 text-center shrink-0">
        <p className="text-xs text-[#6e7681]">
          Secured by <span className="text-[#8b949e] font-medium">Clerk</span> · SyncVerse
        </p>
      </footer>
    </div>
  );
}
