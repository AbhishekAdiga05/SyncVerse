import { useState, useEffect, useRef, useCallback } from 'react';
import { Command } from 'cmdk';
import { Terminal, Save, Play, MessageSquare, Zap, PenTool, HelpCircle, LogOut, Copy, Search } from 'lucide-react';

export default function CommandPalette({ open, onClose, actions }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'toast-in 0.15s ease' }}
      >
        <Command label="Command palette">
          <div className="flex items-center gap-2 px-4 border-b border-[#21262d]">
            <Search size={14} className="text-[#8b949e] shrink-0" />
            <Command.Input
              ref={inputRef}
              placeholder="Search commands…"
              className="w-full py-3 bg-transparent text-sm text-[#e6edf3] placeholder:text-[#3d444d] focus:outline-none"
            />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto p-2 custom-scroll">
            <Command.Empty className="py-8 text-center text-sm text-[#8b949e]">
              No results found.
            </Command.Empty>
            {actions.map((group, i) => (
              <div key={i}>
                {group.label && (
                  <Command.Group heading={group.label}>
                    {group.items.map((item) => (
                      <Command.Item
                        key={item.id}
                        onSelect={() => { item.onAction(); onClose(); }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#e6edf3] cursor-pointer transition-colors aria-selected:bg-[#21262d]"
                      >
                        <span className="text-[#8b949e] shrink-0">{item.icon}</span>
                        <span className="flex-1">{item.label}</span>
                        {item.shortcut && (
                          <kbd className="px-1.5 py-0.5 bg-[#0d1117] border border-[#30363d] rounded text-[10px] font-mono text-[#8b949e]">{item.shortcut}</kbd>
                        )}
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}
              </div>
            ))}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
