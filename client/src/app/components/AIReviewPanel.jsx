import { useState, useMemo, useRef, useEffect } from "react";
import { Bot, MessageSquare, Lightbulb, Wand2, Sparkles, BugPlay, Copy, Check, Trash2, Loader2, XCircle, Send, ChevronDown, ChevronRight, Clock, Search, Filter, Zap, RotateCcw, Code2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

function CodeBlock({ language, children }) {
  const [copied, setCopied] = useState(false);

  const code = String(children).replace(/\n$/, "");
  const lines = code.split("\n");

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg overflow-hidden my-3 border border-[#30363d] group" style={{ animation: "fadeSlideIn 0.2s ease" }}>
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0d1117] border-b border-[#30363d]">
        <div className="flex items-center gap-2">
          <Code2 size={10} className="text-[#484f58]" />
          <span className="text-[10px] text-[#8b949e] font-mono">{language || "code"}</span>
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1 text-[10px] text-[#8b949e] hover:text-[#e6edf3] transition-all duration-150 opacity-0 group-hover:opacity-100"
        >
          {copied ? (
            <span className="flex items-center gap-1 text-[#3fb950]">
              <Check size={10} /> Copied
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Copy size={10} /> Copy
            </span>
          )}
        </button>
      </div>
      <div className="relative">
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={language}
          PreTag="div"
          showLineNumbers
          lineNumberStyle={{ minWidth: "2.5em", paddingRight: "1em", color: "#484f58", fontSize: "11px", userSelect: "none" }}
          customStyle={{ margin: 0, padding: "10px 12px", fontSize: "12px", background: "#161b22", lineHeight: "1.6" }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

const ACTION_META = {
  explain: { color: "#58a6ff", icon: Lightbulb, label: "Explain", desc: "Understand selected code" },
  refactor: { color: "#3fb950", icon: Wand2, label: "Refactor", desc: "Improve code readability" },
  generate: { color: "#a371f7", icon: Sparkles, label: "Generate", desc: "Write code from description" },
  debug: { color: "#f85149", icon: BugPlay, label: "Debug", desc: "Fix execution errors" },
};

const FILTER_OPTIONS = [
  { id: null, label: "All", color: "#8b949e" },
  { id: "explain", label: "Explain", color: "#58a6ff" },
  { id: "refactor", label: "Refactor", color: "#3fb950" },
  { id: "generate", label: "Generate", color: "#a371f7" },
  { id: "debug", label: "Debug", color: "#f85149" },
];

function timeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 15) return "now";
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function AIMarkdown({ content }) {
  return (
    <ReactMarkdown
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          return !inline && match ? (
            <CodeBlock language={match[1]}>{children}</CodeBlock>
          ) : (
            <code {...props} className="bg-[#21262d] text-[#e6edf3] px-1.5 py-0.5 rounded text-[11px] font-mono border border-[#30363d]">
              {children}
            </code>
          );
        },
        p: ({ children }) => <p className="mb-3 last:mb-0 text-[13px] leading-relaxed">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1 text-[13px]">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1 text-[13px]">{children}</ol>,
        li: ({ children }) => <li className="pl-1">{children}</li>,
        h1: ({ children }) => <h1 className="text-base font-bold mb-3 mt-4 text-white border-b border-[#21262d] pb-1">{children}</h1>,
        h2: ({ children }) => <h2 className="text-sm font-bold mb-2 mt-4 text-white">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-semibold mb-2 mt-3 text-white">{children}</h3>,
        blockquote: ({ children }) => <blockquote className="border-l-2 border-[#a371f7] pl-3 py-1 my-3 text-[#8b949e] italic bg-[#a371f7]/5 rounded-r">{children}</blockquote>,
        a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" className="text-[#58a6ff] hover:underline">{children}</a>,
        strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
        hr: () => <hr className="my-4 border-[#21262d]" />,
        table: ({ children }) => <div className="overflow-x-auto my-3"><table className="min-w-full text-xs border-collapse border border-[#30363d]">{children}</table></div>,
        thead: ({ children }) => <thead className="bg-[#161b22]">{children}</thead>,
        th: ({ children }) => <th className="border border-[#30363d] px-3 py-1.5 text-left font-medium">{children}</th>,
        td: ({ children }) => <td className="border border-[#30363d] px-3 py-1.5">{children}</td>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3 p-1">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#30363d]">
            <div className="w-3 h-3 rounded-full bg-[#21262d]" />
            <div className="h-2.5 w-20 rounded bg-[#21262d]" />
            <div className="h-2 w-10 rounded bg-[#21262d] ml-auto" />
          </div>
          <div className="p-3 space-y-2">
            <div className="h-2 rounded bg-[#21262d] w-full" />
            <div className="h-2 rounded bg-[#21262d] w-3/4" />
            <div className="h-2 rounded bg-[#21262d] w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function HistoryEntry({ entry, onRemove }) {
  const [collapsed, setCollapsed] = useState(true);
  const [isRemoving, setIsRemoving] = useState(false);
  const meta = ACTION_META[entry.action];
  const color = meta?.color || "#58a6ff";
  const Icon = meta?.icon || Bot;

  const handleRemove = (e) => {
    e.stopPropagation();
    setIsRemoving(true);
    setTimeout(() => onRemove(entry.id), 200);
  };

  return (
    <div
      className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden transition-all duration-200"
      style={{
        opacity: isRemoving ? 0 : 1,
        transform: isRemoving ? "translateX(20px)" : "none",
        borderLeft: `2px solid ${color}`,
      }}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[#1c2128] transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${color}15` }}
          >
            <Icon size={11} style={{ color }} />
          </span>
          <span className="text-xs font-medium truncate" style={{ color }}>{meta?.label || "AI"}</span>
          <span className="text-[10px] text-[#3d444d] flex items-center gap-1 shrink-0 font-mono">
            <Clock size={8} /> {timeAgo(entry.timestamp)}
          </span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={handleRemove}
            className="p-1 rounded text-[#3d444d] hover:text-[#f85149] hover:bg-[#f85149]/10 transition-colors"
            title="Remove"
          >
            <Trash2 size={10} />
          </button>
          <span className="w-px h-3 bg-[#21262d] mx-0.5" />
          {collapsed ? (
            <ChevronRight size={11} className="text-[#3d444d]" />
          ) : (
            <ChevronDown size={11} className="text-[#3d444d]" />
          )}
        </div>
      </button>

      {/* Expandable content with max-height transition */}
      <div
        className="overflow-hidden transition-all duration-200"
        style={{ maxHeight: collapsed ? "0" : "800px" }}
      >
        {!collapsed && (
          <div className="px-3 py-2.5 border-t border-[#30363d] text-sm text-[#e6edf3]">
            {entry.error ? (
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-[#f85149]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <XCircle size={12} className="text-[#f85149]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#f85149] mb-0.5">Analysis failed</p>
                  <p className="text-xs text-[#8b949e] leading-relaxed">{entry.error}</p>
                </div>
              </div>
            ) : entry.response ? (
              <div style={{ animation: "fadeSlideIn 0.2s ease" }}>
                <AIMarkdown content={entry.response} />
              </div>
            ) : (
              <div className="flex items-center gap-2.5 py-2">
                <Loader2 size={12} className="animate-spin" style={{ color }} />
                <span className="text-xs text-[#8b949e]">
                  Analyzing{entry.label ? `: ${entry.label}` : ""}…
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AIReviewPanel({ editorRef, language, stderr, aiState }) {
  const { conversation, aiLoading, aiPrompt, setAiPrompt, activeAction, triggerAi, clearAi, removeEntry } = aiState;
  const [showGeneratePrompt, setShowGeneratePrompt] = useState(false);
  const [filterAction, setFilterAction] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    if (showGeneratePrompt) searchRef.current?.focus();
  }, [showGeneratePrompt]);

  const getCode = () => {
    if (!editorRef?.current) return "";
    const selection = editorRef.current.getSelection();
    const model = editorRef.current.getModel();
    if (selection && !selection.isEmpty()) return model.getValueInRange(selection);
    return editorRef.current.getValue();
  };

  const handleAction = (actionId) => {
    if (!aiLoading) {
      if (actionId === "generate") setShowGeneratePrompt(true);
      triggerAi({ action: actionId, code: getCode(), language, stderr });
    }
  };

  const hasStderr = stderr?.trim()?.length > 0;

  const filteredConversation = useMemo(() => {
    let items = conversation;
    if (filterAction) items = items.filter(e => e.action === filterAction);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      items = items.filter(e =>
        (e.label && e.label.toLowerCase().includes(q)) ||
        (e.response && e.response.toLowerCase().includes(q)) ||
        (e.code && e.code.toLowerCase().includes(q)) ||
        (e.error && e.error.toLowerCase().includes(q))
      );
    }
    return items;
  }, [conversation, filterAction, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3] overflow-hidden">
      {/* ─── Accent bar ───────────────────────────────── */}
      <div className="h-[2px] shrink-0" style={{ background: "linear-gradient(90deg, #58a6ff, #a371f7, #3fb950, #f85149)" }} />

      {/* ─── Header ───────────────────────────────────── */}
      <div className="px-3 pt-3 pb-2.5 border-b border-[#21262d]" style={{ background: "linear-gradient(180deg, rgba(22,27,34,0.95) 0%, rgba(13,17,23,0.9) 100%)" }}>
        <div className="flex items-center gap-2 mb-2.5">
          <div className="w-6 h-6 rounded-lg bg-[#a371f7]/10 flex items-center justify-center">
            <Bot size={13} className="text-[#a371f7]" />
          </div>
          <span className="text-xs font-semibold text-[#e6edf3]">AI Assistant</span>
          <span className="text-[9px] text-[#3d444d] font-mono ml-auto">v2</span>
        </div>

        {/* Action buttons row */}
        <div className="flex items-center gap-1.5">
          {Object.entries(ACTION_META).map(([id, meta]) => {
            const Icon = meta.icon;
            const isActive = activeAction === id && aiLoading;
            const isDisabled = aiLoading || (id === "debug" && !hasStderr);
            return (
              <button
                key={id}
                disabled={isDisabled}
                onClick={() => handleAction(id)}
                title={meta.desc}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all duration-150 disabled:opacity-35 disabled:cursor-not-allowed"
                style={
                  isActive
                    ? { background: `${meta.color}18`, border: `1px solid ${meta.color}55`, color: meta.color, boxShadow: `0 0 14px ${meta.color}20` }
                    : { background: "rgba(13,17,23,0.6)", border: "1px solid rgba(48,54,61,0.6)", color: "#6e7681" }
                }
              >
                <Icon size={11} style={{ color: isActive ? meta.color : "#484f58" }} />
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>

        {/* Generate prompt */}
        {showGeneratePrompt && (
          <div className="mt-2.5 pt-2.5 border-t border-[#21262d]" style={{ animation: "fadeSlideIn 0.15s ease" }}>
            <div className="relative">
              <textarea
                ref={searchRef}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                    e.preventDefault();
                    handleAction("generate");
                  }
                }}
                spellCheck={false}
                placeholder="Describe what to generate…"
                rows={2}
                className="w-full resize-none bg-[#0d1117] border border-[#30363d] focus:border-[#a371f7] rounded-lg pl-2.5 pr-9 py-2 text-xs text-[#e6edf3] placeholder:text-[#3d444d] focus:outline-none transition-colors custom-scroll"
              />
              <button
                onClick={() => handleAction("generate")}
                disabled={aiLoading || !aiPrompt.trim()}
                title="Generate (Ctrl+Enter)"
                className="absolute bottom-2 right-2 p-1.5 rounded-md transition-all bg-[#a371f7] hover:bg-[#9060df] text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send size={11} />
              </button>
            </div>
            <p className="text-[9px] text-[#3d444d] mt-1">Press Ctrl+Enter to generate</p>
          </div>
        )}
      </div>

      {/* ─── Search + Filter bar ──────────────────────── */}
      {conversation.length > 0 && (
        <div className="px-3 py-2 border-b border-[#21262d] space-y-1.5">
          <div className="relative">
            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#3d444d]" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search responses..."
              spellCheck={false}
              className="w-full bg-[#161b22] border border-[#30363d] rounded-lg pl-7 pr-7 py-1.5 text-[11px] text-[#e6edf3] placeholder:text-[#3d444d] focus:border-[#484f58] focus:outline-none transition-colors"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-[#3d444d] hover:text-[#8b949e] transition-colors">
                  <XCircle size={10} />
                </button>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-0.5 rounded transition-colors ${showFilters || filterAction ? "text-[#58a6ff]" : "text-[#3d444d] hover:text-[#8b949e]"}`}
                title="Toggle filters"
              >
                <Filter size={11} />
              </button>
            </div>
          </div>
          {showFilters && (
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scroll pb-0.5" style={{ animation: "fadeSlideIn 0.1s ease" }}>
              {FILTER_OPTIONS.map(f => (
                <button
                  key={f.id || "all"}
                  onClick={() => setFilterAction(f.id)}
                  className="px-2 py-1 rounded-md text-[10px] font-medium transition-all shrink-0"
                  style={
                    filterAction === f.id
                      ? { background: `${f.color}15`, border: `1px solid ${f.color}45`, color: f.color }
                      : { background: "transparent", border: "1px solid transparent", color: "#3d444d" }
                  }
                  onMouseEnter={e => { if (filterAction !== f.id) e.target.style.color = "#8b949e"; }}
                  onMouseLeave={e => { if (filterAction !== f.id) e.target.style.color = "#3d444d"; }}
                >
                  {f.label}
                  {f.id && (
                    <span className="ml-1 text-[9px]" style={{ opacity: 0.6 }}>
                      ({conversation.filter(e => e.action === f.id).length})
                    </span>
                  )}
                  {!f.id && (
                    <span className="ml-1 text-[9px]" style={{ opacity: 0.6 }}>
                      ({conversation.length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Conversation History ─────────────────────── */}
      <div className="flex-1 overflow-y-auto custom-scroll">
        {conversation.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#21262d] to-[#161b22] border border-[#30363d] flex items-center justify-center mb-5 shadow-lg">
              <Bot size={26} className="text-[#3d444d]" />
            </div>
            <h3 className="text-sm font-semibold text-[#e6edf3] mb-1">AI Code Assistant</h3>
            <p className="text-[11px] text-[#6e7681] max-w-[220px] mx-auto leading-relaxed mb-4">
              Select code in the editor and choose an action to get started.
            </p>
            <div className="grid grid-cols-2 gap-1.5 w-full max-w-[220px]">
              {Object.entries(ACTION_META).slice(0, 4).map(([id, meta]) => {
                const Icon = meta.icon;
                return (
                  <div
                    key={id}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px]"
                    style={{ background: `${meta.color}08`, border: `1px solid ${meta.color}15`, color: meta.color }}
                  >
                    <Icon size={10} />
                    <span>{meta.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : filteredConversation.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <Search size={20} className="text-[#3d444d] mb-3" />
            <p className="text-xs text-[#8b949e] mb-1">No matching responses</p>
            <button
              onClick={() => { setSearchQuery(""); setFilterAction(null); }}
              className="text-[10px] text-[#58a6ff] hover:underline inline-flex items-center gap-1"
            >
              <RotateCcw size={9} /> Clear all filters
            </button>
          </div>
        ) : (
          <>
            <div className="p-3 space-y-2">
              {filteredConversation.map((entry) => (
                <HistoryEntry key={entry.id} entry={entry} onRemove={removeEntry} />
              ))}
            </div>

            {conversation.length > 1 && (
              <div className="px-3 pb-3">
                <button
                  onClick={clearAi}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] text-[#3d444d] hover:text-[#8b949e] hover:bg-[#161b22] border border-transparent hover:border-[#21262d] transition-all duration-150"
                >
                  <Trash2 size={10} />
                  Clear all {conversation.length} responses
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Loading overlay */}
      {aiLoading && conversation.length > 0 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-[10px] font-medium flex items-center gap-2 shadow-lg border border-[#30363d]" style={{ background: "rgba(22,27,34,0.95)" }}>
          <Loader2 size={10} className="animate-spin" style={{ color: ACTION_META[activeAction]?.color || "#a371f7" }} />
          <span style={{ color: ACTION_META[activeAction]?.color || "#a371f7" }}>
            {ACTION_META[activeAction]?.label || "Processing"}…
          </span>
        </div>
      )}
    </div>
  );
}
