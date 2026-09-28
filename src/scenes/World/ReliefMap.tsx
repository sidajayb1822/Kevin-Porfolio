import { useMemo } from "react";
import * as THREE from "three";
import { generateWorld } from "./worldgen";
import { makeToonGradient } from "./toon";
import { MAP_W, MAP_D, VCROP_MIN, VCROP_SPAN } from "./layout";
import { palette } from "../../lib/palette";

// The terraced pixel relief slab — same toon material family as the Globe.
export default function ReliefMap({ visible }: { visible: boolean }) {
  const world = generateWorld();
  const gradient = makeToonGradient(3);

  // Crop the equirect texture to v ∈ [0.06, 0.94] so the white polar rows never
  // show as a bright band along the tilted map's edge.
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(MAP_W, MAP_D, 384, 216);
    const uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) {
      uv.setY(i, VCROP_MIN + uv.getY(i) * VCROP_SPAN);
    }
    uv.needsUpdate = true;
    return g;
  }, []);

  return (
    <group visible={visible}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={geometry}>
        <meshToonMaterial
          map={world.colorMap}
          gradientMap={gradient}
          displacementMap={world.heightMap}
          displacementScale={2.0}
          displacementBias={-0.2}
        />
      </mesh>

      {/* surrounding sea — same toon material + deep-sea colour as the map's
          own ocean band, so the map edge is seamless at any aspect */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.205, 0]}>
        <planeGeometry args={[MAP_W * 6, MAP_D * 6]} />
        <meshToonMaterial color={palette.seaAbyss} gradientMap={gradient} />
      </mesh>
    </group>
  );
}
