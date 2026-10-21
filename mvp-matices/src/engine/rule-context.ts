import type { ProductPeriod } from "@/contracts/product";
import type { RulesConfig } from "@/contracts/rules-config";
import type { PurchasePlan } from "./purchase";

/** Everything a rule may look at. Rules are pure functions of this object. */
export type RuleContext = {
  product: ProductPeriod;
  periodDays: number;
  config: RulesConfig;
  availableUnits: number;
  plan: PurchasePlan;
};
