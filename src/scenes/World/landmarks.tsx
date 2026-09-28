import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CONTINENTS, type ContinentId } from "../../data/continents";
import { continentColors } from "../../lib/palette";
import { makeToonGradient } from "./toon";
import {
  uvToSphere,
  GLOBE_BASE_R,
  GLOBE_RELIEF,
} from "./layout";
import { REGION_POS, regionLevel } from "./worldgen";

// Themed structure per continent, built from primitives in local space:
// +Y up, base at y=0, footprint ~1 unit. The caller scales / places / orients it
// (tiny + normal-aligned on the globe, larger + flat on the relief map).

type Variant = "globe" | "map";

const GRAD = makeToonGradient(3);
const STONE = "#d9c6a1";
const STONE_DK = "#b49a71";
const WOOD = "#7c4a2b";
const WHITE = "#f4ecd8";

function Toon(props: {
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
}) {
  return (
    <meshToonMaterial
      color={props.color}
      gradientMap={GRAD}
      emissive={props.emissive ?? "#000000"}
      emissiveIntensity={props.emissiveIntensity ?? 0}
    />
  );
}

function Box({
  p = [0, 0, 0],
  s = [1, 1, 1],
  color,
}: {
  p?: [number, number, number];
  s?: [number, number, number];
  color: string;
}) {
  // box centred; lift so p[1] is the *bottom* of the box for easy stacking
  return (
    <mesh position={[p[0], p[1] + s[1] / 2, p[2]]}>
      <boxGeometry args={s} />
      <Toon color={color} />
    </mesh>
  );
}

function Roof({
  p = [0, 0, 0],
  r = 0.3,
  h = 0.18,
  color = WOOD,
}: {
  p?: [number, number, number];
  r?: number;
  h?: number;
  color?: string;
}) {
  return (
    <mesh position={[p[0], p[1] + h / 2, p[2]]} rotation={[0, Math.PI / 4, 0]}>
      <coneGeometry args={[r, h, 4]} />
      <Toon color={color} />
    </mesh>
  );
}

function Cottage({
  p = [0, 0, 0],
  w = 0.26,
  hgt = 0.2,
  accent,
}: {
  p?: [number, number, number];
  w?: number;
  hgt?: number;
  accent: string;
}) {
  return (
    <group position={p}>
      <Box p={[0, 0, 0]} s={[w, hgt, w]} color={STONE} />
      <Roof p={[0, hgt, 0]} r={w * 0.9} h={w * 0.7} color={accent} />
    </group>
  );
}

function About({ accent }: { accent: string }) {
  const lamp = useRef<THREE.MeshToonMaterial>(null);
  useFrame(({ clock }) => {
    if (lamp.current)
      lamp.current.emissiveIntensity =
        1.4 + Math.sin(clock.elapsedTime * 3) * 0.9;
  });
  return (
    <group>
      <Cottage p={[-0.34, 0, 0.12]} accent={accent} />
      <Cottage p={[0.32, 0, 0.2]} w={0.22} hgt={0.16} accent={accent} />
      <Cottage p={[0.1, 0, -0.28]} w={0.24} hgt={0.18} accent={accent} />
      {/* beacon tower */}
      <mesh position={[0, 0.5, 0.05]}>
        <cylinderGeometry args={[0.11, 0.16, 1.0, 6]} />
        <Toon color={STONE_DK} />
      </mesh>
      <mesh position={[0, 1.05, 0.05]}>
        <cylinderGeometry args={[0.15, 0.15, 0.14, 8]} />
        <Toon color={STONE} />
      </mesh>
      <mesh position={[0, 1.16, 0.05]}>
        <sphereGeometry args={[0.17, 10, 8]} />
        <meshToonMaterial
          ref={lamp}
          color={accent}
          gradientMap={GRAD}
          emissive={accent}
          emissiveIntensity={1.8}
        />
      </mesh>
    </group>
  );
}

function Windmill({ accent }: { accent: string }) {
  const blades = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (blades.current) blades.current.rotation.z += dt * 1.6;
  });
  return (
    <group>
      <Box p={[0, 0, 0]} s={[0.34, 0.12, 0.34]} color={STONE} />
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.15, 0.26, 0.9, 8]} />
        <Toon color={STONE} />
      </mesh>
      <Roof p={[0, 0.98, 0]} r={0.18} h={0.16} color={WOOD} />
      <group ref={blades} position={[0, 0.82, 0.26]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI) / 2 + Math.PI / 4]}>
            <boxGeometry args={[0.18, 0.8, 0.03]} />
            <Toon color={i % 2 ? WHITE : accent} />
          </mesh>
        ))}
        <mesh>
          <boxGeometry args={[0.14, 0.14, 0.13]} />
          <Toon color={WOOD} />
        </mesh>
      </group>
    </group>
  );
}

function Rotunda({ accent }: { accent: string }) {
  return (
    <group>
      {/* wide stepped stylobate */}
      <Box p={[0, 0, 0]} s={[0.9, 0.08, 0.9]} color={STONE_DK} />
      <Box p={[0, 0.08, 0]} s={[0.74, 0.07, 0.74]} color={STONE} />
      {/* colonnade */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.3, 0.33, Math.sin(a) * 0.3]}
          >
            <cylinderGeometry args={[0.04, 0.04, 0.42, 6]} />
            <Toon color={WHITE} />
          </mesh>
        );
      })}
      {/* entablature ring */}
      <mesh position={[0, 0.56, 0]}>
        <cylinderGeometry args={[0.36, 0.36, 0.08, 12]} />
        <Toon color={STONE} />
      </mesh>
      {/* low dome */}
      <mesh position={[0, 0.6, 0]} scale={[1, 0.42, 1]}>
        <sphereGeometry args={[0.3, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <Toon color={accent} />
      </mesh>
      <mesh position={[0, 0.74, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.1, 6]} />
        <Toon color={WHITE} />
      </mesh>
    </group>
  );
}

function Tower({ accent }: { accent: string }) {
  const tiers = [
    { w: 0.5, y: 0 },
    { w: 0.38, y: 0.18 },
    { w: 0.27, y: 0.36 },
    { w: 0.17, y: 0.54 },
  ];
  return (
    <group>
      {tiers.map((t, i) => (
        <Box key={i} p={[0, t.y, 0]} s={[t.w, 0.2, t.w]} color={i % 2 ? STONE_DK : STONE} />
      ))}
      <mesh position={[0, 0.78, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.24, 4]} />
        <Toon color={WOOD} />
      </mesh>
      <mesh position={[0.09, 0.84, 0]}>
        <boxGeometry args={[0.16, 0.1, 0.02]} />
        <Toon color={accent} />
      </mesh>
    </group>
  );
}

function TwinHuts({ accent }: { accent: string }) {
  return (
    <group>
      {[-0.38, 0.38].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <Box p={[0, 0, 0]} s={[0.32, 0.1, 0.32]} color={STONE_DK} />
          <Box p={[0, 0.1, 0]} s={[0.22, 0.16, 0.22]} color={STONE} />
          <Roof p={[0, 0.26, 0]} r={0.2} h={0.16} color={accent} />
        </group>
      ))}
      {/* plank bridge */}
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.56, 0.03, 0.16]} />
        <Toon color={WOOD} />
      </mesh>
      {[-0.06, 0.06].map((z) => (
        <mesh key={z} position={[0, 0.19, z]}>
          <boxGeometry args={[0.56, 0.03, 0.015]} />
          <Toon color={WOOD} />
        </mesh>
      ))}
    </group>
  );
}

function Lighthouse({ accent, variant }: { accent: string; variant: Variant }) {
  const lampGroup = useRef<THREE.Group>(null);
  const glow = useRef<THREE.MeshToonMaterial>(null);
  useFrame(({ clock }, dt) => {
    if (lampGroup.current) lampGroup.current.rotation.y += dt * 2.2;
    if (glow.current)
      glow.current.emissiveIntensity =
        1.6 + Math.sin(clock.elapsedTime * 6) * 0.5;
  });
  return (
    <group>
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.3, 0.34, 0.08, 12]} />
        <Toon color={STONE_DK} />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.12, 0.22, 0.72, 12]} />
        <Toon color={WHITE} />
      </mesh>
      {[0.24, 0.5].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <cylinderGeometry args={[0.15, 0.18, 0.09, 12]} />
          <Toon color={accent} />
        </mesh>
      ))}
      <mesh position={[0, 0.84, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.14, 8]} />
        <meshToonMaterial
          ref={glow}
          color={"#fff2c0"}
          gradientMap={GRAD}
          emissive={"#ffe08a"}
          emissiveIntensity={1.8}
        />
      </mesh>
      {variant === "map" && (
        <group ref={lampGroup} position={[0, 0.84, 0]}>
          <mesh position={[0, 0, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.09, 0.5, 4]} />
            <meshToonMaterial
              color={"#ffe08a"}
              gradientMap={GRAD}
              emissive={"#ffe08a"}
              emissiveIntensity={1.2}
              transparent
              opacity={0.5}
            />
          </mesh>
        </group>
      )}
      <Roof p={[0, 0.91, 0]} r={0.17} h={0.14} color={STONE_DK} />
    </group>
  );
}

export function Landmark({
  id,
  variant = "map",
}: {
  id: ContinentId;
  variant?: Variant;
}) {
  const accent = continentColors[id] ?? "#5ef0c4";
  switch (id) {
    case "about":
      return <About accent={accent} />;
    case "general":
      return <Windmill accent={accent} />;
    case "gallery":
      return <Rotunda accent={accent} />;
    case "portfolio":
      return <Tower accent={accent} />;
    case "other":
      return <TwinHuts accent={accent} />;
    case "contact":
      return <Lighthouse accent={accent} variant={variant} />;
    default:
      return null;
  }
}

// ---- placement wrappers -------------------------------------------------

const GLOBE_SCALE = 0.46;
const UP = new THREE.Vector3(0, 1, 0);

// All 6 landmarks planted on the globe surface, normal-aligned. Mount as a child
// of the Globe's spinning group so they turn with the planet.
export function GlobeLandmarks() {
  return (
    <group>
      {CONTINENTS.map((c) => {
        const rp = REGION_POS[c.id];
        const r = GLOBE_BASE_R + (regionLevel(c.id) / 5) * GLOBE_RELIEF;
        const pos = uvToSphere(rp.u, rp.v, r);
        const quat = new THREE.Quaternion().setFromUnitVectors(
          UP,
          pos.clone().normalize(),
        );
        return (
          <group
            key={c.id}
            position={pos}
            quaternion={quat}
            scale={GLOBE_SCALE}
          >
            <Landmark id={c.id} variant="globe" />
          </group>
        );
      })}
    </group>
  );
}
