"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Edges } from "@react-three/drei";

const GROUND_Y = -5.35;

type Building = {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  tone: number;
  edges?: boolean;
  antenna?: boolean;
};

const BUILDINGS: Building[] = [
  { x: -30, z: -30, w: 7, d: 7, h: 24, tone: 0, edges: true },
  { x: -22, z: -24, w: 5, d: 5, h: 14, tone: 1 },
  { x: -16, z: -34, w: 8, d: 7, h: 30, tone: 0, edges: true, antenna: true },
  { x: -8, z: -27, w: 5, d: 6, h: 18, tone: 2 },
  { x: -1, z: -36, w: 7, d: 6, h: 26, tone: 1, edges: true },
  { x: 6, z: -29, w: 5, d: 5, h: 16, tone: 3 },
  { x: 12, z: -35, w: 8, d: 7, h: 32, tone: 0, edges: true, antenna: true },
  { x: 20, z: -26, w: 5, d: 6, h: 20, tone: 1 },
  { x: 27, z: -33, w: 7, d: 6, h: 27, tone: 2, edges: true },
  { x: 34, z: -25, w: 6, d: 6, h: 18, tone: 3 },
  { x: -26, z: -12, w: 5, d: 7, h: 12, tone: 2 },
  { x: 25, z: -10, w: 5, d: 6, h: 15, tone: 1 },
  { x: 32, z: -4, w: 6, d: 6, h: 11, tone: 3 },
  { x: -33, z: -6, w: 6, d: 6, h: 10, tone: 0 },
  { x: -18, z: -22, w: 4, d: 4, h: 8, tone: 3 },
  { x: 22, z: -22, w: 4, d: 4, h: 9, tone: 2 },
];

const TONES = ["#0c1015", "#10151c", "#141a21", "#0a0e13"];

const WINDOW_COLORS = ["#e7cf99", "#b9d6e2", "#f3eee4", "#c9a45c"];

function seeded(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

type WindowInstance = {
  position: [number, number, number];
  scale: [number, number, number];
  color: THREE.Color;
};

function buildWindows() {
  const random = seeded(20260110);
  const windows: WindowInstance[] = [];

  BUILDINGS.forEach((building, buildingIndex) => {
    const columns = Math.max(2, Math.floor(building.w * 1.45));
    const rows = Math.max(3, Math.floor(building.h * 0.95));
    const xStep = (building.w - 0.7) / columns;
    const yStep = (building.h - 1.6) / rows;

    for (let column = 0; column < columns; column += 1) {
      for (let row = 0; row < rows; row += 1) {
        if (random() < 0.42) continue;
        const x = building.x - building.w / 2 + 0.35 + xStep * (column + 0.5);
        const y = GROUND_Y + 0.9 + yStep * (row + 0.5);
        const lit = random() > 0.28;
        windows.push({
          position: [x, y, building.z + building.d / 2 + 0.035],
          scale: [0.55 + random() * 0.55, 0.5 + random() * 0.7, 1],
          color: new THREE.Color(
            lit
              ? WINDOW_COLORS[(buildingIndex + column + row) % WINDOW_COLORS.length]
              : "#232a31",
          ),
        });
      }
    }
  });

  return windows;
}

function Windows() {
  const ref = useRef<THREE.InstancedMesh | null>(null);
  const windows = useMemo(() => buildWindows(), []);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    windows.forEach((window, index) => {
      dummy.position.set(...window.position);
      dummy.scale.set(...window.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      mesh.setColorAt(index, window.color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [windows]);

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, windows.length]}
      frustumCulled={false}
    >
      <boxGeometry args={[0.14, 0.2, 0.035]} />
      <meshBasicMaterial toneMapped={false} transparent opacity={0.9} />
    </instancedMesh>
  );
}

function UnderConstruction() {
  const floors = 7;
  const floorHeight = 1.9;
  const width = 5.6;
  const depth = 5.2;
  const halfWidth = width / 2 - 0.25;
  const halfDepth = depth / 2 - 0.25;

  return (
    <group position={[0, GROUND_Y, -25]}>
      {/* Exposed concrete frame */}
      {Array.from({ length: floors }).map((_, floor) => {
        const y = floor * floorHeight;
        return (
          <group key={floor}>
            <mesh position={[0, y + floorHeight, 0]} castShadow receiveShadow>
              <boxGeometry args={[width, 0.16, depth]} />
              <meshStandardMaterial color="#3d3f42" roughness={0.88} metalness={0.06} />
              <Edges threshold={20} color="#6a6047" />
            </mesh>
            {[
              [-halfWidth, -halfDepth],
              [halfWidth, -halfDepth],
              [halfWidth, halfDepth],
              [-halfWidth, halfDepth],
            ].map(([x, z]) => (
              <mesh
                key={`${floor}-${x}-${z}`}
                position={[x, y + floorHeight / 2, z]}
                castShadow
                receiveShadow
              >
                <boxGeometry args={[0.16, floorHeight, 0.16]} />
                <meshStandardMaterial color="#34373b" roughness={0.82} metalness={0.18} />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* Concrete core rising past the frame */}
      <mesh position={[0.6, floors * floorHeight * 0.5, -0.9]} castShadow receiveShadow>
        <boxGeometry args={[1.4, floors * floorHeight, 1.4]} />
        <meshStandardMaterial color="#2c2f33" roughness={0.9} metalness={0.04} />
        <Edges threshold={20} color="#5a513c" />
      </mesh>

      {/* Scaffolding on the camera-facing elevation */}
      {[-1, 1].map((side) => (
        <mesh
          key={`pole-${side}`}
          position={[side * (width / 2 + 0.28), (floors * floorHeight) / 2, depth / 2 + 0.3]}
          castShadow
        >
          <boxGeometry args={[0.07, floors * floorHeight, 0.07]} />
          <meshStandardMaterial color="#8f6f34" metalness={0.7} roughness={0.4} />
        </mesh>
      ))}
      {Array.from({ length: floors }).map((_, floor) => (
        <mesh
          key={`rail-${floor}`}
          position={[0, floor * floorHeight + 0.9, depth / 2 + 0.3]}
          castShadow
        >
          <boxGeometry args={[width + 0.56, 0.06, 0.06]} />
          <meshStandardMaterial color="#8f6f34" metalness={0.7} roughness={0.42} />
        </mesh>
      ))}

      {/* Aviation warning beacons */}
      <mesh position={[0.6, floors * floorHeight + 0.4, -0.9]}>
        <sphereGeometry args={[0.08, 10, 10]} />
        <meshBasicMaterial color="#ff7a4d" transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, floors * floorHeight + 0.3, 0]}>
        <sphereGeometry args={[0.06, 10, 10]} />
        <meshBasicMaterial color="#ff7a4d" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

function SiteDetails() {
  const concrete = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#3b3c3e",
        roughness: 0.92,
        metalness: 0.05,
      }),
    [],
  );
  const rebar = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#8f6f34",
        metalness: 0.85,
        roughness: 0.38,
      }),
    [],
  );
  const safety = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#b8663d",
        roughness: 0.6,
        metalness: 0.2,
      }),
    [],
  );

  return (
    <group position={[0, GROUND_Y, 0]}>
      {/* Concrete block stacks */}
      {[0, 1, 2].map((level) => (
        <mesh
          key={`block-${level}`}
          position={[-6.4, 0.28 + level * 0.52, 5.6]}
          rotation={[0, level * 0.12, 0]}
          material={concrete}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[1.5, 0.5, 0.9]} />
        </mesh>
      ))}

      {/* Rebar bundles */}
      {[-0.12, 0, 0.12].map((offset) => (
        <mesh
          key={`rebar-${offset}`}
          position={[6.2, 0.16, 6 + offset]}
          rotation={[0, 0, Math.PI / 2]}
          material={rebar}
          castShadow
        >
          <cylinderGeometry args={[0.035, 0.035, 4.2, 6]} />
        </mesh>
      ))}

      {/* Site barriers */}
      {[-7.5, -4.5, 1.5, 4.5].map((x) => (
        <mesh key={`barrier-${x}`} position={[x, 0.45, 8.2]} material={safety} castShadow>
          <boxGeometry args={[1.8, 0.16, 0.22]} />
        </mesh>
      ))}

      {/* Safety cones */}
      {[-5.4, -2.6, 2.2, 5.1].map((x) => (
        <group key={`cone-${x}`} position={[x, 0, 7.4]}>
          <mesh position={[0, 0.03, 0]} material={concrete} receiveShadow>
            <boxGeometry args={[0.34, 0.06, 0.34]} />
          </mesh>
          <mesh position={[0, 0.28, 0]} material={safety} castShadow>
            <coneGeometry args={[0.14, 0.5, 10]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function Cityscape({ showSite = true }: { showSite?: boolean }) {
  return (
    <group>
      {BUILDINGS.map((building, index) => (
        <group key={`${building.x}-${building.z}`} position={[building.x, GROUND_Y, building.z]}>
          <mesh position={[0, building.h / 2, 0]} castShadow={index < 6} receiveShadow>
            <boxGeometry args={[building.w, building.h, building.d]} />
            <meshStandardMaterial
              color={TONES[building.tone]}
              roughness={0.34 + (index % 3) * 0.08}
              metalness={0.55}
              envMapIntensity={0.75}
            />
            {building.edges ? <Edges threshold={20} color="#3d3627" /> : null}
          </mesh>

          {building.antenna ? (
            <group position={[0, building.h, 0]}>
              <mesh position={[0, 1.4, 0]}>
                <cylinderGeometry args={[0.035, 0.06, 2.8, 6]} />
                <meshStandardMaterial color="#6a6047" metalness={0.8} roughness={0.4} />
              </mesh>
              <mesh position={[0, 2.85, 0]}>
                <sphereGeometry args={[0.075, 8, 8]} />
                <meshBasicMaterial color="#ff7a4d" transparent opacity={0.8} />
              </mesh>
            </group>
          ) : null}
        </group>
      ))}

      <Windows />
      <UnderConstruction />
      {showSite ? <SiteDetails /> : null}
    </group>
  );
}
