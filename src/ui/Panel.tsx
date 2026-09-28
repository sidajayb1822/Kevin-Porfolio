import { useEffect } from "react";
import type { PanelContent } from "../data/content";
import { palette } from "../lib/palette";
import { sfx } from "../lib/audio";

interface Props {
  content: PanelContent;
  onClose: () => void;
}

export default function Panel({ content, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["Escape", "Space", "Enter", "KeyE"].includes(e.code)) {
        e.preventDefault();
        sfx.close();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(5,6,15,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        zIndex: 7000,
      }}
      onClick={() => {
        sfx.close();
        onClose();
      }}
    >
      <div
        className="pixel-panel"
        style={{ maxWidth: 560, width: "100%", maxHeight: "80vh", overflow: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            fontSize: 14,
            color: palette.aurora,
            marginBottom: 14,
            textShadow: "2px 2px 0 #000",
          }}
        >
          {content.title}
        </h2>
        <div style={{ display: "grid", gap: 12 }}>{content.body}</div>
        <button
          className="pixel-btn"
          style={{ marginTop: 18 }}
          onClick={() => {
            sfx.close();
            onClose();
          }}
        >
          ✕ CLOSE (ESC)
        </button>
      </div>
    </div>
  );
}
