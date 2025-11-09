"use client";

import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
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
    // Filter out third-party extension errors
    if (
      error.message.includes("ethereum") ||
      error.message.includes("crypto") ||
      error.message.includes("wallet")
    ) {
      console.warn("Browser extension error caught and ignored:", error);
      // Reset the error boundary for extension errors
      this.setState({ hasError: false });
      return;
    }

    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Only show error UI for non-extension errors
      if (
        !this.state.error.message.includes("ethereum") &&
        !this.state.error.message.includes("crypto") &&
        !this.state.error.message.includes("wallet")
      ) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
            <div className="max-w-md w-full bg-zinc-900 border border-white/10 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-red-400 mb-2">
                Something went wrong
              </h2>
              <p className="text-sm text-zinc-400 mb-4">
                {this.state.error.message}
              </p>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        );
      }
    }

    return this.props.children;
  }
}
