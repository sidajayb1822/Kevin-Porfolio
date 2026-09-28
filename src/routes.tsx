import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useGame, type Phase } from "./store/gameStore";
import { isContinentId } from "./data/continents";

// Maps the current phase to a canonical URL.
function phaseToPath(phase: Phase, continent: string | null): string {
  switch (phase) {
    case "space":
    case "diving":
      return "/";
    case "select":
      return "/world";
    case "entering":
    case "overworld":
    case "panel":
      return continent ? `/world/${continent}` : "/world";
  }
}

// Keeps the URL and the game phase in sync, in both directions.
// The starting phase is already derived from the URL in the store, so this
// only has to handle transitions and browser back/forward.
export function useRouteSync() {
  const location = useLocation();
  const navigate = useNavigate();
  const phase = useGame((s) => s.phase);
  const currentContinent = useGame((s) => s.currentContinent);
  const suppressPop = useRef(false);

  // Phase changes -> push URL.
  useEffect(() => {
    const target = phaseToPath(phase, currentContinent);
    if (target !== location.pathname) {
      suppressPop.current = true;
      navigate(target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentContinent]);

  // URL changes (mainly browser back/forward) -> move the phase to match.
  useEffect(() => {
    if (suppressPop.current) {
      suppressPop.current = false;
      return;
    }
    const parts = location.pathname.split("/").filter(Boolean);
    const store = useGame.getState();
    if (parts.length === 0) {
      if (store.phase !== "space") store.returnToSpace();
    } else if (parts[0] === "world" && !parts[1]) {
      if (store.phase !== "select") store.returnToSelect();
    } else if (parts[0] === "world" && isContinentId(parts[1])) {
      if (store.currentContinent !== parts[1] || store.phase === "select") {
        store.enterContinent(parts[1]);
        store.landInOverworld();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);
}
