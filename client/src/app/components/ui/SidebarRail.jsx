import { MessageSquare, Bot } from 'lucide-react';

const TABS = [
  { id: 'chat', icon: MessageSquare, label: 'Chat', activeColor: '#58a6ff', hoverBg: 'rgba(88,166,255,0.08)' },
  { id: 'ai', icon: Bot, label: 'AI', activeColor: '#a371f7', hoverBg: 'rgba(163,113,247,0.08)' },
];

export default function SidebarRail({ activeTab, onTabChange, unreadCount }) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-2.5 px-1 bg-[#161b22] border-l border-[#21262d] shrink-0 min-w-[44px]">
      {TABS.map(({ id, icon: Icon, label, activeColor }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className="icon-rail-btn"
            style={{
              color: isActive ? activeColor : undefined,
              background: isActive ? `${activeColor}12` : undefined,
            }}
          >
            <Icon size={14} />
            <span className="icon-rail-label" style={{ color: isActive ? activeColor : undefined }}>
              {label}
            </span>
            {isActive && (
              <span
                className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-3.5 rounded-r-full"
                style={{ background: activeColor }}
              />
            )}
            {id === 'chat' && unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: activeColor }} />
            )}
          </button>
        );
      })}
    </div>
  );
}
