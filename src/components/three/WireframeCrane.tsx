"use client";

/**
 * Procedural wireframe crane used while a full 3D scene is still creating its
 * renderer. It is intentionally the cheapest thing we can draw:
 *
 * - `WireframeCrane3D` lives inside a `<Canvas>` and is the Suspense fallback
 *   for the heavy model/environment. It uses wireframe box geometry only, so
 *   it paints on the very first frame even on a weak GPU.
 * - `WireframeCraneMark` is the HTML/SVG fallback shown before the canvas
 *   chunk arrives (or when WebGL is unavailable). It gives the loader real
 *   "kinematics" instead of a blank box or an indeterminate spinner.
 */
export function WireframeCrane3D() {
  return (
    <group position={[0, -5, 0]} rotation={[0, -0.45, 0]}>
      {/* Mast */}
      <mesh position={[0, 5.5, 0]}>
        <boxGeometry args={[1.15, 11, 1.15]} />
        <meshBasicMaterial color="#c9a45c" wireframe transparent opacity={0.5} />
      </mesh>

      {/* Base */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[3.1, 0.4, 3.1]} />
        <meshBasicMaterial color="#c9a45c" wireframe transparent opacity={0.32} />
      </mesh>

      {/* Jib */}
      <mesh position={[5.4, 11, 0]}>
        <boxGeometry args={[12.2, 0.5, 0.5]} />
        <meshBasicMaterial color="#c9a45c" wireframe transparent opacity={0.48} />
      </mesh>

      {/* Counter-jib and counterweight */}
      <mesh position={[-2.7, 11, 0]}>
        <boxGeometry args={[4.8, 0.45, 0.45]} />
        <meshBasicMaterial color="#c9a45c" wireframe transparent opacity={0.34} />
      </mesh>
      <mesh position={[-4.4, 9.8, 0]}>
        <boxGeometry args={[1.1, 1.6, 1.3]} />
        <meshBasicMaterial color="#c9a45c" wireframe transparent opacity={0.28} />
      </mesh>

      {/* Tower peak and stays */}
      <mesh position={[0, 12.2, 0]}>
        <boxGeometry args={[0.35, 2.4, 0.35]} />
        <meshBasicMaterial color="#d4af68" wireframe transparent opacity={0.4} />
      </mesh>

      {/* Trolley, hoist cable and hook block */}
      <mesh position={[9.4, 10.6, 0]}>
        <boxGeometry args={[1.1, 0.32, 0.6]} />
        <meshBasicMaterial color="#d4af68" wireframe transparent opacity={0.55} />
      </mesh>
      <mesh position={[9.4, 6.6, 0]}>
        <boxGeometry args={[0.09, 7.6, 0.09]} />
        <meshBasicMaterial color="#d4af68" transparent opacity={0.55} />
      </mesh>
      <mesh position={[9.4, 2.5, 0]}>
        <boxGeometry args={[1.1, 0.6, 0.6]} />
        <meshBasicMaterial color="#d4af68" wireframe transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

export function WireframeCraneMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 220"
      className={className}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <g
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Ground */}
        <path d="M18 198h284" opacity="0.35" />

        {/* Mast rails + lattice */}
        <path d="M96 198V54M124 198V54" />
        <path
          d="M96 76l28 22M96 120l28 22M96 164l28 22M124 76l-28 22M124 120l-28 22M124 164l-28 22"
          opacity="0.55"
        />

        {/* Base */}
        <path d="M78 198h64M84 188h52" opacity="0.8" />
        <path d="M84 188l12 10M132 188l-12 10" opacity="0.45" />

        {/* Slewing platform + cab */}
        <path d="M88 54h44" />
        <path d="M126 58h19v15h-19z" opacity="0.75" />

        {/* Jib chords + lattice */}
        <path d="M124 54h162M124 68h162" opacity="0.85" />
        <path
          d="M124 68l26-14 26 14 26-14 26 14 26-14 26 14 26-14 22 14"
          opacity="0.5"
        />

        {/* Counter-jib + counterweight */}
        <path d="M96 54H48M96 68H48" opacity="0.8" />
        <path d="M96 68l-24-14-24 14" opacity="0.45" />
        <path d="M40 68h16v20H40z" opacity="0.65" />

        {/* Peak and stays */}
        <path d="M110 54V32" />
        <path d="M110 32l176 22M110 32L48 54" opacity="0.55" />

        {/* Trolley, hoist cable, hook */}
        <path d="M244 62h17v7h-17z" opacity="0.8" />
        <path d="M252 69v82" opacity="0.7" />
        <path d="M244 151h16v13h-16z" opacity="0.8" />
        <path d="M252 164v7a5 5 0 1 0 5 5" opacity="0.7" />

        {/* Distant skyline */}
        <path
          d="M188 198v-26h22v26M216 198v-38h18v38M240 198v-20h15v20M261 198v-32h20v32M287 198v-24h13v24"
          opacity="0.22"
        />
      </g>
    </svg>
  );
}
