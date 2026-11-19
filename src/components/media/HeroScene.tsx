"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Color,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  Timer,
  TorusGeometry,
  WebGLRenderer,
  type BufferGeometry,
} from "three";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

/** Resolve the accent from the same CSS tokens used by the rest of the UI. */
function readAccentColor() {
  if (typeof document === "undefined") return new Color();
  const styles = getComputedStyle(document.documentElement);
  const accent = styles.getPropertyValue("--accent").trim();
  if (accent) return new Color(accent);

  const accentRgb = styles.getPropertyValue("--accent-rgb").trim();
  if (accentRgb) return new Color(`rgb(${accentRgb.split(/\s+/).join(", ")})`);

  return new Color();
}

/** Probe before THREE.WebGLRenderer so an unsupported browser gets a clean fallback. */
function canCreateWebGL2() {
  if (typeof document === "undefined") return false;
  try {
    const probe = document.createElement("canvas");
    const gl = probe.getContext("webgl2");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function HeroSceneFallback() {
  return (
    <div
      data-hero-scene-fallback
      className="pointer-events-none absolute inset-0 z-[1]"
      aria-hidden="true"
    >
      <div className="absolute start-1/2 top-1/2 h-[min(32vw,22rem)] w-[min(32vw,22rem)] -translate-x-1/2 -translate-y-1/2 rotate-[-10deg] rounded-[2rem] border border-gold/20 bg-gradient-to-br from-gold/10 via-transparent to-transparent p-8 sm:start-[62%] sm:-translate-x-0">
        <Image
          src="/brand/logo-mark.svg"
          alt=""
          width={160}
          height={134}
          unoptimized
          className="h-auto w-full opacity-70"
        />
      </div>
    </div>
  );
}

/**
 * Lightweight procedural WebGL accent for the hero. It is deliberately
 * decorative (pointer-events: none) and loaded client-only so the cinematic
 * photographic layer remains the primary LCP asset.
 */
function WebGLHeroScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  // Defer state changes out of the effect body so React can commit the canvas
  // removal cleanly before the static fallback is painted.
  const failGracefully = useCallback(() => {
    queueMicrotask(() => setFailed(true));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!canCreateWebGL2()) {
      failGracefully();
      return;
    }

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      failGracefully();
      return;
    }

    renderer.setClearColor(0x000000, 0);

    const scene = new Scene();
    const camera = new PerspectiveCamera(46, 1, 0.1, 100);
    camera.position.set(0, 0, 6);

    const group = new Group();
    group.position.set(2.35, -0.45, -4.2);
    group.rotation.set(0.2, -0.35, 0);
    scene.add(group);

    const geometries: BufferGeometry[] = [];
    const materials: MeshBasicMaterial[] = [];

    const makeMaterial = (opacity: number, wireframe = false) => {
      const material = new MeshBasicMaterial({
        color: readAccentColor(),
        transparent: true,
        opacity,
        wireframe,
      });
      materials.push(material);
      return material;
    };

    const addMesh = (
      geometry: BufferGeometry,
      material: MeshBasicMaterial,
      rotation?: [number, number, number],
      position?: [number, number, number],
    ) => {
      geometries.push(geometry);
      const mesh = new Mesh(geometry, material);
      if (rotation) mesh.rotation.set(...rotation);
      if (position) mesh.position.set(...position);
      group.add(mesh);
    };

    addMesh(
      new TorusGeometry(1.62, 0.012, 8, 128),
      makeMaterial(0.62),
      [Math.PI / 2.6, 0, 0],
    );
    addMesh(
      new TorusGeometry(1.24, 0.008, 8, 128),
      makeMaterial(0.28),
      [Math.PI / 1.85, 0.55, 0],
    );
    addMesh(new IcosahedronGeometry(0.78, 1), makeMaterial(0.22, true));
    addMesh(new SphereGeometry(0.06, 16, 16), makeMaterial(1), undefined, [0, 0, 0.02]);

    const syncAccent = () => {
      const color = readAccentColor();
      for (const material of materials) material.color.copy(color);
    };
    syncAccent();

    const resize = () => {
      const width = Math.max(1, canvas.clientWidth);
      const height = Math.max(1, canvas.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();

    const timer = new Timer();
    timer.connect(document);

    let frame = 0;
    const animate = (timestamp: number) => {
      frame = requestAnimationFrame(animate);
      timer.update(timestamp);
      group.rotation.y += timer.getDelta() * 0.09;
      group.rotation.z = Math.sin(timer.getElapsed() * 0.18) * 0.06;
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(animate);

    const themeObserver = new MutationObserver(syncAccent);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    const onContextLost = (event: Event) => {
      event.preventDefault();
      setFailed(true);
    };
    canvas.addEventListener("webglcontextlost", onContextLost, false);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(frame);
      themeObserver.disconnect();
      canvas.removeEventListener("webglcontextlost", onContextLost, false);
      window.removeEventListener("resize", resize);
      timer.disconnect();
      timer.dispose();
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    };
  }, [failGracefully]);

  if (failed) return <HeroSceneFallback />;

  return (
    <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden="true">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}

export default function HeroScene() {
  return (
    <ErrorBoundary fallback={<HeroSceneFallback />}>
      <WebGLHeroScene />
    </ErrorBoundary>
  );
}
