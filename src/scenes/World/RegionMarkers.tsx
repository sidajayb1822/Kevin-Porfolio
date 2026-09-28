import { useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CONTINENTS, type ContinentId } from "../../data/continents";
import { continentColors, palette } from "../../lib/palette";
import { REGION_POS, regionLevel, regionElevation } from "./worldgen";
import { uvToWorld } from "./layout";
import { Landmark } from "./landmarks";
import { useGame } from "../../store/gameStore";
import { sfx } from "../../lib/audio";

const MAP_SCALE = 1.15;

function Marker({
  id,
  onPick,
}: {
  id: ContinentId;
  onPick: (id: ContinentId) => void;
}) {
  const meta = CONTINENTS.find((c) => c.id === id)!;
  const rp = REGION_POS[id];
  const pos = uvToWorld(rp.u, rp.v, 0);
  const groundY = regionElevation(regionLevel(id));
  const [hover, setHover] = useState(false);
  const ringRef = useRef<THREE.Mesh>(null);
  const color = continentColors[id];

  useFrame((state) => {
    if (ringRef.current) {
      const s = 1 + (hover ? 0.3 : 0) + Math.sin(state.clock.elapsedTime * 3) * 0.08;
      ringRef.current.scale.setScalar(s);
    }
  });

  return (
    <group position={[pos.x, groundY, pos.z]}>
      {/* raycast target */}
      <mesh
        position={[0, 1.1, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = "auto";
        }}
        onClick={(e) => {
          e.stopPropagation();
          onPick(id);
        }}
      >
        <cylinderGeometry args={[1.1, 1.1, 2.6, 20]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* themed structure sitting on the terrain */}
      <group scale={MAP_SCALE}>
        <Landmark id={id} />
      </group>

      {/* territory ring on the ground — low-seg so it reads as pixels */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[0.6, 0.82, 8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={meta.ready ? (hover ? 1 : 0.6) : 0.32}
          side={THREE.DoubleSide}
        />
      </mesh>

      <Html position={[0, 2.1, 0]} center distanceFactor={13} zIndexRange={[20, 0]}>
        <div
          onClick={() => onPick(id)}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 8px",
            whiteSpace: "nowrap",
            cursor: "pointer",
            background: palette.ink,
            color: palette.parchment,
            border: `2px solid ${palette.parchment}`,
            boxShadow: `3px 3px 0 rgba(0,0,0,0.55)`,
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 7,
            imageRendering: "pixelated",
            opacity: meta.ready ? 1 : 0.72,
            transform: hover ? "translateY(-3px)" : "none",
            transition: "transform 120ms",
          }}
        >
          <span>{meta.title.toUpperCase()}</span>
          {!meta.ready && <span style={{ opacity: 0.6, color }}>· SOON</span>}
        </div>
      </Html>
    </group>
  );
}

export default function RegionMarkers({ active }: { active: boolean }) {
  const enterContinent = useGame((s) => s.enterContinent);
  const phase = useGame((s) => s.phase);

  const pick = (id: ContinentId) => {
    if (phase !== "select") return;
    sfx.select();
    enterContinent(id);
  };

  if (!active) return null;
  return (
    <group>
      {CONTINENTS.map((c) => (
        <Marker key={c.id} id={c.id} onPick={pick} />
      ))}
    </group>
  );
}
