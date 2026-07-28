import { Component } from 'react';
import { Terminal, ArrowLeft, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#f85149]/10 border border-[#f85149]/20 flex items-center justify-center mb-6">
            <Terminal size={28} className="text-[#f85149]" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
          <p className="text-sm text-[#8b949e] max-w-md mb-6">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-md text-sm transition-colors"
            >
              <ArrowLeft size={14} /> Go Home
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#58a6ff] hover:bg-[#4793e5] text-[#0d1117] rounded-md text-sm font-semibold transition-colors"
            >
              <RefreshCw size={14} /> Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
