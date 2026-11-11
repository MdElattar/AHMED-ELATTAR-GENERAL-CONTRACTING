"use client";

import { Suspense, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, Sparkles } from "@react-three/drei";
import { useCanvasVisibility } from "@/components/three/useCanvasVisibility";
import {
  SCENE_DPR,
  SCENE_GL,
  SCENE_PERFORMANCE,
  configureRenderer,
  revealAfterFirstFrame,
} from "@/components/three/config";
import { smoothstep } from "@/lib/utils";

function FleetRig({ progressRef }: { progressRef: MutableRefObject<number> }) {
  const group = useRef<THREE.Group | null>(null);
  const boom = useRef<THREE.Group | null>(null);
  const arm = useRef<THREE.Group | null>(null);
  const bucket = useRef<THREE.Group | null>(null);

  useFrame((state) => {
    const progress = THREE.MathUtils.clamp(progressRef.current, 0, 1);
    const t = state.clock.elapsedTime;
    if (group.current) {
      group.current.rotation.y = -0.5 + progress * Math.PI * 1.25;
      group.current.position.y = Math.sin(t * 0.6) * 0.03;
    }
    if (boom.current) {
      boom.current.rotation.z = -0.72 + progress * 0.72 + Math.sin(t * 0.55) * 0.025;
    }
    if (arm.current) {
      arm.current.rotation.z = 0.86 - progress * 0.9 + Math.sin(t * 0.7) * 0.035;
    }
    if (bucket.current) {
      bucket.current.rotation.z = -0.4 + progress * 0.55;
    }
  });

  return (
    <group ref={group} position={[0, -2.4, 0]}>
      {/* Tracks */}
      <mesh position={[-1.05, -0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.62, 0.62, 3.2]} />
        <meshStandardMaterial color="#14171c" roughness={0.78} metalness={0.42} />
      </mesh>
      <mesh position={[1.05, -0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.62, 0.62, 3.2]} />
        <meshStandardMaterial color="#14171c" roughness={0.78} metalness={0.42} />
      </mesh>
      {Array.from({ length: 7 }).map((_, index) => (
        <mesh
          key={`track-${index}`}
          position={[0, -0.35, -1.25 + index * 0.42]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry args={[0.35, 0.35, 2.35, 18]} />
          <meshStandardMaterial color="#242931" roughness={0.7} metalness={0.5} />
        </mesh>
      ))}

      {/* Base and cab */}
      <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.18, 1.28, 0.4, 12]} />
        <meshStandardMaterial color="#c9a45c" roughness={0.36} metalness={0.72} />
      </mesh>
      <mesh position={[0, 0.62, 0.35]} castShadow receiveShadow>
        <boxGeometry args={[1.9, 0.95, 1.9]} />
        <meshStandardMaterial color="#d8b46b" roughness={0.42} metalness={0.58} />
      </mesh>
      <mesh position={[0.35, 1.25, 0.5]} castShadow receiveShadow>
        <boxGeometry args={[1.05, 0.95, 1.15]} />
        <meshStandardMaterial color="#11151a" roughness={0.28} metalness={0.7} />
      </mesh>
      <mesh position={[0.35, 1.28, 1.09]}>
        <boxGeometry args={[0.82, 0.62, 0.03]} />
        <meshStandardMaterial color="#5f8394" roughness={0.1} metalness={0.2} emissive="#213b46" emissiveIntensity={0.7} />
      </mesh>

      {/* Boom assembly */}
      <group ref={boom} position={[0.15, 1.05, -0.1]}>
        <mesh position={[0, 0.55, -1.45]} rotation={[0.58, 0, 0]} castShadow>
          <boxGeometry args={[0.38, 0.38, 3.2]} />
          <meshStandardMaterial color="#c9a45c" roughness={0.34} metalness={0.76} />
        </mesh>
        <group ref={arm} position={[0, 1.15, -2.9]}>
          <mesh position={[0, -0.55, -1.25]} rotation={[-0.7, 0, 0]} castShadow>
            <boxGeometry args={[0.26, 0.26, 2.8]} />
            <meshStandardMaterial color="#d8b46b" roughness={0.32} metalness={0.8} />
          </mesh>
          <group ref={bucket} position={[0, -1.22, -2.55]}>
            <mesh castShadow>
              <boxGeometry args={[0.9, 0.58, 0.82]} />
              <meshStandardMaterial color="#242a32" roughness={0.55} metalness={0.62} />
            </mesh>
            <mesh position={[0, -0.24, -0.18]} rotation={[0.2, 0, 0]} castShadow>
              <boxGeometry args={[0.86, 0.12, 0.7]} />
              <meshStandardMaterial color="#c9a45c" roughness={0.38} metalness={0.75} />
            </mesh>
          </group>
        </group>
      </group>

      {/* Warning beacon */}
      <mesh position={[0, 1.8, 0.2]}>
        <cylinderGeometry args={[0.08, 0.11, 0.16, 12]} />
        <meshStandardMaterial color="#f0c25e" emissive="#f0a030" emissiveIntensity={2.2} />
      </mesh>
    </group>
  );
}

function Hauler({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[0, 0.55, 0]}>
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.42, 3.2]} />
        <meshStandardMaterial color="#171b21" roughness={0.7} metalness={0.48} />
      </mesh>
      <mesh position={[0, 0.85, 0.55]} castShadow>
        <boxGeometry args={[1.65, 0.8, 1.4]} />
        <meshStandardMaterial color="#c9a45c" roughness={0.4} metalness={0.62} />
      </mesh>
      <mesh position={[0, 0.82, -1.05]} castShadow>
        <boxGeometry args={[1.9, 0.75, 1.9]} />
        <meshStandardMaterial color="#242a32" roughness={0.62} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.82, -0.1]}>
        <boxGeometry args={[1.5, 0.5, 0.04]} />
        <meshStandardMaterial color="#5f8394" roughness={0.1} metalness={0.3} emissive="#213b46" emissiveIntensity={0.6} />
      </mesh>
      {[-0.82, 0.82].flatMap((x) =>
        [-1.05, 1.05].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.1, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.38, 0.38, 0.3, 16]} />
            <meshStandardMaterial color="#111419" roughness={0.8} metalness={0.4} />
          </mesh>
        )),
      )}
    </group>
  );
}

function Skyline() {
  const blocks = useMemo(
    () => [
      [-10, -8, 3.5, 5, 3.2],
      [-7, -12, 2.2, 8, 2.6],
      [-4, -15, 2.8, 4.5, 2.2],
      [2, -14, 3.2, 7, 3],
      [7, -11, 2.4, 10, 2.4],
      [11, -7, 3.6, 4, 3.4],
      [15, -3, 2.6, 6, 2.8],
    ],
    [],
  );

  return (
    <group>
      {blocks.map(([x, z, width, height, depth], index) => (
        <group key={index} position={[x, -4.8, z]}>
          <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial color={index % 2 ? "#101318" : "#151a20"} roughness={0.82} metalness={0.24} />
          </mesh>
          <mesh position={[0, height * 0.62, depth / 2 + 0.01]}>
            <boxGeometry args={[width * 0.72, height * 0.08, 0.03]} />
            <meshBasicMaterial color="#c9a45c" transparent opacity={0.26} />
          </mesh>
          <mesh position={[0, height * 0.4, depth / 2 + 0.01]}>
            <boxGeometry args={[width * 0.52, height * 0.05, 0.03]} />
            <meshBasicMaterial color="#c9a45c" transparent opacity={0.16} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function FleetCamera({ progressRef }: { progressRef: MutableRefObject<number> }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, -1.2, 0));
  const desired = useRef(new THREE.Vector3());
  // Reused every frame: allocating vectors inside useFrame would churn the
  // garbage collector at 60fps and cause visible frame spikes.
  const look = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const p = THREE.MathUtils.clamp(progressRef.current, 0, 1);
    const angle = -0.8 + p * 1.9;
    const radius = 14.5 - p * 3.1;
    desired.current.set(
      Math.sin(angle) * radius,
      4.1 + Math.sin(p * Math.PI) * 1.7,
      Math.cos(angle) * radius,
    );
    const damp = 1 - Math.exp(-delta * 2);
    camera.position.lerp(desired.current, damp);
    look.current.set(0, -1.1 + smoothstep(0, 1, p) * 0.35, -0.6);
    target.current.lerp(look.current, damp);
    camera.lookAt(target.current);
  });

  return null;
}

export default function FleetScene({
  progressRef,
  onReady,
}: {
  progressRef: MutableRefObject<number>;
  onReady?: () => void;
}) {
  const reduced = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const visible = useCanvasVisibility(hostRef);

  return (
    <div ref={hostRef} className="!absolute inset-0">
      <Canvas
        shadows
        dpr={SCENE_DPR.fleet}
        performance={SCENE_PERFORMANCE}
        frameloop={visible ? "always" : "never"}
        gl={SCENE_GL}
        camera={{ position: [10, 4.8, 15], fov: 35, near: 0.1, far: 90 }}
        className="!absolute inset-0"
        onCreated={({ gl }) => {
          configureRenderer(gl, SCENE_DPR.fleet[1]);
          revealAfterFirstFrame(onReady);
        }}
      >
        <fog attach="fog" args={["#060708", 24, 72]} />
        <ambientLight intensity={0.28} />
        <hemisphereLight args={["#66727c", "#08090b", 0.42]} />
        <directionalLight
          position={[12, 18, 10]}
          intensity={2.7}
          color="#ffe0aa"
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
          shadow-camera-near={1}
          shadow-camera-far={55}
          shadow-bias={-0.0005}
          shadow-normalBias={0.025}
        />
        <spotLight
          position={[-10, 8, 8]}
          angle={0.55}
          penumbra={1}
          intensity={140}
          distance={40}
          color="#c9a45c"
        />
        <pointLight position={[7, 2, -6]} intensity={36} color="#5f8394" distance={26} />

        <Suspense fallback={null}>
          <Environment resolution={64} frames={1}>
            <Lightformer form="rect" intensity={2.2} color="#ffd7a0" position={[0, 14, -18]} scale={[22, 8, 1]} />
            <Lightformer form="rect" intensity={1} color="#5f8394" position={[-18, 5, 8]} scale={[12, 12, 1]} />
            <Lightformer form="rect" intensity={0.8} color="#c9a45c" position={[18, 3, 6]} scale={[8, 8, 1]} />
          </Environment>
          <FleetRig progressRef={progressRef} />
          <Hauler position={[4.2, -4.8, -2.4]} />
          <Skyline />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5.05, 0]} receiveShadow>
            <circleGeometry args={[11.5, 72]} />
            <meshStandardMaterial color="#0a0c10" roughness={0.84} metalness={0.22} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5.02, 0]}>
            <ringGeometry args={[11.2, 11.5, 96]} />
            <meshBasicMaterial color="#c9a45c" transparent opacity={0.32} />
          </mesh>
          <gridHelper args={[44, 44, "#3a2f1d", "#15181d"]} position={[0, -5.04, 0]} />
          <Sparkles count={60} scale={[26, 14, 26]} position={[0, 2, -2]} size={1.2} speed={reduced ? 0 : 0.2} opacity={0.28} color="#c9a45c" />
          <ContactShadows frames={1} position={[0, -5.02, 0]} opacity={0.6} scale={30} blur={2.4} far={12} color="#000000" />
        </Suspense>
        <FleetCamera progressRef={progressRef} />
      </Canvas>
    </div>
  );
}
