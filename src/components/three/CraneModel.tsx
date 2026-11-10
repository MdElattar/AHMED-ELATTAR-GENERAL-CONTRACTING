"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import { smoothstep } from "@/lib/utils";

type Strut = {
  start: THREE.Vector3;
  end: THREE.Vector3;
  thickness: number;
};

type CraneModelProps = {
  mode?: "hero" | "scroll";
  progressRef?: MutableRefObject<number>;
};

const UP = new THREE.Vector3(0, 1, 0);

// Frame-loop scratch objects. Sharing them is safe because `useFrame` callbacks
// run sequentially on the main thread, and reusing them keeps the render loop
// allocation-free (no GC pauses mid-animation).
const cableStart = new THREE.Vector3();
const cableEnd = new THREE.Vector3();
const cableDirection = new THREE.Vector3();
const cableNormal = new THREE.Vector3();

function makeStrut(
  x1: number,
  y1: number,
  z1: number,
  x2: number,
  y2: number,
  z2: number,
  thickness: number,
): Strut {
  return {
    start: new THREE.Vector3(x1, y1, z1),
    end: new THREE.Vector3(x2, y2, z2),
    thickness,
  };
}

function buildTower() {
  const struts: Strut[] = [];
  const width = 1.25;
  const segments = 12;
  const segmentHeight = 0.85;
  const height = segments * segmentHeight;
  const half = width / 2;
  const corners: [number, number][] = [
    [-half, -half],
    [half, -half],
    [half, half],
    [-half, half],
  ];

  corners.forEach(([x, z]) => {
    struts.push(makeStrut(x, 0, z, x, height, z, 0.075));
  });

  for (let i = 0; i < segments; i += 1) {
    const y0 = i * segmentHeight;
    const y1 = y0 + segmentHeight;
    corners.forEach(([x, z], index) => {
      const [nx, nz] = corners[(index + 1) % 4];
      struts.push(makeStrut(x, y1, z, nx, y1, nz, 0.045));
      struts.push(makeStrut(x, y0, z, nx, y1, nz, 0.038));
      struts.push(makeStrut(nx, y0, nz, x, y1, z, 0.038));
    });
  }

  return { struts, height, width };
}

function buildJib() {
  const struts: Strut[] = [];
  const y = 10.2;
  const startX = 0.8;
  const endX = 11.4;
  const step = 0.7;
  const z = 0.34;
  const topY = 10.92;

  struts.push(makeStrut(startX, y, -z, endX, y, -z, 0.055));
  struts.push(makeStrut(startX, y, z, endX, y, z, 0.055));
  struts.push(makeStrut(startX, topY, 0, endX - 0.7, topY, 0, 0.05));

  for (let x = startX; x < endX - 0.7; x += step) {
    struts.push(makeStrut(x, y, -z, x + step / 2, topY, 0, 0.032));
    struts.push(makeStrut(x + step / 2, topY, 0, x + step, y, -z, 0.032));
    struts.push(makeStrut(x, y, z, x + step / 2, topY, 0, 0.032));
    struts.push(makeStrut(x + step / 2, topY, 0, x + step, y, z, 0.032));
    struts.push(makeStrut(x, y, -z, x, y, z, 0.028));
  }

  return struts;
}

function buildCounterJib() {
  const struts: Strut[] = [];
  const y = 10.2;
  const startX = -0.75;
  const endX = -4.4;
  const step = 0.7;
  const z = 0.34;
  const topY = 10.9;

  struts.push(makeStrut(startX, y, -z, endX, y, -z, 0.055));
  struts.push(makeStrut(startX, y, z, endX, y, z, 0.055));
  struts.push(makeStrut(startX, topY, 0, endX + 0.2, topY, 0, 0.05));

  for (let x = startX; x > endX + 0.2; x -= step) {
    struts.push(makeStrut(x, y, -z, x - step / 2, topY, 0, 0.03));
    struts.push(makeStrut(x - step / 2, topY, 0, x - step, y, -z, 0.03));
    struts.push(makeStrut(x, y, z, x - step / 2, topY, 0, 0.03));
    struts.push(makeStrut(x - step / 2, topY, 0, x - step, y, z, 0.03));
    struts.push(makeStrut(x, y, -z, x, y, z, 0.028));
  }

  return struts;
}

function buildApex() {
  const struts: Strut[] = [];
  const apex = 11.9;
  const corners: [number, number][] = [
    [-0.62, -0.62],
    [0.62, -0.62],
    [0.62, 0.62],
    [-0.62, 0.62],
  ];
  corners.forEach(([x, z]) => {
    struts.push(makeStrut(x, 10.2, z, 0, apex, 0, 0.06));
  });
  struts.push(makeStrut(-0.62, 10.2, -0.62, 0.62, 10.2, 0.62, 0.035));
  struts.push(makeStrut(0.62, 10.2, -0.62, -0.62, 10.2, 0.62, 0.035));
  return struts;
}

function buildStays() {
  const struts: Strut[] = [];
  struts.push(makeStrut(0, 11.9, 0, 10.6, 10.95, 0, 0.018));
  struts.push(makeStrut(0, 11.9, 0, 7.2, 10.95, 0, 0.014));
  struts.push(makeStrut(0, 11.9, 0, -3.9, 10.9, 0, 0.018));
  struts.push(makeStrut(0, 11.9, 0, -1.8, 10.9, 0, 0.014));
  return struts;
}

function StrutMesh({
  struts,
  material,
  castShadow = true,
}: {
  struts: Strut[];
  material: THREE.Material;
  castShadow?: boolean;
}) {
  const ref = useRef<THREE.InstancedMesh | null>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const direction = new THREE.Vector3();
    const normal = new THREE.Vector3();
    struts.forEach((strut, index) => {
      direction.subVectors(strut.end, strut.start);
      const length = direction.length();
      dummy.position.copy(strut.start).add(strut.end).multiplyScalar(0.5);
      dummy.quaternion.setFromUnitVectors(UP, normal.copy(direction).normalize());
      dummy.scale.set(strut.thickness, length, strut.thickness);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [struts]);

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, struts.length]}
      material={material}
      castShadow={castShadow}
      receiveShadow
    >
      <boxGeometry args={[1, 1, 1]} />
    </instancedMesh>
  );
}

function stretchCable(
  mesh: THREE.Mesh | null,
  startX: number,
  startY: number,
  startZ: number,
  endX: number,
  endY: number,
  endZ: number,
) {
  if (!mesh) return;
  cableStart.set(startX, startY, startZ);
  cableEnd.set(endX, endY, endZ);
  cableDirection.subVectors(cableEnd, cableStart);
  const length = cableDirection.length();
  mesh.position.copy(cableStart).add(cableEnd).multiplyScalar(0.5);
  mesh.scale.set(1, length, 1);
  mesh.quaternion.setFromUnitVectors(
    UP,
    cableNormal.copy(cableDirection).normalize(),
  );
}

// Static geometry is built once per module instead of once per mounted scene.
const TOWER = buildTower();
const JIB = buildJib();
const COUNTER_JIB = buildCounterJib();
const APEX = buildApex();
const STAYS = buildStays();

export function CraneModel({ mode = "hero", progressRef }: CraneModelProps) {
  const rootRef = useRef<THREE.Group | null>(null);
  const slewRef = useRef<THREE.Group | null>(null);
  const boomRef = useRef<THREE.Group | null>(null);
  const trolleyRef = useRef<THREE.Group | null>(null);
  const hookRef = useRef<THREE.Group | null>(null);
  const cableRef = useRef<THREE.Mesh | null>(null);
  const lightRef = useRef<THREE.MeshBasicMaterial | null>(null);

  const tower = TOWER;
  const jib = JIB;
  const counterJib = COUNTER_JIB;
  const apex = APEX;
  const stays = STAYS;

  const brushed = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext("2d");
    if (!context) return null;

    context.fillStyle = "#737373";
    context.fillRect(0, 0, 256, 256);
    for (let index = 0; index < 1400; index += 1) {
      const y = (index * 37) % 256;
      const shade = 74 + ((index * 53) % 92);
      context.globalAlpha = 0.035 + ((index * 17) % 9) / 100;
      context.strokeStyle = `rgb(${shade}, ${shade}, ${shade})`;
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(256, y + ((index * 11) % 5) - 2);
      context.stroke();
    }
    context.globalAlpha = 1;

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    texture.anisotropy = 4;
    texture.colorSpace = THREE.NoColorSpace;
    return texture;
  }, []);

  const materials = useMemo(
    () => ({
      steel: new THREE.MeshStandardMaterial({
        color: "#2b313a",
        metalness: 0.94,
        roughness: 0.42,
        roughnessMap: brushed ?? undefined,
        envMapIntensity: 1.25,
      }),
      dark: new THREE.MeshStandardMaterial({
        color: "#0d1015",
        metalness: 0.82,
        roughness: 0.38,
        envMapIntensity: 1.1,
      }),
      gold: new THREE.MeshStandardMaterial({
        color: "#d4af68",
        metalness: 1,
        roughness: 0.28,
        roughnessMap: brushed ?? undefined,
        emissive: new THREE.Color("#3a2a0c"),
        emissiveIntensity: 0.16,
        envMapIntensity: 1.45,
      }),
      glass: new THREE.MeshPhysicalMaterial({
        color: "#a9cfdd",
        metalness: 0.08,
        roughness: 0.045,
        transparent: true,
        opacity: 0.46,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
        envMapIntensity: 1.5,
        side: THREE.DoubleSide,
      }),
      concrete: new THREE.MeshStandardMaterial({
        color: "#3d3e40",
        metalness: 0.05,
        roughness: 0.92,
      }),
      cable: new THREE.MeshStandardMaterial({
        color: "#d8b877",
        metalness: 0.96,
        roughness: 0.3,
        roughnessMap: brushed ?? undefined,
        envMapIntensity: 1.4,
      }),
    }),
    [brushed],
  );

  useEffect(() => {
    return () => {
      Object.values(materials).forEach((material) => material.dispose());
      brushed?.dispose();
    };
  }, [materials, brushed]);

  useFrame((state, delta) => {
    const elapsed = state.clock.elapsedTime;
    const progress = progressRef?.current ?? 0;
    const damp = 1 - Math.exp(-delta * 3.4);
    const isScroll = mode === "scroll";

    if (rootRef.current) {
      if (isScroll) {
        rootRef.current.rotation.y = THREE.MathUtils.lerp(
          rootRef.current.rotation.y,
          -0.42,
          damp,
        );
        rootRef.current.rotation.x = THREE.MathUtils.lerp(
          rootRef.current.rotation.x,
          Math.sin(progress * Math.PI) * 0.012,
          damp,
        );
        rootRef.current.rotation.z = Math.sin(elapsed * 0.3) * 0.006;
      } else {
        rootRef.current.rotation.y =
          -0.38 + Math.sin(elapsed * 0.16) * 0.045 + state.pointer.x * 0.12;
        rootRef.current.rotation.z = Math.sin(elapsed * 0.24) * 0.005;
        rootRef.current.rotation.x = THREE.MathUtils.lerp(rootRef.current.rotation.x, 0, damp);
      }
    }

    // The slewing assembly turns independently of the fixed mast — the
    // mechanical motion the scroll sequence is built around.
    if (slewRef.current) {
      const target = isScroll
        ? 0.32 + progress * 2.15 + Math.sin(progress * Math.PI * 2) * 0.06
        : Math.sin(elapsed * 0.11) * 0.06 + state.pointer.x * 0.03;
      slewRef.current.rotation.y = THREE.MathUtils.lerp(
        slewRef.current.rotation.y,
        target,
        damp,
      );
    }

    // Boom luffing: raises through the lift, settles as the load lands.
    if (boomRef.current) {
      const target = isScroll
        ? -0.018 +
          smoothstep(0.08, 0.46, progress) * 0.052 -
          smoothstep(0.62, 0.94, progress) * 0.028
        : Math.sin(elapsed * 0.22) * 0.008;
      boomRef.current.rotation.z = THREE.MathUtils.lerp(
        boomRef.current.rotation.z,
        target,
        damp,
      );
    }

    const drop = isScroll
      ? smoothstep(0.14, 0.62, progress) * 6.4 - smoothstep(0.84, 1, progress) * 0.9
      : 0;
    const hookY = isScroll ? 8.15 - drop : 8.15 + Math.sin(elapsed * 0.65) * 0.12;
    const trolleyX = isScroll
      ? 8.7 - smoothstep(0.28, 0.84, progress) * 2.6
      : 8.7 + Math.sin(elapsed * 0.22) * 0.25;

    if (trolleyRef.current) {
      trolleyRef.current.position.x = THREE.MathUtils.lerp(
        trolleyRef.current.position.x,
        trolleyX,
        damp,
      );
    }

    if (hookRef.current) {
      hookRef.current.position.x = THREE.MathUtils.lerp(
        hookRef.current.position.x,
        trolleyX,
        damp,
      );
      hookRef.current.position.y = THREE.MathUtils.lerp(
        hookRef.current.position.y,
        hookY,
        damp,
      );
      hookRef.current.rotation.z =
        Math.sin(elapsed * 0.9) * 0.035 +
        (isScroll ? Math.sin(progress * Math.PI * 3) * 0.012 : 0.01);
      hookRef.current.rotation.y = Math.sin(elapsed * 0.7) * 0.04;
    }

    stretchCable(cableRef.current, trolleyX, 10.17, 0, trolleyX, hookY + 0.55, 0);

    if (lightRef.current) {
      lightRef.current.opacity = 0.45 + Math.sin(elapsed * 2.4) * 0.35;
    }
  });

  return (
    <group ref={rootRef}>
      <StrutMesh struts={tower.struts} material={materials.steel} />

      {/* Base frame */}
      <mesh position={[0, 0.08, 0]} material={materials.gold} castShadow>
        <boxGeometry args={[1.8, 0.16, 1.8]} />
      </mesh>
      <mesh position={[0, -0.05, 0]} material={materials.dark} receiveShadow>
        <boxGeometry args={[2.6, 0.18, 2.6]} />
      </mesh>

      {/* Slewing assembly — rotates independently of the mast */}
      <group ref={slewRef}>
        <StrutMesh struts={apex} material={materials.steel} />

        {/* Slewing unit and top platform */}
        <mesh position={[0, 10.18, 0]} material={materials.dark} castShadow>
          <cylinderGeometry args={[0.92, 0.98, 0.32, 24]} />
        </mesh>
        <mesh position={[0, 10.36, 0]} material={materials.gold}>
          <cylinderGeometry args={[0.95, 0.95, 0.06, 32]} />
        </mesh>

        {/* Operator cab */}
        <group position={[1.25, 9.35, 0.85]}>
          <mesh material={materials.dark} castShadow>
            <boxGeometry args={[1.25, 1.1, 1.05]} />
          </mesh>
          <mesh position={[0.08, 0.08, 0.54]} material={materials.glass}>
            <boxGeometry args={[0.98, 0.68, 0.04]} />
          </mesh>
          <mesh position={[0.08, -0.36, 0.55]} material={materials.gold}>
            <boxGeometry args={[0.98, 0.04, 0.02]} />
          </mesh>
          <mesh position={[0, 0.55, 0]} material={materials.gold}>
            <boxGeometry args={[1.28, 0.04, 1.08]} />
          </mesh>
        </group>

        {/* Machinery housing */}
        <mesh position={[-1.15, 9.85, 0]} material={materials.dark} castShadow>
          <boxGeometry args={[1.05, 0.62, 0.95]} />
        </mesh>

        {/* Luffing boom and its suspended load */}
        <group ref={boomRef} position={[0, 10.2, 0]}>
          <group position={[0, -10.2, 0]}>
            <StrutMesh struts={jib} material={materials.steel} />
            <StrutMesh struts={counterJib} material={materials.steel} />
            <StrutMesh struts={stays} material={materials.gold} castShadow={false} />

            {/* Counterweights on the counter-jib */}
            {[-3.65, -3.08, -2.51].map((x, index) => (
              <mesh
                key={x}
                position={[x, 9.72 + index * 0.02, 0]}
                material={materials.concrete}
                castShadow
              >
                <boxGeometry args={[0.44, 0.92, 1.15]} />
              </mesh>
            ))}

            {/* Trolley */}
            <group ref={trolleyRef} position={[8.7, 10.14, 0]}>
              <mesh material={materials.gold} castShadow>
                <boxGeometry args={[0.46, 0.16, 0.55]} />
              </mesh>
              <mesh position={[0, -0.14, 0]} material={materials.dark}>
                <boxGeometry args={[0.28, 0.16, 0.36]} />
              </mesh>
            </group>

            {/* Hoist cable */}
            <mesh ref={cableRef} material={materials.cable} castShadow={false}>
              <cylinderGeometry args={[0.012, 0.012, 1, 6]} />
            </mesh>

            {/* Hook block and payload */}
            <group ref={hookRef} position={[8.7, 8.15, 0]}>
              <mesh material={materials.gold} castShadow>
                <boxGeometry args={[0.34, 0.3, 0.26]} />
              </mesh>
              <mesh
                position={[0, -0.28, 0]}
                rotation={[0, 0, Math.PI * 0.85]}
                material={materials.gold}
              >
                <torusGeometry args={[0.18, 0.045, 8, 18, Math.PI * 1.45]} />
              </mesh>
              <group position={[0, -1.35, 0]} rotation={[0, 0, 0.02]}>
                <mesh material={materials.dark} castShadow>
                  <boxGeometry args={[1.75, 0.34, 0.52]} />
                  <Edges scale={1.002} threshold={15} color="#d4af68" />
                </mesh>
                <mesh position={[0, 0.34, 0]} material={materials.gold}>
                  <boxGeometry args={[1.75, 0.04, 0.04]} />
                </mesh>
                <mesh position={[-0.55, 0.72, 0]} material={materials.cable}>
                  <cylinderGeometry args={[0.01, 0.01, 0.75, 5]} />
                </mesh>
                <mesh position={[0.55, 0.72, 0]} material={materials.cable}>
                  <cylinderGeometry args={[0.01, 0.01, 0.75, 5]} />
                </mesh>
              </group>
            </group>

            {/* Jib tip aviation light */}
            <mesh position={[11.15, 10.98, 0]}>
              <sphereGeometry args={[0.06, 10, 10]} />
              <meshBasicMaterial color="#ff7a4d" transparent opacity={0.7} />
            </mesh>
          </group>
        </group>

        {/* Apex aviation light */}
        <mesh position={[0, 11.98, 0]}>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshBasicMaterial ref={lightRef} color="#ff7a4d" transparent opacity={0.7} />
        </mesh>
      </group>

      {/* Ground shadow anchor */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[2.2, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.22} />
      </mesh>
    </group>
  );
}
