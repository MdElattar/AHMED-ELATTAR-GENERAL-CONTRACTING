"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";

type Props = {
  children: ReactNode;
  label?: string;
};

type State = {
  hasError: boolean;
};

export class AdminSectionBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[admin-section-boundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 border border-danger/20 bg-danger/10/40 px-6 py-14 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-danger/30 bg-danger/10 text-danger">
            <AlertCircle className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[0.92rem] font-medium text-fg">
              {this.props.label ?? "Section"} failed to load
            </p>
            <p className="mt-1.5 text-[0.76rem] leading-relaxed text-fg">
              This section encountered an error. Other admin tools remain available.
            </p>
          </div>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="inline-flex h-10 items-center gap-2 border border-line px-4 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-fg transition-colors hover:border-accent/40 hover:text-accent"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
