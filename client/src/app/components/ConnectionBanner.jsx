import { WifiOff, RefreshCw } from 'lucide-react';

export default function ConnectionBanner({ connected, onReconnect }) {
  if (connected) return null;

  return (
    <div className="connection-banner" role="alert">
      <WifiOff size={14} />
      <span>Connection lost. Changes will sync when you reconnect.</span>
      <button onClick={onReconnect}>
        <RefreshCw size={12} /> Reconnect
      </button>
    </div>
  );
}
