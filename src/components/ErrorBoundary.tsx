import React, { ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error in component:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[280px] p-6 flex flex-col items-center justify-center text-center bg-slate-900 text-white rounded-2xl border border-red-500/30 m-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold mb-1">
            {this.props.fallbackTitle || 'Unable to display this view'}
          </h3>
          <p className="text-xs text-slate-300 max-w-md mb-4 font-mono">
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0984E3] hover:bg-[#0770c2] text-white text-xs font-bold rounded-xl shadow transition active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry / Recover View</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition active:scale-95 cursor-pointer"
            >
              <span>Refresh App</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
