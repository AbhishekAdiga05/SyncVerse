import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Terminal as TerminalIcon, X, Loader2 } from 'lucide-react';

const Terminal = forwardRef(function Terminal({ isRunning, onExecute, onClose, onClear }, ref) {
  const [entries, setEntries] = useState([]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    pushOutput(text) {
      setEntries(prev => [...prev, { type: 'stdout', text, id: Date.now() + Math.random() }]);
    },
    pushStdin(text) {
      setEntries(prev => [...prev, { type: 'stdin', text, id: Date.now() + Math.random() }]);
    },
    pushError(text) {
      setEntries(prev => [...prev, { type: 'stderr', text, id: Date.now() + Math.random() }]);
    },
    clear() {
      setEntries([]);
    },
    focus() {
      inputRef.current?.focus();
    }
  }));

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [entries]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const cmd = input;
      setEntries(prev => [...prev, { type: 'stdin', text: `$ ${cmd || '<empty>'}` }]);
      setInput('');
      if (cmd.trim()) {
        setHistory(prev => [...prev, cmd]);
        setHistoryIndex(-1);
        onExecute?.(cmd);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex >= 0) {
        const newIndex = historyIndex + 1;
        if (newIndex >= history.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(history[newIndex]);
        }
      }
    }
  };

  return (
    <div className="border-t border-[#21262d] bg-[#0d1117] shrink-0 flex flex-col" style={{ height: '240px' }}>
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#161b22] border-b border-[#21262d] shrink-0">
        <div className="flex items-center gap-2">
          <TerminalIcon size={13} className="text-[#8b949e]" />
          <span className="text-xs font-medium text-[#8b949e] uppercase tracking-wide">Terminal</span>
          {isRunning && <Loader2 size={11} className="animate-spin text-[#3fb950]" />}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setEntries([]); onClear?.(); }}
            className="px-2 py-1 rounded text-[10px] text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors"
            title="Clear terminal"
          >
            Clear
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors"
            title="Close terminal"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-3 font-mono text-xs leading-relaxed custom-scroll"
        style={{ background: '#0d1117', cursor: 'text' }}
        onClick={() => inputRef.current?.focus()}
      >
        {entries.length === 0 && (
          <div className="text-[#3d444d] mb-2">
            <span className="text-[#58a6ff]">Welcome to PairForge Terminal</span>
            <br />
            Type a command below and press <span className="text-[#8b949e]">Enter</span> to run it as stdin.
            <br />
            Click <span className="text-[#3fb950]">Run</span> in the toolbar or press <span className="text-[#8b949e]">Ctrl+Enter</span> to execute the editor code.
          </div>
        )}
        {entries.map(entry => (
          <div key={entry.id} className="whitespace-pre-wrap break-words">
            {entry.type === 'stdin' ? (
              <span className="text-[#3fb950]">{entry.text}</span>
            ) : entry.type === 'stderr' ? (
              <span className="text-[#f85149]">{entry.text}</span>
            ) : (
              <span className="text-[#e6edf3]">{entry.text}</span>
            )}
          </div>
        ))}
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[#3fb950] select-none">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isRunning}
            spellCheck={false}
            autoComplete="off"
            className="flex-1 bg-transparent border-none outline-none text-xs font-mono text-[#e6edf3] caret-[#3fb950]"
            style={{ caretColor: '#3fb950' }}
            placeholder={isRunning ? 'Running...' : 'Type command or stdin...'}
          />
        </div>
      </div>
    </div>
  );
});

export default Terminal;
