import React from 'react';
import { AlertTriangle, RotateCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-card p-8 text-center border border-rose-500/30 shadow-2xl shadow-rose-950/40">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto mb-4 text-rose-400">
              <AlertTriangle className="w-7 h-7 animate-pulse" />
            </div>
            
            <h2 className="font-heading font-black text-2xl text-white mb-2">
              Something went wrong
            </h2>
            
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              {this.state.error?.message || 'An unexpected client error occurred while rendering the page.'}
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReload}
                className="btn-primary text-xs py-2.5 px-4"
              >
                <RotateCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="btn-secondary text-xs py-2.5 px-4"
              >
                <Home className="w-4 h-4" />
                <span>Return Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
