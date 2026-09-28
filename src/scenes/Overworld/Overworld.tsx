import { useEffect, useRef, useState } from "react";
import { OverworldEngine } from "../../engine/OverworldEngine";
import type { InputState } from "../../engine/input";
import type { Interactable } from "../../engine/types";
import { loadMap } from "../../data/maps";
import { getPlayerSprite } from "../../engine/assets";
import { getContent, type PanelContent } from "../../data/content";
import { CONTINENT_BY_ID } from "../../data/continents";
import { useGame } from "../../store/gameStore";
import { sfx } from "../../lib/audio";
import DialogBox from "../../ui/DialogBox";
import Panel from "../../ui/Panel";
import Hud from "../../ui/Hud";
import TouchControls from "../../ui/TouchControls";

export default function Overworld() {
  const continent = useGame((s) => s.currentContinent);
  const openPanel = useGame((s) => s.openPanel);
  const closePanel = useGame((s) => s.closePanel);
  const returnToSelect = useGame((s) => s.returnToSelect);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<OverworldEngine | null>(null);
  const inputRef = useRef<InputState | null>(null);

  const [dialog, setDialog] = useState<string[] | null>(null);
  const [panel, setPanel] = useState<PanelContent | null>(null);
  const [showTouch, setShowTouch] = useState(false);
  const [curtain, setCurtain] = useState(1);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!continent || !canvasRef.current) return;
    const canvas = canvasRef.current;
    let cancelled = false;
    setCurtain(1);

    const handleInteract = (it: Interactable) => {
      if (it.kind === "portal") {
        sfx.warp();
        setCurtain(1);
        window.setTimeout(() => returnToSelect(), 260);
        return;
      }
      engineRef.current?.pause();
      if (it.kind === "sign" && it.dialogue) {
        sfx.open();
        setDialog(it.dialogue);
        openPanel();
      } else if (it.kind === "exhibit" && it.contentId) {
        const c = getContent(continent, it.contentId);
        if (c) {
          sfx.open();
          setPanel(c);
          openPanel();
        } else {
          engineRef.current?.resume();
        }
      } else {
        engineRef.current?.resume();
      }
    };

    const onResize = () => engineRef.current?.resize();

    Promise.all([loadMap(continent), getPlayerSprite().catch(() => null)])
      .then(([map, sprite]) => {
        if (cancelled) return;
        const engine = new OverworldEngine(
          canvas,
          map,
          { onInteract: handleInteract, onStep: () => sfx.step() },
          sprite,
        );
        engineRef.current = engine;
        inputRef.current = engine.getInput();
        engine.start();
        window.addEventListener("resize", onResize);
        // fade the white curtain away once the first frames have drawn
        requestAnimationFrame(() => requestAnimationFrame(() => {
          if (!cancelled) setCurtain(0);
        }));
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      engineRef.current?.dispose();
      engineRef.current = null;
      inputRef.current = null;
    };
  }, [continent, openPanel, returnToSelect]);

  // detect touch capability
  useEffect(() => {
    const check = () => {
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      const narrow = window.innerWidth < 760;
      if (coarse || narrow) setShowTouch(true);
    };
    check();
    const onTouch = () => setShowTouch(true);
    window.addEventListener("touchstart", onTouch, { once: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("resize", check);
    };
  }, []);

  const closeAll = () => {
    setDialog(null);
    setPanel(null);
    closePanel();
    engineRef.current?.resume();
  };

  if (!continent) return null;
  const meta = CONTINENT_BY_ID[continent];

  return (
    <div className="screen-fill" style={{ background: "#0b1026" }}>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          imageRendering: "pixelated",
          display: "block",
        }}
      />

      <Hud
        title={meta.title}
        onExit={() => {
          sfx.warp();
          setCurtain(1);
          window.setTimeout(() => returnToSelect(), 260);
        }}
      />

      {showTouch && inputRef.current && !dialog && !panel && (
        <TouchControls input={inputRef.current} />
      )}

      {dialog && <DialogBox lines={dialog} onClose={closeAll} />}
      {panel && <Panel content={panel} onClose={closeAll} />}

      <div
        className="center-stack"
        style={{
          position: "absolute",
          inset: 0,
          background: "#ffffff",
          color: "#12132b",
          fontSize: 10,
          opacity: loadError ? 1 : curtain,
          transition: "opacity 500ms ease",
          pointerEvents: loadError || curtain > 0.02 ? "auto" : "none",
          zIndex: 7500,
        }}
      >
        {loadError && "COULDN'T LOAD THIS PLACE — REFRESH TO RETRY"}
      </div>
    </div>
  );
}
