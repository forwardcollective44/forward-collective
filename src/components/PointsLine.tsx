"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The points system, drawn as a horizontal progress line instead of a bullet
 * list. Each node is a reward milestone with a clear reward + points label.
 * The gold fill animates to the member's current balance on load — so it always
 * picks up where they left off (the value comes from the database). As the fill
 * moves, only the milestones it has passed (the ones you've unlocked) light up;
 * everything ahead of you stays in the regular muted state.
 */

type Node = { points: number; reward: string; label: string };

const NODES: Node[] = [
  { points: 0, reward: "Join", label: "+50 pts" },
  { points: 150, reward: "$5 off", label: "150 pts" },
  { points: 300, reward: "$12 off", label: "300 pts" },
  { points: 600, reward: "$25 off", label: "600 pts" },
  { points: 1000, reward: "$40 off", label: "1,000 pts" },
  { points: 1750, reward: "$75 off", label: "1,750 pts" },
  { points: 2500, reward: "$100 off", label: "2,500 pts" },
  { points: 4000, reward: "Free item", label: "4,000 pts" },
  { points: 6000, reward: "Early access", label: "6,000 pts" },
];

// Map a points balance to a 0–100% position along the evenly-spaced ladder.
function positionPct(points: number): number {
  const last = NODES.length - 1;
  if (points >= NODES[last].points) return 100;
  let idx = 0;
  for (let i = 0; i < NODES.length - 1; i++) {
    if (points >= NODES[i].points) idx = i;
  }
  const lo = NODES[idx].points;
  const hi = NODES[idx + 1].points;
  const frac = hi > lo ? (points - lo) / (hi - lo) : 0;
  return ((idx + frac) / last) * 100;
}

export default function PointsLine({
  current = 0,
  demo = false,
}: {
  current?: number;
  demo?: boolean;
}) {
  const target = demo ? 100 : positionPct(current);
  const [pct, setPct] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const t = setTimeout(() => setPct(target), 120);
    return () => clearTimeout(t);
  }, [target]);

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="relative min-w-[860px] pt-7">
        {/* Current balance marker (member view) */}
        {!demo && (
          <div
            className="fc-color absolute top-0 -translate-x-1/2 whitespace-nowrap"
            style={{ left: `${pct}%`, transitionProperty: "left", transitionDuration: "1100ms", transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }}
          >
            <span className="fc-label text-gold">{current.toLocaleString()} pts</span>
          </div>
        )}

        {/* Track — thicker than before for presence */}
        <div className="relative h-[3px] w-full rounded-full bg-border">
          <div
            className="absolute left-0 top-0 h-[3px] rounded-full bg-gold"
            style={{ width: `${pct}%`, transitionProperty: "width", transitionDuration: "1100ms", transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }}
          />
          {/* Nodes */}
          {NODES.map((n, i) => {
            const left = (i / (NODES.length - 1)) * 100;
            const reached = pct + 0.4 >= left;
            return (
              <div
                key={n.points}
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${left}%` }}
              >
                <span
                  className="fc-color block rounded-full border"
                  style={{
                    height: reached ? "14px" : "11px",
                    width: reached ? "14px" : "11px",
                    backgroundColor: reached ? "var(--gold)" : "var(--bg)",
                    borderColor: reached ? "var(--gold)" : "var(--border)",
                    borderWidth: reached ? "0px" : "2px",
                    transitionProperty: "background-color, border-color, height, width",
                    transitionDuration: "700ms",
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Labels — reward on top, points below; only unlocked ones emphasized */}
        <div className="relative mt-4 h-10">
          {NODES.map((n, i) => {
            const left = (i / (NODES.length - 1)) * 100;
            const reached = pct + 0.4 >= left;
            return (
              <div
                key={n.points}
                className="fc-color absolute -translate-x-1/2 text-center"
                style={{
                  left: `${left}%`,
                  width: "84px",
                  transitionProperty: "color, opacity",
                  transitionDuration: "700ms",
                }}
              >
                <div
                  className="text-[12px] font-semibold leading-tight"
                  style={{ color: reached ? "var(--text)" : "var(--muted)" }}
                >
                  {n.reward}
                </div>
                <div
                  className="mt-1 text-[11px] leading-tight"
                  style={{ color: reached ? "var(--gold)" : "var(--muted)", opacity: reached ? 1 : 0.8 }}
                >
                  {n.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
