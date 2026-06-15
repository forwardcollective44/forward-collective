"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The points system, drawn as a horizontal progress line instead of a bullet
 * list. Each node is a reward milestone; the gold fill animates to the member's
 * current balance on load — so it always picks up where they left off (the
 * value comes from the database). For non-members it animates across the whole
 * ladder once, to explain how the system works.
 */

type Node = { points: number; label: string; sub: string };

const NODES: Node[] = [
  { points: 0, label: "Join", sub: "+50" },
  { points: 150, label: "$5", sub: "off" },
  { points: 300, label: "$12", sub: "off" },
  { points: 600, label: "$25", sub: "off" },
  { points: 1000, label: "$40", sub: "off" },
  { points: 1750, label: "$75", sub: "off" },
  { points: 2500, label: "$100", sub: "off" },
  { points: 4000, label: "Free", sub: "item" },
  { points: 6000, label: "Early", sub: "access" },
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
      <div className="relative min-w-[640px] pt-7">
        {/* Current balance marker (member view) */}
        {!demo && (
          <div
            className="fc-color absolute top-0 -translate-x-1/2 whitespace-nowrap"
            style={{ left: `${pct}%`, transitionProperty: "left", transitionDuration: "1100ms", transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }}
          >
            <span className="fc-label text-gold">{current.toLocaleString()} pts</span>
          </div>
        )}

        {/* Track */}
        <div className="relative h-px w-full bg-border">
          <div
            className="absolute left-0 top-0 h-px bg-gold"
            style={{ width: `${pct}%`, transitionProperty: "width", transitionDuration: "1100ms", transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }}
          />
          {/* Nodes */}
          {NODES.map((n, i) => {
            const left = (i / (NODES.length - 1)) * 100;
            const reached = pct + 0.5 >= left;
            return (
              <div
                key={n.points}
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${left}%` }}
              >
                <span
                  className="fc-color block h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: reached ? "var(--gold)" : "var(--border)",
                    transitionProperty: "background-color",
                    transitionDuration: "900ms",
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Labels */}
        <div className="relative mt-3 h-8">
          {NODES.map((n, i) => {
            const left = (i / (NODES.length - 1)) * 100;
            return (
              <div
                key={n.points}
                className="absolute -translate-x-1/2 text-center"
                style={{ left: `${left}%` }}
              >
                <div className="fc-label text-text">{n.label}</div>
                <div className="fc-label text-muted" style={{ letterSpacing: "0.1em" }}>
                  {n.points === 0 ? n.sub : `${n.points >= 1000 ? n.points / 1000 + "k" : n.points}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
