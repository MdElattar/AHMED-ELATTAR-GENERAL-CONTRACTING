"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useSyncExternalStore } from "react";
import type { Group } from "three";
import { Color } from "three";

/**
 * Three.js needs a concrete `Color`, so read the semantic accent token the
 * global theme painted on <html> instead of keeping a second hardcoded
 * palette in the 3D scene. The observer keeps the WebGL material in sync when
 * the visitor switches themes.
 */
function subscribeToTheme(onChange: () => void) {
  if (typeof document === "undefined") return () => {};
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function readAccent() {
  if (typeof document === "undefined") return "";
  return getComputedStyle(document.documentElement)
    .getPropertyValue("--accent")
    .trim();
}

function useAccentColor() {
  const accent = useSyncExternalStore(subscribeToTheme, readAccent, () => "");
  return useMemo(() => new Color(accent), [accent]);
}

/**
 * Lightweight procedural WebGL accent for the hero. It is deliberately
 * decorative (pointer-events: none) and loaded client-only so the cinematic
 * photographic layer remains the primary LCP asset.
 */
function ArchitecturalOrbit() {
  const group = useRef<Group>(null);
  const accent = useAccentColor();

  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.09;
    group.current.rotation.z = Math.sin(clock.elapsedTime * 0.18) * 0.06;
  });

  return (
    <group ref={group} position={[2.35, -0.45, -4.2]} rotation={[0.2, -0.35, 0]}>
      <mesh rotation={[Math.PI / 2.6, 0, 0]}>
        <torusGeometry args={[1.62, 0.012, 8, 128]} />
        <meshBasicMaterial color={accent} transparent opacity={0.62} />
      </mesh>
      <mesh rotation={[Math.PI / 1.85, 0.55, 0]}>
        <torusGeometry args={[1.24, 0.008, 8, 128]} />
        <meshBasicMaterial color={accent} transparent opacity={0.28} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[0.78, 1]} />
        <meshBasicMaterial color={accent} wireframe transparent opacity={0.22} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshBasicMaterial color={accent} />
      </mesh>
    </group>
  );
}

export default function HeroScene() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 6], fov: 46 }}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      >
        <ArchitecturalOrbit />
      </Canvas>
    </div>
  );
}
