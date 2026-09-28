import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { useGame } from "../../store/gameStore";
import { cloudSheetUrl } from "./clouds";

// Full-screen pixel cloud cover that closes during the dive, then splits down
// the vertical centre and slides fully apart to reveal the map.
export default function CloudCurtain() {
  const phase = useGame((s) => s.phase);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const sheet = cloudSheetUrl();
  const mounted = useRef(false);

  useLayoutEffect(() => {
    const L = leftRef.current!;
    const R = rightRef.current!;
    gsap.killTweensOf([L, R]);

    const part = (instant: boolean) => {
      if (instant) {
        gsap.set(L, { xPercent: -110, opacity: 0 });
        gsap.set(R, { xPercent: 110, opacity: 0 });
        return;
      }
      const tl = gsap.timeline();
      tl.to(L, { xPercent: -110, duration: 1.5, ease: "power2.inOut" }, 0);
      tl.to(R, { xPercent: 110, duration: 1.5, ease: "power2.inOut" }, 0);
      tl.to([L, R], { opacity: 0, duration: 1.5, ease: "power2.in" }, 0.2);
    };

    if (!mounted.current) {
      mounted.current = true;
      if (phase === "select") part(true);
      else gsap.set([L, R], { opacity: 0, xPercent: 0 });
      return;
    }

    if (phase === "diving") {
      gsap.set([L, R], { xPercent: 0 });
      gsap.fromTo(
        [L, R],
        { opacity: 0 },
        { opacity: 1, duration: 1.3, ease: "power2.in", delay: 0.35 },
      );
    } else if (phase === "select") {
      part(false);
    } else if (phase === "space" || phase === "entering") {
      gsap.to([L, R], { opacity: 0, duration: 0.45 });
      gsap.set([L, R], { xPercent: 0 });
    } else {
      gsap.set([L, R], { xPercent: 0, opacity: 1 });
    }
  }, [phase]);

  const half: React.CSSProperties = {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "50%",
    opacity: 0,
    backgroundImage: `url(${sheet})`,
    backgroundSize: "auto 130%",
    backgroundRepeat: "repeat-x",
    imageRendering: "pixelated",
    pointerEvents: "none",
  };

  return (
    <div
      className="screen-fill"
      style={{ overflow: "hidden", pointerEvents: "none", zIndex: 40 }}
    >
      <div ref={leftRef} style={{ ...half, left: 0 }} />
      <div ref={rightRef} style={{ ...half, right: 0 }} />
    </div>
  );
}
