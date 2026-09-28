import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { useGame } from "../../store/gameStore";
import { sfx } from "../../lib/audio";
import {
  SPACE_KEY,
  DIVE_KEY,
  mapKey,
  enterKey,
  uvToWorld,
  type CamKey,
} from "./layout";
import { REGION_POS } from "./worldgen";
import type { ContinentId } from "../../data/continents";

// One camera, gsap-driven per phase. Absorbs the old DiveRig.
export default function CameraRig() {
  const phase = useGame((s) => s.phase);
  const currentContinent = useGame((s) => s.currentContinent);
  const setPhase = useGame((s) => s.setPhase);
  const landInOverworld = useGame((s) => s.landInOverworld);

  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const look = useRef(new THREE.Vector3());
  const tweenLook = useRef({ x: 0, y: 0, z: 0 });

  const apply = (k: CamKey) => {
    camera.position.set(...k.pos);
    camera.fov = k.fov;
    camera.updateProjectionMatrix();
    look.current.set(...k.look);
    camera.lookAt(look.current);
    tweenLook.current = { x: k.look[0], y: k.look[1], z: k.look[2] };
  };

  const animate = (k: CamKey, dur: number, ease: string, onDone?: () => void) => {
    const tl = gsap.timeline({ onComplete: onDone });
    tl.to(camera.position, { x: k.pos[0], y: k.pos[1], z: k.pos[2], duration: dur, ease }, 0);
    tl.to(camera, {
      fov: k.fov,
      duration: dur,
      ease,
      onUpdate: () => camera.updateProjectionMatrix(),
    }, 0);
    tl.to(tweenLook.current, {
      x: k.look[0], y: k.look[1], z: k.look[2],
      duration: dur, ease,
      onUpdate: () => {
        look.current.set(tweenLook.current.x, tweenLook.current.y, tweenLook.current.z);
        camera.lookAt(look.current);
      },
    }, 0);
    return tl;
  };

  const aspect = size.width / size.height;

  // Snap to the right keyframe when we mount directly into a phase
  // (deep link / return from overworld).
  useEffect(() => {
    if (phase === "select") apply(mapKey(aspect));
    else if (phase === "space") apply(SPACE_KEY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep the map filling the screen on resize
  useEffect(() => {
    if (phase === "select") apply(mapKey(aspect));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspect]);

  useEffect(() => {
    let tl: gsap.core.Timeline | undefined;

    if (phase === "diving") {
      sfx.warp();
      tl = animate(DIVE_KEY, 1.9, "power2.in", () => setPhase("select"));
    } else if (phase === "select") {
      // we're covered by cloud here — snap, CloudCurtain does the reveal
      apply(mapKey(aspect));
    } else if (phase === "space") {
      tl = animate(SPACE_KEY, 1.4, "power2.out");
    } else if (phase === "entering" && currentContinent) {
      const rp = REGION_POS[currentContinent as ContinentId];
      const w = uvToWorld(rp.u, rp.v);
      tl = animate(enterKey(w), 0.9, "power2.in", () => landInOverworld());
    }

    return () => {
      tl?.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  return null;
}
