import { useEffect, useState } from "react";
import { useGame } from "../store/gameStore";

// Brief opacity flash that hides the hard cut from the world map into the pixel
// overworld (and back).
export default function Flash() {
  const phase = useGame((s) => s.phase);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    if (phase === "entering") setOpacity(0.92);
    else setOpacity(0);
  }, [phase]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#f4ecd8",
        opacity,
        transition: "opacity 450ms ease",
        pointerEvents: opacity > 0.02 ? "auto" : "none",
        zIndex: 8000,
      }}
    />
  );
}
