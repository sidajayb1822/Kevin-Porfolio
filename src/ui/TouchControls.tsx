import type { Dir } from "../engine/types";
import type { InputState } from "../engine/input";
import { palette } from "../lib/palette";

interface Props {
  input: InputState;
}

const btnStyle: React.CSSProperties = {
  width: 56,
  height: 56,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: palette.ink,
  color: palette.parchment,
  border: `3px solid ${palette.parchment}`,
  boxShadow: "3px 3px 0 rgba(0,0,0,0.5)",
  fontSize: 16,
  touchAction: "none",
  userSelect: "none",
};

export default function TouchControls({ input }: Props) {
  const bind = (dir: Dir) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      input.press(dir);
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      input.release(dir);
    },
    onPointerLeave: () => input.release(dir),
    onPointerCancel: () => input.release(dir),
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 6000,
      }}
    >
      {/* D-pad */}
      <div
        style={{
          position: "absolute",
          left: 16,
          bottom: 20,
          display: "grid",
          gridTemplateColumns: "repeat(3, 56px)",
          gridTemplateRows: "repeat(3, 56px)",
          gap: 4,
          pointerEvents: "auto",
        }}
      >
        <span />
        <div style={btnStyle} {...bind("up")}>
          ▲
        </div>
        <span />
        <div style={btnStyle} {...bind("left")}>
          ◀
        </div>
        <span />
        <div style={btnStyle} {...bind("right")}>
          ▶
        </div>
        <span />
        <div style={btnStyle} {...bind("down")}>
          ▼
        </div>
        <span />
      </div>

      {/* action button */}
      <div
        style={{
          position: "absolute",
          right: 20,
          bottom: 40,
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            ...btnStyle,
            width: 72,
            height: 72,
            borderRadius: 0,
            background: palette.gold,
            color: palette.ink,
          }}
          onPointerDown={(e) => {
            e.preventDefault();
            input.queueAction();
          }}
        >
          A
        </div>
      </div>
    </div>
  );
}
