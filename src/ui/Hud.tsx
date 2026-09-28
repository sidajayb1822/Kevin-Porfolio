import { palette } from "../lib/palette";

interface Props {
  title: string;
  onExit: () => void;
}

export default function Hud({ title, onExit }: Props) {
  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          right: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          zIndex: 5000,
          pointerEvents: "none",
        }}
      >
        <div
          className="pixel-panel"
          style={{ padding: "8px 12px", fontSize: 10, pointerEvents: "auto" }}
        >
          {title.toUpperCase()}
        </div>
        <button
          className="pixel-btn"
          style={{ fontSize: 9, pointerEvents: "auto" }}
          onClick={onExit}
        >
          ✕ MAP
        </button>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 10,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 8,
          color: palette.parchmentDim,
          textShadow: "1px 1px 0 #000",
          zIndex: 5000,
          pointerEvents: "none",
        }}
        className="hud-hint"
      >
        ARROWS / WASD MOVE · E / SPACE ACTION · ESC BACK
      </div>
    </>
  );
}
