import { lazy, Suspense } from "react";
import { useRouteSync } from "./routes";
import { useGame } from "./store/gameStore";
import Flash from "./transitions/Flash";
import MuteButton from "./ui/MuteButton";
import { palette } from "./lib/palette";

const WorldScene = lazy(() => import("./scenes/World/WorldScene"));
const Overworld = lazy(() => import("./scenes/Overworld/Overworld"));

function Loading() {
  return (
    <div
      className="screen-fill center-stack"
      style={{ background: palette.void, color: palette.parchmentDim, fontSize: 10 }}
    >
      LOADING…
    </div>
  );
}

export default function App() {
  useRouteSync();
  const phase = useGame((s) => s.phase);

  const showWorld =
    phase === "space" ||
    phase === "diving" ||
    phase === "select" ||
    phase === "entering";
  const showOverworld = phase === "overworld" || phase === "panel";

  return (
    <div className="screen-fill">
      <Suspense fallback={<Loading />}>
        {showWorld && <WorldScene />}
        {showOverworld && <Overworld />}
      </Suspense>

      <Flash />

      {/* one uniform CRT look across orbit, map and overworld */}
      <div className="crt-overlay" />
      <div className="crt-vignette" />
      <MuteButton />
    </div>
  );
}
