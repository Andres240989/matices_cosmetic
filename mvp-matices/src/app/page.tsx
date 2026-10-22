"use client";

import { useState } from "react";
import type { AnalysisResult, DemandBasis } from "@/contracts/analysis";
import type { IngestionResult } from "@/contracts/ingestion";
import { DEFAULT_RULES_CONFIG, type RulesConfig } from "@/contracts/rules-config";
import { PeriodRotationChart } from "@/components/period-rotation-chart";
import { ProductRotationChart } from "@/components/product-rotation-chart";
import { RecommendationsTable } from "@/components/recommendations-table";
import { RulesSection, type RulesDraft } from "@/components/rules-section";
import { Section } from "@/components/section";
import { SummaryCards } from "@/components/summary-cards";
import { UploadSection } from "@/components/upload-section";
import { requestAnalysis } from "@/lib/api-client";
import { formatPeriod } from "@/lib/format";

function latestPeriodEnd(ingestion: IngestionResult): string {
  return ingestion.periods.reduce((max, p) => (p.periodEnd > max ? p.periodEnd : max), "");
}

/** Saving rules with different values creates a new version; the same values keep the current one. */
function nextRulesConfig(current: RulesConfig, draft: RulesDraft): RulesConfig {
  const { asOf: _asOf, ...rules } = draft;
  const isSame = (Object.keys(rules) as (keyof typeof rules)[]).every(
    (k) => rules[k] === current[k],
  );
  return isSame ? current : { ...rules, version: current.version + 1 };
}

export default function HomePage() {
  const [ingestion, setIngestion] = useState<IngestionResult | null>(null);
  const [rulesConfig, setRulesConfig] = useState<RulesConfig>(DEFAULT_RULES_CONFIG);
  const [asOf, setAsOf] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze(
    source: IngestionResult,
    config: RulesConfig,
    date: string,
    basis: DemandBasis | undefined,
  ) {
    setIsBusy(true);
    setError(null);
    try {
      setAnalysis(
        await requestAnalysis({ periods: source.periods, asOf: date, rulesConfig: config, basis }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo analizar.");
    } finally {
      setIsBusy(false);
    }
  }

  function handleLoaded(result: IngestionResult) {
    setIngestion(result);
    setAnalysis(null);
    if (result.periods.length === 0) return;
    const date = latestPeriodEnd(result);
    setAsOf(date);
    void analyze(result, rulesConfig, date, undefined);
  }

  function handleApply(draft: RulesDraft) {
    if (!ingestion) return;
    const config = nextRulesConfig(rulesConfig, draft);
    setRulesConfig(config);
    setAsOf(draft.asOf);
    void analyze(ingestion, config, draft.asOf, analysis?.basis);
  }

  const hasPeriods = ingestion !== null && ingestion.periods.length > 0;

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <header>
        <h1 className="text-2xl font-semibold">Matices</h1>
        <p className="text-ink-2">Los datos se leen. El código recomienda. La persona autoriza.</p>
      </header>

      <UploadSection result={ingestion} onLoaded={handleLoaded} />

      {hasPeriods && (
        <RulesSection
          key={asOf + rulesConfig.version}
          rulesConfig={rulesConfig}
          asOf={asOf}
          minAsOf={latestPeriodEnd(ingestion)}
          basis={analysis?.basis ?? null}
          basisOptions={analysis?.basisOptions ?? []}
          isBusy={isBusy}
          onApply={handleApply}
          onBasisChange={(basis) => void analyze(ingestion, rulesConfig, asOf, basis)}
        />
      )}

      {error && (
        <p
          role="alert"
          className="rounded-md border border-critical px-4 py-3 text-sm text-critical"
        >
          {error}
        </p>
      )}

      {analysis && (
        <Section step={3} title="Resultados">
          <p className="mb-5 text-sm text-ink-2">
            Base de demanda:{" "}
            <strong>
              {formatPeriod(
                analysis.evaluatedPeriod.periodStart,
                analysis.evaluatedPeriod.periodEnd,
              )}
            </strong>{" "}
            ({analysis.recommendations[0]?.metrics.periodDays ?? 0} días) · Fecha de análisis{" "}
            {analysis.evaluatedPeriod.asOf} · Reglas v{rulesConfig.version}
          </p>
          <SummaryCards summary={analysis.summary} />
          {analysis.excludedProducts.length > 0 && (
            <details className="mt-4 text-sm text-ink-2">
              <summary className="cursor-pointer">
                {analysis.excludedProducts.length} productos fuera del consolidado
              </summary>
              <ul className="mt-2 list-disc pl-5">
                {analysis.excludedProducts.map((p) => (
                  <li key={p.productId}>
                    {p.productId} {p.name}: {p.reason}
                  </li>
                ))}
              </ul>
            </details>
          )}
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_2fr]">
            {analysis.periodRotations.length > 1 && (
              <PeriodRotationChart periods={analysis.periodRotations} />
            )}
            <ProductRotationChart recommendations={analysis.recommendations} />
          </div>
          <div className="mt-8">
            <RecommendationsTable result={analysis} />
          </div>
          <p className="mt-6 text-xs text-muted">
            Recomendación calculada con reglas deterministas, no una garantía de ventas. Matices no
            compra: cada compra la decide y aprueba una persona.
          </p>
        </Section>
      )}
    </main>
  );
}
