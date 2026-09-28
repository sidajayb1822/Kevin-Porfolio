import { useCallback, useEffect, useRef, useState } from "react";
import { palette } from "../lib/palette";
import { sfx } from "../lib/audio";

interface Props {
  lines: string[];
  onClose: () => void;
}

export default function DialogBox({ lines, onClose }: Props) {
  const [page, setPage] = useState(0);
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);
  const intervalRef = useRef<number | undefined>(undefined);
  const full = lines[page] ?? "";

  // run the typewriter for the current page
  useEffect(() => {
    setShown("");
    setDone(false);
    let i = 0;
    window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      i++;
      setShown(full.slice(0, i));
      if (i >= full.length) {
        window.clearInterval(intervalRef.current);
        setDone(true);
      }
    }, 16);
    return () => window.clearInterval(intervalRef.current);
  }, [full]);

  const advance = useCallback(() => {
    if (!done) {
      window.clearInterval(intervalRef.current);
      setShown(full);
      setDone(true);
      return;
    }
    if (page < lines.length - 1) {
      sfx.select();
      setPage((p) => p + 1);
    } else {
      sfx.close();
      onClose();
    }
  }, [done, full, page, lines.length, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["Space", "Enter", "KeyE"].includes(e.code)) {
        e.preventDefault();
        advance();
      } else if (e.code === "Escape") {
        e.preventDefault();
        sfx.close();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, onClose]);

  const last = page >= lines.length - 1;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        padding: "0 16px 16px",
        zIndex: 7000,
      }}
      onClick={advance}
    >
      <div
        className="pixel-panel"
        style={{ maxWidth: 720, margin: "0 auto", minHeight: 96 }}
      >
        <div style={{ minHeight: 54 }}>{shown}</div>
        <div
          className="blink"
          style={{
            textAlign: "right",
            color: palette.gold,
            fontSize: 10,
            marginTop: 8,
          }}
        >
          {done ? (last ? "✕ CLOSE" : "▼ NEXT") : ""}
        </div>
      </div>
    </div>
  );
}
