'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="app-canvas flex min-h-dvh items-center justify-center p-5 text-center">
          <div className="depth-panel max-w-md rounded-2xl p-7 sm:p-9">
            <span className="data-type text-[10px] font-semibold uppercase tracking-[0.15em] text-destructive">
              Session interrupted
            </span>
            <h2 className="display-type mt-3 text-xl font-semibold tracking-[-0.03em] text-foreground">
              The interview workspace could not load.
            </h2>
            <p className="mb-6 mt-3 text-sm leading-6 text-muted-foreground">
              Refresh the workspace to reconnect the presentation layer and voice session.
            </p>
            <Button className="h-11 w-full rounded-xl" onClick={() => window.location.reload()}>
              Refresh workspace
            </Button>
          </div>
        </div>
      );
    }

    // Happy path: render the wrapped conversation subtree unchanged.
    return this.props.children;
  }
}
