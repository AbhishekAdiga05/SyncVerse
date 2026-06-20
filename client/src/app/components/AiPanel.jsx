import { useState } from "react";
import { Sparkles, Wand2, Terminal, MessageSquare, Trash2, Code2, Copy, Check } from "lucide-react";

/**
 * AiPanel — AI Intent Mode UI rendered inside Room.jsx.
 *
 * Four actions: Explain · Refactor · Generate · Debug
 *
 * CRDT Safety: AI responses are NEVER written back to Yjs automatically.
 * The user must manually copy-paste any suggestion — preserving collaborative
 * intent and CRDT attribution.
 *
 * Props:
 *   editorRef {React.MutableRefObject} — Monaco instance
 *   language  {string}                 — Monaco language ID e.g. "javascript"
 *   stderr    {string}                 — Error output from last Judge0 run
 *   aiState   {object}                 — State from useAi() hook
 *   onTrigger {Function}               — triggerAi(payload)
 *   onClear   {Function}               — clearAi()
 */
export default function AiPanel({ editorRef, language, stderr, aiState, onTrigger, onClear }) {
  const { aiResponse, aiLoading, aiError, aiPrompt, setAiPrompt, activeAction } = aiState;
  const [copied, setCopied] = useState(false);

  /**
   * Returns selected code if any, otherwise full editor content.
   * Monaco selection API lets the AI focus on exactly what the user highlighted.
   */
  const getCode = () => {
    if (!editorRef.current) return "";
    const selection = editorRef.current.getSelection();
    const model = editorRef.current.getModel();
    if (selection && !selection.isEmpty()) return model.getValueInRange(selection);
    return editorRef.current.getValue();
  };

  const handleAction = (actionId) => {
    onTrigger({ action: actionId, code: getCode(), language, stderr });
  };

  const copyResponse = () => {
    if (!aiResponse) return;
    navigator.clipboard.writeText(aiResponse).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const ACTIONS = [
    { id: "explain",  label: "Explain",  icon: <MessageSquare className="w-3.5 h-3.5" />, title: "Explain selected code (or full file)" },
    { id: "refactor", label: "Refactor", icon: <Wand2 className="w-3.5 h-3.5" />,        title: "Refactor for readability and performance" },
    { id: "generate", label: "Generate", icon: <Sparkles className="w-3.5 h-3.5" />,     title: "Generate code from a prompt" },
    {
      id: "debug",
      label: "Debug",
      icon: <Terminal className="w-3.5 h-3.5" />,
      title: stderr ? "Debug the last execution error" : "Run your code first to capture an error",
      disabled: !stderr?.trim(),
    },
  ];

  return (
    <div className="flex flex-col h-full bg-neutral-950">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="h-10 px-3 border-b border-violet-500/15 flex items-center gap-2 shrink-0
                      bg-gradient-to-r from-violet-500/5 to-transparent">
        <div className="flex items-center gap-1.5 flex-1">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-xs font-semibold text-violet-300 uppercase tracking-wider">
            AI Intent Mode
          </span>
          <span className="text-[9px] text-violet-600 font-mono ml-1">via Gemini</span>
        </div>

        {/* Copy + Clear — only when there's a response */}
        {aiResponse && (
          <div className="flex items-center gap-1">
            <button
              onClick={copyResponse}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium
                         text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-all"
              title="Copy response"
            >
              {copied
                ? <><Check className="w-3 h-3 text-emerald-400" /> <span className="text-emerald-400">Copied</span></>
                : <><Copy className="w-3 h-3" /> Copy</>
              }
            </button>
            <button
              onClick={onClear}
              className="p-1 rounded text-neutral-700 hover:text-neutral-400 hover:bg-neutral-800 transition-all"
              title="Clear response"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
        {aiError && (
          <button onClick={onClear} className="p-1 rounded text-neutral-700 hover:text-neutral-400 transition" title="Clear">
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* ── Action Chips ────────────────────────────────────────── */}
      <div className="px-3 py-2.5 flex flex-wrap gap-1.5 border-b border-neutral-800/60 shrink-0">
        {ACTIONS.map((a) => (
          <button
            key={a.id}
            disabled={a.disabled || aiLoading}
            onClick={() => handleAction(a.id)}
            title={a.title}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold
                        transition-all duration-150 border
                        ${activeAction === a.id && !aiLoading
                          ? "bg-violet-500/15 text-violet-300 border-violet-500/35"
                          : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-violet-500/30 hover:text-violet-300 hover:bg-violet-500/5"
                        } disabled:opacity-35 disabled:cursor-not-allowed`}
          >
            {a.icon}
            {a.label}
          </button>
        ))}
      </div>

      {/* ── Generate Prompt Input (slides in) ───────────────────── */}
      <div className={`overflow-hidden transition-all duration-200 shrink-0 ${
        activeAction === "generate" || aiPrompt
          ? "max-h-28 opacity-100 border-b border-neutral-800"
          : "max-h-0 opacity-0"
      }`}>
        <div className="px-3 py-2">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Code2 className="w-3 h-3 text-violet-500" />
            <span className="text-[10px] font-medium text-neutral-500">Describe what to generate</span>
          </div>
          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                handleAction("generate");
              }
            }}
            spellCheck={false}
            placeholder="e.g. a binary search function that returns the index…"
            rows={2}
            className="w-full resize-none bg-neutral-900 border border-neutral-800 focus:border-violet-500
                       rounded-lg px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-700
                       focus:outline-none leading-relaxed transition-colors"
          />
          <p className="text-neutral-700 text-[9px] mt-1">⌘/Ctrl+Enter to generate</p>
        </div>
      </div>

      {/* ── Response Area ───────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-auto p-3 custom-scroll">

        {/* Loading — typing indicator */}
        {aiLoading && (
          <div className="bg-neutral-900 border border-violet-500/15 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-violet-400" />
              <span className="text-xs font-semibold text-violet-400">Gemini</span>
            </div>
            <div className="flex items-center gap-1.5 h-5">
              <span className="typing-dot" style={{ animationDelay: "0ms"   }} />
              <span className="typing-dot" style={{ animationDelay: "150ms" }} />
              <span className="typing-dot" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        {/* Error state */}
        {!aiLoading && aiError && (
          <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-xs font-semibold text-red-400">Error</span>
            </div>
            <p className="text-xs text-red-300 font-mono leading-relaxed">{aiError}</p>
          </div>
        )}

        {/* Success — response bubble */}
        {!aiLoading && aiResponse && (
          <div className="bg-neutral-900 border border-violet-500/12 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-violet-400" />
              <span className="text-xs font-semibold text-violet-400">Gemini</span>
              {activeAction && (
                <span className="text-[9px] text-neutral-700 ml-auto capitalize">{activeAction}</span>
              )}
            </div>
            <pre className="text-xs text-neutral-200 font-mono whitespace-pre-wrap break-words leading-5">
              {aiResponse}
            </pre>
          </div>
        )}

        {/* Empty state */}
        {!aiLoading && !aiError && !aiResponse && (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-8 text-center min-h-[120px]">
            <div className="p-3 bg-violet-500/5 rounded-2xl border border-violet-500/10">
              <Sparkles className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-600">AI Intent Mode</p>
              <p className="text-[10px] text-neutral-700 mt-1 max-w-[160px] leading-relaxed">
                Highlight code in the editor, then click an action above.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
