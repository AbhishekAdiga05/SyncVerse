import { useState } from "react";
import { Zap, MessageSquare, Wand2, Sparkles, Terminal as TerminalIcon, Copy, Check, Trash2, Code2, Loader2, XCircle, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function AIReviewPanel({ editorRef, language, stderr, aiState }) {
  const { aiResponse, aiLoading, aiError, aiPrompt, setAiPrompt, activeAction, triggerAi, clearAi } = aiState;
  const [copied, setCopied] = useState(false);

  const getCode = () => {
    if (!editorRef?.current) return "";
    const selection = editorRef.current.getSelection();
    const model = editorRef.current.getModel();
    if (selection && !selection.isEmpty()) return model.getValueInRange(selection);
    return editorRef.current.getValue();
  };

  const handleAction = (actionId) => {
    triggerAi({ action: actionId, code: getCode(), language, stderr });
  };

  const copyResponse = () => {
    if (!aiResponse) return;
    navigator.clipboard.writeText(aiResponse).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const ACTIONS = [
    { id: "explain", label: "Explain", icon: <MessageSquare size={13} />, title: "Explain code", color: "#58a6ff" },
    { id: "refactor", label: "Refactor", icon: <Wand2 size={13} />, title: "Refactor for readability", color: "#3fb950" },
    { id: "generate", label: "Generate", icon: <Sparkles size={13} />, title: "Generate code from prompt", color: "#a371f7" },
    { id: "debug", label: "Debug", icon: <TerminalIcon size={13} />, title: "Debug execution error", color: "#f85149", disabled: !stderr?.trim() },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3] overflow-hidden">
      {/* Actions Grid */}
      <div className="px-4 py-4 border-b border-[#21262d]" style={{ background: 'rgba(22,27,34,0.8)' }}>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {ACTIONS.map((a) => (
            <button
              key={a.id}
              disabled={a.disabled || aiLoading}
              onClick={() => handleAction(a.id)}
              title={a.title}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={activeAction === a.id && !aiLoading ? {
                background: `${a.color}18`,
                border: `1px solid ${a.color}55`,
                color: a.color,
                boxShadow: `0 0 12px ${a.color}25`,
              } : {
                background: 'rgba(13,17,23,0.6)',
                border: '1px solid rgba(48,54,61,0.8)',
                color: '#8b949e',
              }}
            >
              <span style={{ color: a.color }}>{a.icon}</span>
              <span>{a.label}</span>
            </button>
          ))}
        </div>

        {/* Generate Prompt Input */}
        <div className={`overflow-hidden transition-all duration-200 ${activeAction === "generate" || aiPrompt ? "max-h-32 opacity-100" : "max-h-0 opacity-0"}`}>
          <div className="pt-2">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Code2 size={12} className="text-[#a371f7]" />
              <span className="text-[10px] font-medium text-[#8b949e]">Describe what to generate</span>
            </div>
            <div className="relative">
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
                placeholder="e.g. a binary search function..."
                rows={2}
                className="w-full resize-none bg-[#0d1117] border border-[#30363d] focus:border-[#a371f7] rounded-lg pl-3 pr-9 py-2 text-xs text-[#e6edf3] placeholder:text-[#3d444d] focus:outline-none transition-colors custom-scroll"
              />
              <button
                onClick={() => handleAction("generate")}
                disabled={aiLoading || !aiPrompt.trim()}
                title="Generate (Ctrl+Enter)"
                className="absolute bottom-2 right-2 p-1.5 rounded-md transition-colors bg-[#a371f7] hover:bg-[#9060df] text-[#ffffff] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={11} className="ml-px" />
              </button>
            </div>
            <p className="text-[#3d444d] text-[9px] mt-1 text-right">⌘/Ctrl+Enter or click to generate</p>
          </div>
        </div>
      </div>

      {/* Response Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scroll">
        {/* Loading State */}
        {aiLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-12 h-12 rounded-xl bg-[#a371f7]/10 border border-[#a371f7]/20 flex items-center justify-center mb-4">
              <Loader2 size={22} className="text-[#a371f7] animate-spin" />
            </div>
            <p className="text-sm text-[#8b949e] mb-1">Analyzing code with AI…</p>
            <p className="text-xs text-[#3d444d]">This may take a few seconds</p>
          </div>
        )}

        {/* Error State */}
        {!aiLoading && aiError && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-12 h-12 rounded-xl bg-[#f85149]/10 border border-[#f85149]/20 flex items-center justify-center mb-4">
              <XCircle size={22} className="text-[#f85149]" />
            </div>
            <p className="text-sm text-[#f85149] mb-2 font-medium">Analysis Failed</p>
            <p className="text-xs text-[#8b949e] leading-relaxed">{aiError}</p>
          </div>
        )}

        {/* Success Response */}
        {!aiLoading && aiResponse && (
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
            <div className="px-3 py-2 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#a371f7]" />
                <span className="text-xs font-semibold text-[#a371f7]">AI Response</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={copyResponse}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors"
                >
                  {copied ? <><Check size={12} className="text-[#3fb950]" /> <span className="text-[#3fb950]">Copied</span></> : <><Copy size={12} /> Copy</>}
                </button>
                <button
                  onClick={clearAi}
                  className="p-1 rounded text-[#8b949e] hover:text-[#f85149] hover:bg-[#21262d] transition-colors"
                  title="Clear"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
            <div className="p-4 text-sm text-[#e6edf3] leading-relaxed">
              <ReactMarkdown
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    return !inline && match ? (
                      <div className="rounded-md overflow-hidden my-3 border border-[#30363d]">
                        <SyntaxHighlighter
                          {...props}
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          customStyle={{ margin: 0, padding: '12px', fontSize: '12px', background: '#0d1117' }}
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <code {...props} className="bg-[#21262d] text-[#e6edf3] px-1.5 py-0.5 rounded text-[11px] font-mono border border-[#30363d]">
                        {children}
                      </code>
                    );
                  },
                  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="pl-1">{children}</li>,
                  h1: ({ children }) => <h1 className="text-lg font-bold mb-3 mt-4 text-white border-b border-[#21262d] pb-1">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-4 text-white">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-bold mb-2 mt-3 text-white">{children}</h3>,
                  blockquote: ({ children }) => <blockquote className="border-l-2 border-[#a371f7] pl-3 py-1 my-3 text-[#8b949e] italic bg-[#a371f7]/5 rounded-r">{children}</blockquote>,
                  a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" className="text-[#58a6ff] hover:underline">{children}</a>,
                  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                }}
              >
                {aiResponse}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!aiLoading && !aiError && !aiResponse && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-12 h-12 rounded-xl bg-[#21262d] border border-[#30363d] flex items-center justify-center mb-4">
              <Zap size={22} className="text-[#3d444d]" />
            </div>
            <p className="text-sm text-[#e6edf3] font-medium mb-1">AI Assistant</p>
            <p className="text-xs text-[#8b949e] max-w-[200px] mx-auto leading-relaxed">
              Highlight code in the editor and click an action to get AI-powered insights.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
