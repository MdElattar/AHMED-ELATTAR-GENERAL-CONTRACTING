"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useRef, useState, type MutableRefObject } from "react";
import { SceneErrorBoundary } from "@/components/three/SceneErrorBoundary";

const HeroScene = dynamic(() => import("@/components/three/HeroScene"), {
  ssr: false,
  loading: () => <SceneFallback />,
});

const ScrollScene = dynamic(() => import("@/components/three/ScrollCraneScene"), {
  ssr: false,
  loading: () => <SceneFallback />,
});

const FleetScene = dynamic(() => import("@/components/three/FleetScene"), {
  ssr: false,
  loading: () => <SceneFallback />,
});

export function SceneFallback() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-obsidian">
      <div className="blueprint-grid absolute inset-0 opacity-50" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 65% 45%, rgba(201,164,92,0.14), transparent 55%)",
        }}
      />
      <div className="absolute left-1/2 top-1/2 h-px w-40 -translate-x-1/2 -translate-y-1/2 overflow-hidden bg-white/10">
        <div className="h-full w-1/2 animate-pulse bg-gold" />
      </div>
    </div>
  );
}

function detectWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl"),
    );
  } catch {
    return false;
  }
}

/**
 * Skips mounting a renderer on devices where WebGL is unavailable (hardware
 * acceleration disabled, driver blocklist, locked-down webviews). Creating the
 * context eagerly and letting three.js throw is what used to take the pinned
 * section down with it.
 */
function useWebGLSupport() {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    // WebGL availability is only knowable in the browser; keeping this in an
    // effect avoids a hydration mismatch between the static fallback and the
    // renderer.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(detectWebGL());
  }, []);

  return supported;
}

export function HeroCanvas() {
  const webgl = useWebGLSupport();

  return (
    <Suspense fallback={<SceneFallback />}>
      {webgl ? (
        <SceneErrorBoundary fallback={<SceneFallback />}>
          <HeroScene />
        </SceneErrorBoundary>
      ) : (
        <SceneFallback />
      )}
    </Suspense>
  );
}

export function ScrollCraneCanvas({
  progressRef,
}: {
  progressRef: MutableRefObject<number>;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const webgl = useWebGLSupport();

  useEffect(() => {
    if (mounted) return;
    const host = hostRef.current;
    if (!host) return;

    if (typeof IntersectionObserver === "undefined") {
      const timer = window.setTimeout(() => setMounted(true), 0);
      return () => window.clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setMounted(true);
          observer.disconnect();
        }
      },
      { rootMargin: "800px 0px" },
    );

    observer.observe(host);
    return () => observer.disconnect();
  }, [mounted]);

  return (
    <div ref={hostRef} className="absolute inset-0">
      {mounted && webgl ? (
        <Suspense fallback={<SceneFallback />}>
          <SceneErrorBoundary fallback={<SceneFallback />}>
            <ScrollScene progressRef={progressRef} />
          </SceneErrorBoundary>
        </Suspense>
      ) : (
        <SceneFallback />
      )}
    </div>
  );
}

export function FleetCanvas({
  progressRef,
}: {
  progressRef: MutableRefObject<number>;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const webgl = useWebGLSupport();

  useEffect(() => {
    if (mounted) return;
    const host = hostRef.current;
    if (!host) return;

    if (typeof IntersectionObserver === "undefined") {
      const timer = window.setTimeout(() => setMounted(true), 0);
      return () => window.clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setMounted(true);
          observer.disconnect();
        }
      },
      { rootMargin: "900px 0px" },
    );

    observer.observe(host);
    return () => observer.disconnect();
  }, [mounted]);

  return (
    <div ref={hostRef} className="absolute inset-0">
      {mounted && webgl ? (
        <Suspense fallback={<SceneFallback />}>
          <SceneErrorBoundary fallback={<SceneFallback />}>
            <FleetScene progressRef={progressRef} />
          </SceneErrorBoundary>
        </Suspense>
      ) : (
        <SceneFallback />
      )}
    </div>
  );
}
