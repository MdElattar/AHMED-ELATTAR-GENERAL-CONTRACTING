"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Edges, Environment, Lightformer, Sparkles } from "@react-three/drei";
import { CraneModel } from "@/components/three/CraneModel";
import { Cityscape } from "@/components/three/Cityscape";
import { SCENE_DPR, SCENE_GL, SCENE_PERFORMANCE } from "@/components/three/config";
import { useCanvasVisibility } from "@/components/three/useCanvasVisibility";

function Rig({ reduced }: { reduced: boolean }) {
  const { camera } = useThree();
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((_, delta) => {
    if (reduced) {
      camera.lookAt(1.6, 0.4, 0);
      return;
    }
    const damp = 1 - Math.exp(-delta * 2.4);
    camera.position.x = THREE.MathUtils.lerp(
      camera.position.x,
      16 + pointer.current.x * 1.1,
      damp,
    );
    camera.position.y = THREE.MathUtils.lerp(
      camera.position.y,
      6.6 - pointer.current.y * 0.65,
      damp,
    );
    camera.lookAt(1.6, 0.4, 0);
  });

  return null;
}

function Backdrop() {
  const monoliths = useMemo(
    () => [
      { x: -13, z: -13, w: 3.2, h: 9, d: 3.2 },
      { x: -8.5, z: -17, w: 4, h: 13, d: 3.5 },
      { x: -3, z: -20, w: 5, h: 7, d: 4 },
      { x: 5, z: -18, w: 3.6, h: 11, d: 3 },
      { x: 11, z: -14, w: 4.4, h: 8, d: 3.6 },
      { x: 15, z: -20, w: 3, h: 15, d: 3 },
    ],
    [],
  );

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5.55, 0]} receiveShadow>
        <planeGeometry args={[90, 90]} />
        <meshStandardMaterial color="#0a0c0f" roughness={0.88} metalness={0.16} />
      </mesh>
      <gridHelper
        args={[64, 64, "#3a2f1d", "#171a1f"]}
        position={[0, -5.53, 0]}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5.52, 0]}>
        <ringGeometry args={[8.6, 8.66, 128]} />
        <meshBasicMaterial color="#c9a45c" transparent opacity={0.28} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5.52, 0]}>
        <ringGeometry args={[12.6, 12.64, 128]} />
        <meshBasicMaterial color="#c9a45c" transparent opacity={0.12} />
      </mesh>

      {monoliths.map((item) => (
        <mesh
          key={`${item.x}-${item.z}`}
          position={[item.x, -5.55 + item.h / 2, item.z]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[item.w, item.h, item.d]} />
          <meshStandardMaterial color="#0b0e12" roughness={0.72} metalness={0.35} />
          <Edges threshold={15} color="#3a3428" />
        </mesh>
      ))}
    </group>
  );
}

export default function HeroScene() {
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
        dpr={SCENE_DPR.hero}
        performance={SCENE_PERFORMANCE}
        frameloop={visible ? (reduced ? "demand" : "always") : "never"}
        gl={SCENE_GL}
        camera={{ position: [16, 6.6, 21], fov: 34, near: 0.1, far: 90 }}
        className="!absolute inset-0"
      >
        <fog attach="fog" args={["#060708", 22, 78]} />
        <ambientLight intensity={0.24} />
        <hemisphereLight args={["#5d6a74", "#08090b", 0.48]} />
        <directionalLight
          position={[14, 20, 10]}
          intensity={2.9}
          color="#ffe4b5"
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-22}
          shadow-camera-right={22}
          shadow-camera-top={22}
          shadow-camera-bottom={-22}
          shadow-camera-near={1}
          shadow-camera-far={64}
          shadow-bias={-0.0005}
          shadow-normalBias={0.025}
        />
        <spotLight
          position={[-12, 10, 8]}
          angle={0.45}
          penumbra={1}
          intensity={170}
          distance={45}
          color="#c9a45c"
        />
        <pointLight position={[9, 2, -6]} intensity={48} color="#5f8394" distance={30} />
        <pointLight position={[1, -3, 7]} intensity={20} color="#c9a45c" distance={18} />

        <Suspense fallback={null}>
          <Environment resolution={64} frames={1}>
            <Lightformer
              form="rect"
              intensity={2.6}
              color="#ffd7a0"
              position={[0, 15, -18]}
              scale={[24, 9, 1]}
            />
            <Lightformer
              form="rect"
              intensity={1.2}
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
          <group position={[1.8, -5.4, 0]} scale={0.95}>
            <CraneModel mode="hero" />
          </group>
          <Backdrop />
          <Cityscape />
          <Sparkles
            count={90}
            scale={[30, 18, 30]}
            position={[0, 2, -3]}
            size={1.4}
            speed={reduced ? 0 : 0.28}
            opacity={0.38}
            color="#c9a45c"
          />
          <ContactShadows
            frames={1}
            position={[0, -5.51, 0]}
            opacity={0.55}
            scale={42}
            blur={2.8}
            far={14}
            color="#000000"
          />
        </Suspense>
        <Rig reduced={reduced} />
      </Canvas>
    </div>
  );
}
