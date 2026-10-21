import { AnalysisRequestSchema, type AnalysisResult } from "@/contracts/analysis";
import { analyzePeriods } from "@/engine/analyze-periods";

/** Parses the request at the boundary and hands it to the pure engine. */
export function runAnalysis(rawRequest: unknown): AnalysisResult {
  return analyzePeriods(AnalysisRequestSchema.parse(rawRequest));
}
