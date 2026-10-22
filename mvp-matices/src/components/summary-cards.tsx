import type { PortfolioSummary } from "@/contracts/recommendation";
import { formatPercent, formatPesos } from "@/lib/format";

function Card(props: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-lg border border-line p-4">
      <p className="text-sm text-ink-2">{props.label}</p>
      <p className="mt-1 text-2xl font-semibold">{props.value}</p>
      {props.detail && <p className="mt-1 text-xs text-muted">{props.detail}</p>}
    </div>
  );
}

export function SummaryCards({ summary }: { summary: PortfolioSummary }) {
  const stagnantShare =
    summary.inventoryCostMinor > 0 ? summary.stagnantCapitalMinor / summary.inventoryCostMinor : 0;
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-ink-2">Compra sugerida (solo «Pedir ya»)</p>
        <p className="text-5xl font-semibold">{formatPesos(summary.orderNowMinor)}</p>
        <p className="mt-1 text-sm text-muted">
          {summary.orderNowUnits} unidades en {summary.orderNowCount} productos, a costo
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Card label="Pedir ya" value={String(summary.orderNowCount)} detail="productos" />
        <Card label="Vigilar" value={String(summary.watchCount)} detail="productos" />
        <Card label="Stock suficiente" value={String(summary.sufficientCount)} detail="productos" />
        <Card
          label="Capital parado"
          value={formatPesos(summary.stagnantCapitalMinor)}
          detail={`${formatPercent(stagnantShare)} del inventario, sin ventas en el periodo`}
        />
        <Card
          label="Inventario a costo"
          value={formatPesos(summary.inventoryCostMinor)}
          detail="stock hoy"
        />
      </div>
    </div>
  );
}
