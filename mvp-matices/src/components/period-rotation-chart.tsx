"use client";

import { useState } from "react";
import type { PeriodRotation } from "@/contracts/analysis";
import { formatDecimal, formatPeriod } from "@/lib/format";

const CHART_HEIGHT = 160;

/** Portfolio rotation per loaded period, at cost. Shown only with two or more periods. */
export function PeriodRotationChart({ periods }: { periods: PeriodRotation[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(...periods.map((p) => p.rotation ?? 0), 0.01);
  return (
    <figure>
      <figcaption className="mb-3 text-sm font-medium">
        Rotación de la línea por periodo <span className="font-normal text-muted">(a costo)</span>
      </figcaption>
      <div
        className="flex items-end gap-6 border-b border-axis px-2"
        style={{ height: CHART_HEIGHT }}
      >
        {periods.map((p, index) => {
          const height = ((p.rotation ?? 0) / max) * (CHART_HEIGHT - 28);
          return (
            <div
              key={p.periodStart}
              className="relative flex h-full flex-1 flex-col items-center justify-end"
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="tabular mb-1 text-xs text-ink-2">{formatDecimal(p.rotation)}</span>
              <div
                className="w-6 rounded-t bg-accent"
                style={{
                  height: Math.max(height, 1),
                  opacity: hovered === null || hovered === index ? 1 : 0.5,
                }}
              />
              {hovered === index && (
                <div className="absolute bottom-full z-10 mb-1 rounded-md border border-line bg-surface px-3 py-2 text-xs whitespace-nowrap shadow">
                  <p className="font-medium">{formatPeriod(p.periodStart, p.periodEnd)}</p>
                  <p className="tabular">Rotación: {formatDecimal(p.rotation)}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex gap-6 px-2 pt-1">
        {periods.map((p) => (
          <span key={p.periodStart} className="tabular flex-1 text-center text-xs text-muted">
            {p.periodStart.slice(0, 7)}
          </span>
        ))}
      </div>
    </figure>
  );
}
