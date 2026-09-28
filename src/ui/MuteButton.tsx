import { useGame } from "../store/gameStore";
import { setMuted } from "../lib/audio";

export default function MuteButton() {
  const muted = useGame((s) => s.muted);
  const audioUnlocked = useGame((s) => s.audioUnlocked);
  const toggleMute = useGame((s) => s.toggleMute);

  if (!audioUnlocked) return null;

  return (
    <button
      className="pixel-btn"
      style={{
        position: "absolute",
        right: 12,
        bottom: 12,
        zIndex: 9500,
        fontSize: 10,
      }}
      onClick={() => {
        const next = !muted;
        setMuted(next);
        toggleMute();
      }}
    >
      {muted ? "♪ OFF" : "♪ ON"}
    </button>
  );
}
