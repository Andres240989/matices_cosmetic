"use client";

import { useState } from "react";
import { CONSOLIDATED_BASIS, type DemandBasis, type DemandBasisOption } from "@/contracts/analysis";
import { countDaysInclusive } from "@/contracts/dates";
import type { RulesConfig } from "@/contracts/rules-config";
import { formatPeriod } from "@/lib/format";
import { Section } from "./section";

export type RulesDraft = Omit<RulesConfig, "version"> & { asOf: string };

type Props = {
  rulesConfig: RulesConfig;
  asOf: string;
  /** The analysis date cannot be before the latest loaded period ends. */
  minAsOf: string;
  basis: DemandBasis | null;
  basisOptions: DemandBasisOption[];
  isBusy: boolean;
  onApply: (draft: RulesDraft) => void;
  onBasisChange: (basis: DemandBasis) => void;
};

const SERVICE_LEVELS = [0.8, 0.85, 0.9, 0.95, 0.98];

function basisLabel(option: DemandBasisOption): string {
  const period = formatPeriod(option.periodStart, option.periodEnd);
  return option.basis === CONSOLIDATED_BASIS ? `Consolidado (${period})` : period;
}

function NumberField(props: {
  label: string;
  hint: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{props.label}</span>
      <input
        type="number"
        min={1}
        max={365}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
        className="tabular rounded-md border border-line bg-page px-2 py-1.5"
      />
      <span className="text-xs text-muted">{props.hint}</span>
    </label>
  );
}

export function RulesSection(props: Props) {
  const { version: _version, ...rules } = props.rulesConfig;
  const [draft, setDraft] = useState<RulesDraft>({ ...rules, asOf: props.asOf });
  const set = <K extends keyof RulesDraft>(key: K, value: RulesDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const selected = props.basisOptions.find((option) => option.basis === props.basis);
  // The sales history is the length of the chosen basis of demand; the minimum is fixed, not edited.
  const historyDays = selected
    ? countDaysInclusive(selected.periodStart, selected.periodEnd)
    : null;
  const isShortHistory = historyDays !== null && historyDays < rules.minHistoryDays;

  return (
    <Section step={2} title="Reglas y base de demanda">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Fecha de análisis</span>
          <input
            type="date"
            min={props.minAsOf}
            value={draft.asOf}
            onChange={(e) => set("asOf", e.target.value)}
            className="tabular rounded-md border border-line bg-page px-2 py-1.5"
          />
          <span className="text-xs text-muted">Día del stock hoy</span>
        </label>
        <NumberField
          label="Tiempo de entrega (días)"
          hint="Del pedido a la llegada"
          value={draft.leadTimeDays}
          onChange={(v) => set("leadTimeDays", v)}
        />
        <NumberField
          label="Ciclo de pedido (días)"
          hint="Entre un pedido y el siguiente"
          value={draft.reviewPeriodDays}
          onChange={(v) => set("reviewPeriodDays", v)}
        />
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Nivel de servicio</span>
          <select
            value={draft.serviceLevel}
            onChange={(e) => set("serviceLevel", Number(e.target.value))}
            className="rounded-md border border-line bg-page px-2 py-1.5"
          >
            {SERVICE_LEVELS.map((level) => (
              <option key={level} value={level}>
                {Math.round(level * 100)} %
              </option>
            ))}
          </select>
          <span className="text-xs text-muted">Probabilidad de no agotarse</span>
        </label>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-6">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Base de demanda</span>
            <select
              value={props.basis ?? ""}
              disabled={props.isBusy || props.basisOptions.length === 0}
              onChange={(e) => props.onBasisChange(e.target.value as DemandBasis)}
              className="rounded-md border border-line bg-page px-2 py-1.5"
            >
              {props.basisOptions.map((option) => (
                <option key={option.basis} value={option.basis}>
                  {basisLabel(option)}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Historial de ventas</span>
            <span className="tabular py-1.5">
              {historyDays === null ? "—" : `${historyDays} días`}
            </span>
            <span className={`text-xs ${isShortHistory ? "text-critical" : "text-muted"}`}>
              {isShortHistory
                ? `Menos de ${rules.minHistoryDays} días: Vigilar, sin compra`
                : `Mínimo ${rules.minHistoryDays} días para recomendar compra`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">Reglas v{props.rulesConfig.version}</span>
          <button
            type="button"
            disabled={props.isBusy || draft.asOf < props.minAsOf}
            onClick={() => props.onApply(draft)}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            Aplicar y recalcular
          </button>
        </div>
      </div>
    </Section>
  );
}
