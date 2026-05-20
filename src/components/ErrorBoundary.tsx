// src/components/ErrorBoundary.tsx
import React from 'react';
import { AlertTriangle, RefreshCw, Copy } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private copyError = () => {
    if (!this.state.error) return;

    const errorText = `Error: ${this.state.error.message}\nStack: ${this.state.error.stack || 'No stack available'}`;
    navigator.clipboard.writeText(errorText).then(() => {
      toast.success('Error details copied to clipboard');
    });
  };

  private reload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex min-h-[400px] items-center justify-center p-6">
            <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-zinc-900 p-8 shadow-xl">
              <div className="flex flex-col items-center text-center">
                {/* Icon */}
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                  <AlertTriangle className="h-10 w-10 text-red-500" />
                </div>

                <h2 className="mb-2 text-2xl font-semibold text-white">Something went wrong</h2>

                <p className="mb-8 text-zinc-400">
                  An unexpected error occurred while rendering this part of the application.
                </p>

                {/* Action Buttons */}
                <div className="flex w-full flex-col gap-3 sm:flex-row">
                  <button
                    onClick={this.reload}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-medium text-zinc-900 transition-colors hover:bg-zinc-200"
                  >
                    <RefreshCw className="h-5 w-5" />
                    Reload Application
                  </button>

                  <button
                    onClick={this.copyError}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-700 px-6 py-3 font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
                  >
                    <Copy className="h-5 w-5" />
                    Copy Error Details
                  </button>
                </div>

                <p className="mt-8 text-xs text-zinc-500">
                  This error has been logged to the console.
                </p>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
