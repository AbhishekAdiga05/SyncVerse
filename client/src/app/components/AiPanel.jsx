import { Sparkles, Wand2, Terminal, MessageSquare, Loader2, Trash2, Code2 } from "lucide-react";

/**
 * AiPanel — the AI Intent Mode UI panel rendered inside Room.jsx.
 *
 * Provides four actions:
 *   • Explain  — summarises what the code does
 *   • Refactor — returns an improved version of the code
 *   • Generate — creates code from a natural-language prompt
 *   • Debug    — diagnoses a Judge0 error and suggests a fix
 *
 * CRDT Safety: AI responses are NEVER written back to the Yjs document automatically.
 * The user must manually apply any suggestion. This preserves collaborative integrity
 * because AI changes should be deliberate, attributed user actions that flow through
 * the CRDT like any other edit.
 *
 * Props:
 *   editorRef    {React.MutableRefObject} — Monaco editor instance ref
 *   language     {string}                 — Monaco language ID e.g. "javascript"
 *   stderr       {string}                 — Error output from last Judge0 execution
 *   aiState      {object}                 — State from useAi() hook
 *   onTrigger    {Function}               — triggerAi from useAi hook
 *   onClear      {Function}               — clearAi from useAi hook
 */
export default function AiPanel({ editorRef, language, stderr, aiState, onTrigger, onClear }) {
  const { aiResponse, aiLoading, aiError, aiPrompt, setAiPrompt, activeAction } = aiState;

  /**
   * Gets the text to send to Gemini.
   * Prefers the current Monaco selection; falls back to full editor content.
   * This respects the user's intent — "explain THIS function" vs "explain everything".
   */
  const getCode = () => {
    if (!editorRef.current) return "";
    const selection = editorRef.current.getSelection();
    const model = editorRef.current.getModel();
    if (selection && !selection.isEmpty()) {
      return model.getValueInRange(selection);
    }
    return editorRef.current.getValue();
  };

  const actions = [
    {
      id: "explain",
      label: "Explain",
      icon: <MessageSquare className="w-3.5 h-3.5" />,
      title: "Explain selected code (or full editor)",
    },
    {
      id: "refactor",
      label: "Refactor",
      icon: <Wand2 className="w-3.5 h-3.5" />,
      title: "Refactor selected code for clarity and performance",
    },
    {
      id: "generate",
      label: "Generate",
      icon: <Sparkles className="w-3.5 h-3.5" />,
      title: "Generate code from a natural-language prompt",
    },
    {
      id: "debug",
      label: "Debug",
      icon: <Terminal className="w-3.5 h-3.5" />,
      title: stderr ? "Debug the last execution error" : "Run your code first to capture an error",
      disabled: !stderr?.trim(),
    },
  ];

  const handleAction = (actionId) => {
    onTrigger({
      action: actionId,
      code: getCode(),
      language,
      stderr,
    });
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="h-10 px-4 border-b border-neutral-800 flex items-center gap-2 shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-violet-400" />
        <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
          AI Intent Mode
        </span>

        {/* Clear button — appears once there's a response */}
        {(aiResponse || aiError) && (
          <button
            onClick={onClear}
            className="ml-auto p-1 rounded text-neutral-600 hover:text-neutral-400 transition-colors"
            title="Clear response"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Action Buttons ──────────────────────────────────────────────────── */}
      <div className="px-4 py-3 flex flex-wrap gap-2 border-b border-neutral-800 shrink-0">
        {actions.map((a) => (
          <button
            key={a.id}
            disabled={a.disabled || aiLoading}
            onClick={() => handleAction(a.id)}
            title={a.title}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150
              ${activeAction === a.id && !aiLoading
                ? "bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-[0_0_8px_rgba(139,92,246,0.2)]"
                : "bg-neutral-800 text-neutral-300 border border-neutral-700 hover:border-violet-500/40 hover:text-violet-300 hover:bg-violet-500/5"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {a.icon}
            {a.label}
          </button>
        ))}
      </div>

      {/* ── Generate Prompt Input ───────────────────────────────────────────── */}
      {/* Only shown when user clicks Generate — natural-language input for code gen */}
      <div
        className={`overflow-hidden transition-all duration-200 shrink-0 ${
          activeAction === "generate" || aiPrompt
            ? "max-h-24 opacity-100 border-b border-neutral-800"
            : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 py-2">
          <div className="flex items-center gap-2 mb-1.5">
            <Code2 className="w-3 h-3 text-violet-400" />
            <span className="text-xs font-medium text-neutral-400">Describe what to generate</span>
          </div>
          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => {
              // Ctrl/Cmd + Enter triggers generate
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                handleAction("generate");
              }
            }}
            spellCheck={false}
            placeholder="e.g. A function that debounces another function by 500ms…"
            rows={2}
            className="w-full resize-none bg-neutral-800 border border-neutral-700 focus:border-violet-500 rounded-md px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none leading-relaxed transition-colors"
          />
          <p className="text-neutral-600 text-xs mt-1">Press ⌘/Ctrl+Enter to generate</p>
        </div>
      </div>

      {/* ── Response Area ───────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-auto p-4 leading-relaxed">
        {aiLoading ? (
          <div className="flex items-center gap-2 text-violet-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="text-xs animate-pulse">Gemini is thinking…</span>
          </div>
        ) : aiError ? (
          <p className="text-xs text-red-400 font-mono">{aiError}</p>
        ) : aiResponse ? (
          <pre className="text-xs text-neutral-100 font-mono whitespace-pre-wrap break-words">
            {aiResponse}
          </pre>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-6 text-center">
            <div className="p-3 bg-violet-500/5 rounded-2xl border border-violet-500/10">
              <Sparkles className="w-6 h-6 text-violet-500/40" />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500">AI Intent Mode</p>
              <p className="text-xs text-neutral-600 mt-1 max-w-[180px]">
                Select code in the editor, then click an action above.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
