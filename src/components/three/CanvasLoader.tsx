"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { SceneErrorBoundary } from "@/components/three/SceneErrorBoundary";
import { SCENE_READY_TIMEOUT } from "@/components/three/config";

// The procedural fallback is rendered by `SceneGate` while these chunks load,
// so the dynamic `loading` slot can stay empty instead of stacking two
// identical fallbacks on top of each other.
const HeroScene = dynamic(() => import("@/components/three/HeroScene"), {
  ssr: false,
  loading: () => null,
});

const ScrollScene = dynamic(() => import("@/components/three/ScrollCraneScene"), {
  ssr: false,
  loading: () => null,
});

const FleetScene = dynamic(() => import("@/components/three/FleetScene"), {
  ssr: false,
  loading: () => null,
});

/**
 * Static, always-available artwork.
 *
 * It is intentionally transparent: the section's photographic layer lives
 * behind the canvas, so while the renderer initialises (or if WebGL is
 * unavailable) the visitor still sees the golden-hour site photography rather
 * than a dark wireframe placeholder. Only a warm horizon glow and a progress
 * hairline are painted on top.
 */
export function SceneFallback() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 65% 45%, rgb(var(--atmo-glow) / 0.16), transparent 58%)",
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-obsidian/80 to-transparent" />
      <div className="absolute bottom-8 left-1/2 h-px w-40 -translate-x-1/2 overflow-hidden bg-white/10">
        <div className="h-full w-1/2 animate-pulse bg-gold" />
      </div>
    </div>
  );
}

function detectWebGL() {
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;

    if (!gl) return false;

    // The probe canvas is thrown away immediately. Explicitly losing the
    // context frees one of the browser's limited GPU context slots instead of
    // leaving it for the garbage collector, which matters on route changes
    // where several scenes mount and unmount.
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
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

type SceneGateProps = {
  children: (onReady: () => void) => ReactNode;
  fallback: ReactNode;
};

/**
 * Non-blocking scene loader.
 *
 * The procedural fallback is painted from the very first render, so the
 * section never waits on a canvas to look complete. The scene reports back
 * once its renderer exists (`onCreated`); until then the fallback stays on top.
 *
 * A 1.5s watchdog marks the scene as stalled and keeps the procedural
 * fallback in place. The scene is intentionally *not* unmounted: a slow chunk
 * may still finish after the watchdog, and a late `onReady` upgrades the
 * section from the wireframe to the full renderer. The user never waits on a
 * blank canvas, and a slow connection still gets the 3D once it arrives.
 */
function SceneGate({ children, fallback }: SceneGateProps) {
  const [status, setStatus] = useState<"loading" | "ready" | "timeout">("loading");

  useEffect(() => {
    if (status !== "loading") return;

    const timer = window.setTimeout(() => {
      setStatus((current) => (current === "loading" ? "timeout" : current));
    }, SCENE_READY_TIMEOUT);

    return () => window.clearTimeout(timer);
  }, [status]);

  const handleReady = useCallback(() => {
    setStatus("ready");
  }, []);

  return (
    <div className="absolute inset-0" data-scene-state={status}>
      {children(handleReady)}
      {status !== "ready" ? (
        <div className="absolute inset-0" aria-hidden="true">
          {fallback}
        </div>
      ) : null}
    </div>
  );
}

export function HeroCanvas() {
  const webgl = useWebGLSupport();

  if (!webgl) return <SceneFallback />;

  return (
    <SceneGate fallback={<SceneFallback />}>
      {(onReady) => (
        <SceneErrorBoundary fallback={<SceneFallback />}>
          <HeroScene onReady={onReady} />
        </SceneErrorBoundary>
      )}
    </SceneGate>
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
        <SceneGate fallback={<SceneFallback />}>
          {(onReady) => (
            <SceneErrorBoundary fallback={<SceneFallback />}>
              <ScrollScene progressRef={progressRef} onReady={onReady} />
            </SceneErrorBoundary>
          )}
        </SceneGate>
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
        <SceneGate fallback={<SceneFallback />}>
          {(onReady) => (
            <SceneErrorBoundary fallback={<SceneFallback />}>
              <FleetScene progressRef={progressRef} onReady={onReady} />
            </SceneErrorBoundary>
          )}
        </SceneGate>
      ) : (
        <SceneFallback />
      )}
    </div>
  );
}
