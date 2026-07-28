import { MessageSquare, Zap } from 'lucide-react';

const TABS = [
  { id: 'chat', icon: MessageSquare, color: '#58a6ff' },
  { id: 'ai', icon: Zap, color: '#a371f7' },
];

export default function SidebarRail({ activeTab, onTabChange, unreadCount }) {
  return (
    <div className="flex flex-col items-center gap-1 py-2 px-1 bg-[#161b22] border-l border-[#21262d] shrink-0">
      {TABS.map(({ id, icon: Icon, color }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className="icon-rail-btn relative"
            aria-label={id === 'chat' ? 'Chat' : 'AI Review'}
            title={id === 'chat' ? 'Chat' : 'AI Review'}
          >
            <Icon size={16} />
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-r-full" style={{ background: color }} />
            )}
            {id === 'chat' && unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#58a6ff]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
