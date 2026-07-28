import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, description, children, actions, icon, width = 'max-w-md' }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
      prev?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className={`relative w-full ${width} bg-[#161b22] border border-[#30363d] rounded-xl p-6 shadow-2xl`}
        style={{ animation: 'toast-in 0.2s ease' }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0">
                {icon}
              </div>
            )}
            <div>
              <h2 className="text-[#e6edf3] text-sm font-semibold">{title}</h2>
              {description && <p className="text-xs text-[#8b949e] mt-0.5">{description}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3] transition-colors" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {children}

        {actions && (
          <div className="flex gap-3 pt-4 border-t border-[#21262d] mt-4">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
