import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { generateWorld } from "./worldgen";
import { makeToonGradient } from "./toon";
import { GLOBE_BASE_R, GLOBE_RELIEF } from "./layout";
import { GlobeLandmarks } from "./landmarks";

interface Props {
  visible: boolean;
  spinning: boolean;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
  onClick?: () => void;
}

export default function Globe({
  visible,
  spinning,
  onPointerOver,
  onPointerOut,
  onClick,
}: Props) {
  const ref = useRef<THREE.Group>(null);
  const world = generateWorld();
  const gradient = makeToonGradient(3);

  // CPU-displace the sphere from the height texture and recompute normals, so
  // the terraces catch light as real relief (a displacementMap moves geometry
  // but not normals, which reads flat). Poles are already tapered in worldgen.
  const geometry = useMemo(() => {
    const g = new THREE.SphereGeometry(GLOBE_BASE_R, 256, 176);
    const canvas = world.heightMap.image as HTMLCanvasElement;
    const cw = canvas.width;
    const ch = canvas.height;
    const px = canvas.getContext("2d")!.getImageData(0, 0, cw, ch).data;
    const pos = g.attributes.position as THREE.BufferAttribute;
    const uv = g.attributes.uv as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      // three's sphere uv is (u, 1-v_iy); worldgen row = v_iy = 1 - uv.y
      const tx = Math.min(cw - 1, Math.max(0, Math.round(uv.getX(i) * (cw - 1))));
      const ty = Math.min(
        ch - 1,
        Math.max(0, Math.round((1 - uv.getY(i)) * (ch - 1))),
      );
      const h = px[(ty * cw + tx) * 4] / 255; // 0..1
      v.fromBufferAttribute(pos, i).normalize();
      v.multiplyScalar(GLOBE_BASE_R + h * GLOBE_RELIEF);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    pos.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }, [world]);

  useFrame((_, dt) => {
    if (spinning && ref.current) ref.current.rotation.y += dt * 0.06;
  });

  return (
    <group ref={ref} visible={visible}>
      <mesh
        geometry={geometry}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (visible) {
            document.body.style.cursor = "pointer";
            onPointerOver?.();
          }
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
          onPointerOut?.();
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (visible) onClick?.();
        }}
      >
        <meshToonMaterial map={world.colorMap} gradientMap={gradient} />
      </mesh>

      {/* hard rim — a thin darker shell read as a pixel outline, sized just past
          the tallest peak so mountains never break the silhouette. */}
      <mesh>
        <sphereGeometry args={[GLOBE_BASE_R + GLOBE_RELIEF + 0.04, 64, 40]} />
        <meshBasicMaterial color={"#0a1b3a"} side={THREE.BackSide} />
      </mesh>

      <GlobeLandmarks />
    </group>
  );
}
