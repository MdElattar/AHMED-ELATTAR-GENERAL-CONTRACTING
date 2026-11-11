"use client";

import { Suspense, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, Sparkles } from "@react-three/drei";
import { CraneModel } from "@/components/three/CraneModel";
import { Cityscape } from "@/components/three/Cityscape";
import {
  SCENE_DPR,
  SCENE_GL,
  SCENE_PERFORMANCE,
  configureRenderer,
  revealAfterFirstFrame,
} from "@/components/three/config";
import { useCanvasVisibility } from "@/components/three/useCanvasVisibility";
import { WireframeCrane3D } from "@/components/three/WireframeCrane";
import { smoothstep } from "@/lib/utils";

const CAMERA_KEYS = [
  {
    position: new THREE.Vector3(15, 6.4, 20),
    target: new THREE.Vector3(1.4, 0.2, 0),
  },
  {
    position: new THREE.Vector3(13.2, 5.2, 17.4),
    target: new THREE.Vector3(1.6, -0.4, 0),
  },
  {
    position: new THREE.Vector3(10.4, 3.6, 14.2),
    target: new THREE.Vector3(2.2, -1.2, 0),
  },
  {
    position: new THREE.Vector3(8.4, 2.4, 11.8),
    target: new THREE.Vector3(2.4, -1.9, 0),
  },
];

function ScrollRig({ progressRef }: { progressRef: MutableRefObject<number> }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(1.4, 0.2, 0));
  const desired = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const progress = THREE.MathUtils.clamp(progressRef.current, 0, 1);
    const scaled = progress * (CAMERA_KEYS.length - 1);
    const index = Math.min(CAMERA_KEYS.length - 2, Math.floor(scaled));
    const fraction = smoothstep(0, 1, scaled - index);
    const from = CAMERA_KEYS[index];
    const to = CAMERA_KEYS[index + 1];

    desired.current.copy(from.position).lerp(to.position, fraction);
    desired.current.x += Math.sin(progress * Math.PI * 2) * 0.28;
    desired.current.y += Math.sin(progress * Math.PI) * 0.18;
    const damp = 1 - Math.exp(-delta * 2.2);
    camera.position.lerp(desired.current, damp);

    desired.current.copy(from.target).lerp(to.target, fraction);
    desired.current.x += Math.sin(progress * Math.PI * 2) * 0.12;
    target.current.lerp(desired.current, damp);
    camera.lookAt(target.current);
  });

  return null;
}

function Halo({ progressRef }: { progressRef: MutableRefObject<number> }) {
  const ref = useRef<THREE.Group | null>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.z =
      state.clock.elapsedTime * 0.035 + progressRef.current * 0.75;
    ref.current.rotation.x = -0.12 + progressRef.current * 0.1;
  });

  return (
    <group ref={ref} position={[2.2, 1.8, -9]}>
      <mesh>
        <torusGeometry args={[9.2, 0.012, 8, 220]} />
        <meshBasicMaterial color="#c9a45c" transparent opacity={0.22} />
      </mesh>
      <mesh>
        <torusGeometry args={[7.1, 0.008, 8, 200]} />
        <meshBasicMaterial color="#c9a45c" transparent opacity={0.12} />
      </mesh>
      <mesh>
        <torusGeometry args={[11.4, 0.006, 8, 220]} />
        <meshBasicMaterial color="#c9a45c" transparent opacity={0.08} />
      </mesh>
    </group>
  );
}

function AssemblyTarget({ progressRef }: { progressRef: MutableRefObject<number> }) {
  const ref = useRef<THREE.Group | null>(null);
  const glowRef = useRef<THREE.MeshBasicMaterial | null>(null);

  useFrame((state) => {
    const progress = THREE.MathUtils.clamp(progressRef.current, 0, 1);
    const active = THREE.MathUtils.smoothstep(progress, 0.58, 0.82);
    if (ref.current) {
      ref.current.position.y = -5.02 + Math.sin(state.clock.elapsedTime * 0.8) * 0.006;
      ref.current.rotation.y = -0.18 + active * 0.06;
    }
    if (glowRef.current) {
      glowRef.current.opacity = 0.12 + active * 0.46 + Math.sin(state.clock.elapsedTime * 2) * 0.06;
    }
  });

  const columns: [number, number][] = [
    [-0.9, -0.55],
    [0.9, -0.55],
    [-0.9, 0.55],
    [0.9, 0.55],
  ];

  return (
    <group ref={ref} position={[5.35, -5.02, 0.6]} rotation={[0, -0.18, 0]}>
      {columns.map(([x, z], index) => (
        <mesh key={index} position={[x, 0.9, z]} castShadow>
          <boxGeometry args={[0.1, 1.8, 0.1]} />
          <meshStandardMaterial color="#343b45" metalness={0.88} roughness={0.38} />
        </mesh>
      ))}
      {[0.2, 1.05, 1.8].map((y) => (
        <group key={y}>
          <mesh position={[0, y, -0.55]} castShadow>
            <boxGeometry args={[1.9, 0.08, 0.1]} />
            <meshStandardMaterial color="#3c444f" metalness={0.9} roughness={0.34} />
          </mesh>
          <mesh position={[0, y, 0.55]} castShadow>
            <boxGeometry args={[1.9, 0.08, 0.1]} />
            <meshStandardMaterial color="#3c444f" metalness={0.9} roughness={0.34} />
          </mesh>
          <mesh position={[-0.9, y, 0]} castShadow>
            <boxGeometry args={[0.1, 0.08, 1.2]} />
            <meshStandardMaterial color="#3c444f" metalness={0.9} roughness={0.34} />
          </mesh>
          <mesh position={[0.9, y, 0]} castShadow>
            <boxGeometry args={[0.1, 0.08, 1.2]} />
            <meshStandardMaterial color="#3c444f" metalness={0.9} roughness={0.34} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.86, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.34, 0.4, 32]} />
        <meshBasicMaterial ref={glowRef} color="#c9a45c" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 1.84, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.7, 1.0]} />
        <meshBasicMaterial color="#c9a45c" transparent opacity={0.035} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Platform() {
  return (
    <group>
      <mesh position={[0, -5.28, 0]} receiveShadow>
        <cylinderGeometry args={[8.5, 8.7, 0.26, 96]} />
        <meshStandardMaterial color="#0b0d10" roughness={0.82} metalness={0.28} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5.14, 0]}>
        <ringGeometry args={[8.42, 8.5, 128]} />
        <meshBasicMaterial color="#c9a45c" transparent opacity={0.38} />
      </mesh>
      <gridHelper
        args={[48, 48, "#3a2f1d", "#15181d"]}
        position={[0, -5.16, 0]}
      />
    </group>
  );
}

export default function ScrollCraneScene({
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
        dpr={SCENE_DPR.crane}
        performance={SCENE_PERFORMANCE}
        frameloop={visible ? "always" : "never"}
        gl={SCENE_GL}
        camera={{ position: [15, 6.4, 20], fov: 34, near: 0.1, far: 90 }}
        className="!absolute inset-0"
        onCreated={({ gl }) => {
          configureRenderer(gl, SCENE_DPR.crane[1]);
          revealAfterFirstFrame(onReady);
        }}
      >
        <fog attach="fog" args={["#060708", 22, 78]} />
        <ambientLight intensity={0.24} />
        <hemisphereLight args={["#66727c", "#08090b", 0.45]} />
        <directionalLight
          position={[14, 20, 10]}
          intensity={2.9}
          color="#ffe0aa"
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-22}
          shadow-camera-right={22}
          shadow-camera-top={22}
          shadow-camera-bottom={-22}
          shadow-camera-near={1}
          shadow-camera-far={60}
          shadow-bias={-0.0005}
          shadow-normalBias={0.025}
        />
        <spotLight
          position={[-12, 9, 6]}
          angle={0.5}
          penumbra={1}
          intensity={180}
          distance={45}
          color="#c9a45c"
        />
        <pointLight position={[8, 1, -5]} intensity={42} color="#5f8394" distance={28} />
        <pointLight position={[1.5, 4.5, 2]} intensity={14} color="#e7cf99" distance={12} />

        <Suspense fallback={<WireframeCrane3D />}>
          <Environment resolution={64} frames={1}>
            <Lightformer
              form="rect"
              intensity={2.4}
              color="#ffd7a0"
              position={[0, 14, -18]}
              scale={[22, 8, 1]}
            />
            <Lightformer
              form="rect"
              intensity={1.1}
              color="#5f8394"
              position={[-18, 5, 8]}
              scale={[12, 12, 1]}
            />
            <Lightformer
              form="rect"
              intensity={0.9}
              color="#c9a45c"
              position={[18, 3, 6]}
              scale={[8, 8, 1]}
            />
          </Environment>
          <group position={[-0.4, -5.05, 0]} scale={0.92}>
            <CraneModel mode="scroll" progressRef={progressRef} />
          </group>
          <Platform />
          <AssemblyTarget progressRef={progressRef} />
          <Cityscape />
          <Halo progressRef={progressRef} />
          <Sparkles
            count={70}
            scale={[26, 16, 26]}
            position={[0, 2, -2]}
            size={1.3}
            speed={reduced ? 0 : 0.24}
            opacity={0.32}
            color="#c9a45c"
          />
          <ContactShadows
            frames={1}
            position={[0, -5.15, 0]}
            opacity={0.58}
            scale={34}
            blur={2.6}
            far={12}
            color="#000000"
          />
        </Suspense>
        <ScrollRig progressRef={progressRef} />
      </Canvas>
    </div>
  );
}
