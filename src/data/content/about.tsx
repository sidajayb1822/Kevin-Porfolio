import type { ReactNode } from "react";

export interface PanelContent {
  title: string;
  body: ReactNode;
}

// TODO: replace all copy below with Siddhant's real words.
export const aboutContent: Record<string, PanelContent> = {
  bio: {
    title: "BIO",
    body: (
      <>
        <p>
          [TODO: real copy] Siddhant is a maker who builds vivid little worlds —
          games, illustrations, and interactive experiments.
        </p>
        <p>
          Based somewhere with good coffee. Trained in [field]. Currently
          exploring [theme].
        </p>
      </>
    ),
  },
  timeline: {
    title: "TIMELINE",
    body: (
      <ul style={{ paddingLeft: 18 }}>
        <li>20XX — Started drawing things that move.</li>
        <li>20XX — First shipped project.</li>
        <li>20XX — [milestone].</li>
        <li>Now — Building Siddhant&apos;s World.</li>
      </ul>
    ),
  },
  skills: {
    title: "SKILLS & TOOLS",
    body: (
      <>
        <p>Craft: illustration, pixel art, animation, game feel.</p>
        <p>Tools: [tool], [tool], [tool].</p>
        <p>Also curious about: sound design, worldbuilding, teaching.</p>
      </>
    ),
  },
};
