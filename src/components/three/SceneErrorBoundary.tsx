"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type SceneErrorBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
};

type SceneErrorBoundaryState = {
  failed: boolean;
};

/**
 * Contains failures from a WebGL scene.
 *
 * A GPU reset, a driver blocklist, a lost context or a low-memory device can
 * make the renderer throw during mount. Without a boundary that error bubbles
 * up to the route error boundary, which unmounts the whole section. When that
 * section is pinned, GSAP has already moved it into a `.pin-spacer`, so
 * React's `removeChild` fails and the rest of the page is left half-rendered.
 *
 * Keeping the failure local to the canvas means the section (and its pin)
 * survives and simply falls back to the static artwork.
 */
export class SceneErrorBoundary extends Component<
  SceneErrorBoundaryProps,
  SceneErrorBoundaryState
> {
  state: SceneErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): SceneErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("3D scene failed; using the static fallback.", error, info.componentStack);
    }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
