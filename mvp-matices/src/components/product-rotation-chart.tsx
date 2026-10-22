"use client";

import { useState } from "react";
import type { Recommendation } from "@/contracts/recommendation";
import { formatDecimal } from "@/lib/format";

const TOP = 15;

/** Products with sales, highest rotation first. Products without sales are counted, not drawn. */
export function ProductRotationChart({ recommendations }: { recommendations: Recommendation[] }) {
  const [showAll, setShowAll] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const moving = recommendations
    .filter((r) => (r.metrics.rotation ?? 0) > 0)
    .sort((a, b) => (b.metrics.rotation ?? 0) - (a.metrics.rotation ?? 0));
  const shown = showAll ? moving : moving.slice(0, TOP);
  const max = moving[0]?.metrics.rotation ?? 1;
  const withoutSales = recommendations.length - moving.length;

  return (
    <figure>
      <figcaption className="mb-3 text-sm font-medium">
        Rotación por producto{" "}
        <span className="font-normal text-muted">
          (vendido ÷ inventario promedio) · {withoutSales} productos sin rotación no se dibujan
        </span>
      </figcaption>
      <ul className="space-y-1">
        {shown.map((r) => (
          <li
            key={r.productId}
            className="relative grid grid-cols-[minmax(0,14rem)_1fr] items-center gap-3 text-xs"
            onMouseEnter={() => setHovered(r.productId)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="truncate text-ink-2" title={r.name}>
              {r.name}
            </span>
            <span className="flex items-center gap-2">
              <span
                className="h-3 rounded-r bg-accent"
                style={{ width: `${((r.metrics.rotation ?? 0) / max) * 85}%` }}
              />
              <span className="tabular text-ink-2">{formatDecimal(r.metrics.rotation)}</span>
            </span>
            {hovered === r.productId && (
              <div className="absolute top-full left-0 z-10 mt-1 rounded-md border border-line bg-surface px-3 py-2 shadow sm:left-56">
                <p className="font-medium">{r.name}</p>
                <p className="tabular">
                  Inventario promedio {formatDecimal(r.metrics.averageStockUnits, 1)} · Rotación{" "}
                  {formatDecimal(r.metrics.rotation)} · Días de inventario{" "}
                  {formatDecimal(r.metrics.daysOfInventory, 0)}
                </p>
              </div>
            )}
          </li>
        ))}
      </ul>
      {moving.length > TOP && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-2 text-sm text-accent underline"
        >
          {showAll ? `Ver solo los ${TOP} primeros` : `Ver los ${moving.length}`}
        </button>
      )}
    </figure>
  );
}
