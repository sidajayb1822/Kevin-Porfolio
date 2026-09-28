import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Pixelation } from "@react-three/postprocessing";
import Starfield from "./Starfield";
import Globe from "./Globe";
import ReliefMap from "./ReliefMap";
import RegionMarkers from "./RegionMarkers";
import CameraRig from "./CameraRig";
import CloudCurtain from "./CloudCurtain";
import { SPACE_KEY } from "./layout";
import { useGame } from "../../store/gameStore";
import { unlockAudio, startDrone, sfx } from "../../lib/audio";
import { palette } from "../../lib/palette";

export default function WorldScene() {
  const phase = useGame((s) => s.phase);
  const beginDive = useGame((s) => s.beginDive);
  const unlockAudioFlag = useGame((s) => s.unlockAudio);
  const audioUnlocked = useGame((s) => s.audioUnlocked);
  const returnToSpace = useGame((s) => s.returnToSpace);
  const [hover, setHover] = useState(false);

  const inSpace = phase === "space";
  const inDiving = phase === "diving";
  const inMap = phase === "select" || phase === "entering";

  const handleDive = () => {
    if (!inSpace) return;
    if (!audioUnlocked) {
      unlockAudio();
      unlockAudioFlag();
      startDrone(90);
    }
    sfx.confirm();
    beginDive();
  };

  return (
    <div
      className="screen-fill"
      style={{ background: inMap ? palette.seaAbyss : palette.void }}
    >
      <Canvas
        camera={{ position: SPACE_KEY.pos, fov: SPACE_KEY.fov }}
        gl={{ antialias: false }}
        dpr={[1, 1.5]}
      >
        <color
          attach="background"
          args={[inMap ? palette.seaAbyss : palette.void]}
        />
        <ambientLight intensity={0.62} />
        <directionalLight position={[4, 8, 5]} intensity={1.5} color={"#fff2dc"} />
        <directionalLight position={[-6, 2, -3]} intensity={0.3} color={palette.sky} />

        <Starfield dimmed={!inSpace && !inDiving} />
        <Globe
          visible={inSpace || inDiving}
          spinning={inSpace}
          onPointerOver={() => setHover(true)}
          onPointerOut={() => setHover(false)}
          onClick={handleDive}
        />
        <ReliefMap visible={inMap} />
        <RegionMarkers active={inMap} />
        <CameraRig />

        <EffectComposer>
          <Pixelation granularity={3} />
        </EffectComposer>
      </Canvas>

      <CloudCurtain />

      {inSpace && (
        <div
          className="screen-fill center-stack"
          style={{ pointerEvents: "none", padding: 24, zIndex: 50 }}
        >
          <div style={{ flex: 1 }} />
          <h1
            style={{
              fontSize: "clamp(14px, 3.4vw, 28px)",
              letterSpacing: 2,
              textShadow: "3px 3px 0 #000",
              color: palette.parchment,
              marginBottom: 18,
            }}
          >
            KEVIN&apos;S WORLD
          </h1>
          <p
            className="blink"
            style={{
              fontSize: "clamp(8px, 1.8vw, 12px)",
              color: hover ? palette.aurora : palette.parchmentDim,
              textShadow: "2px 2px 0 #000",
              marginBottom: "8vh",
            }}
          >
            ▶ CLICK THE PLANET TO ENTER
          </p>
        </div>
      )}

      {phase === "select" && (
        <>
          <div
            style={{
              position: "absolute",
              bottom: 16,
              left: 0,
              right: 0,
              textAlign: "center",
              color: palette.parchment,
              fontSize: "clamp(8px, 1.7vw, 11px)",
              textShadow: "2px 2px 0 rgba(0,0,0,0.6)",
              pointerEvents: "none",
              zIndex: 50,
            }}
          >
            CHOOSE A CONTINENT
          </div>
          <button
            className="pixel-btn"
            style={{ position: "absolute", top: 14, left: 14, zIndex: 50 }}
            onClick={() => {
              sfx.close();
              returnToSpace();
            }}
          >
            ↑ ORBIT
          </button>
        </>
      )}
    </div>
  );
}
