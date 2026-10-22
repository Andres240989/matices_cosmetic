import type { RecommendationOutcome } from "@/contracts/recommendation";
import { OUTCOME_LABELS } from "@/lib/format";

const STYLES: Record<RecommendationOutcome, { icon: string; dot: string }> = {
  ORDER_NOW: { icon: "!", dot: "bg-critical text-white" },
  WATCH: { icon: "~", dot: "bg-warning text-black" },
  SUFFICIENT: { icon: "✓", dot: "bg-good text-white" },
};

export function OutcomeBadge({ outcome }: { outcome: RecommendationOutcome }) {
  const style = STYLES[outcome];
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium">
      <span
        aria-hidden
        className={`inline-flex size-4 items-center justify-center rounded-full text-[10px] font-bold ${style.dot}`}
      >
        {style.icon}
      </span>
      {OUTCOME_LABELS[outcome]}
    </span>
  );
}
