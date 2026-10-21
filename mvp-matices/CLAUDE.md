# Matices

Tool that reads a distributor's inventory, computes rotation and profitability per product, and recommends what to buy: **ORDER_NOW / WATCH / SUFFICIENT**, with a suggested quantity and value. Built to be sold to other distributors, not only used by one.

**Thesis: the data is read, the code recommends, the human authorizes.**

Read before writing code: `docs/PRD.md` (what and why), `docs/SPEC-FUNCIONAL.md` (exact behavior), `docs/ARQUITECTURA.md` (modules and decisions), `docs/ROADMAP-AIDLC.md` (phases).

## Commands

```bash
npm install
npm test             # Vitest (tests/**/*.test.ts)
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint, including the dependency rule between modules
npm run format       # Prettier
```

## Stack

TypeScript strict · Node 22+ · Zod 4 · Vitest · ESLint · Prettier · npm only. Next.js, libSQL and the Alegra client are added in their phase, not before ("no new dependency without a concrete need today").

## Non-negotiable invariants

1. **The tool never buys.** A purchase exists only with a `PurchaseApproval` record. Nothing in the code creates or sends a purchase order.
2. **No model decides.** Recommendations come from the deterministic engine in `src/engine/`. If a model is ever used (e.g. to read messy files), it only interprets data, never sees rules, and never decides.
3. **Fail-safe.** Invalid data or too little history never yields a purchase: rule R1 is a gate that forces WATCH and a suggested purchase of 0.
4. **All rules always run.** The final outcome is the most restrictive: ORDER_NOW > WATCH > SUFFICIENT. Exception: the R1 gate.
5. **Every recommendation is explainable** from templates in `src/engine/messages.ts`, quoting the numbers the rules compared. Never free text from a model.
6. **Money in integer minor units** (`...Minor`, centavos). Never floats for money. Quantities are integer units.
7. **Dates are ISO 8601** (`YYYY-MM-DD`; timestamps in UTC). The engine never reads the clock: the analysis date is the injected `asOf`.
8. **The engine is deterministic and pure**: same input and same `RulesConfig` give the same output. No I/O, no randomness.
9. **Every recommendation records the `RulesConfigVersion` it used.** A rules change creates a new version; old recommendations keep theirs.
10. **Audit log is append-only**, hash-chained over canonical JSON.
11. **Multi-company from the first table.** Every stored row carries `company_id`; no query without it.
12. **Secrets only in `.env.local`.** Never in code, scripts, tests or docs. Never commit real customer data (`data/private/` is ignored; samples are synthetic).
13. **Scope:** Matices recommends; it does not forecast the future with certainty. UI and docs say "recommended", never "guaranteed".

## Architecture: dependency rule

ESLint (`no-restricted-imports`) enforces this table. Full version in `docs/ARQUITECTURA.md`.

| Module           | May import                    | Must not import                                 |
| ---------------- | ----------------------------- | ----------------------------------------------- |
| `src/contracts/` | `zod`                         | anything else                                   |
| `src/engine/`    | `contracts/`                  | `ingestion/`, `store/`, `fs`, clock, randomness |
| `src/ingestion/` | `contracts/`                  | `engine/`, `store/`                             |
| `src/store/`     | `contracts/`, database client | `engine/`, `ingestion/`                         |
| `src/pipeline/`  | all of the above              | frontend                                        |
| Frontend         | `contracts/`, own modules     | all backend modules; talks via `lib/api-client` |

- Cross-module imports use the `@/` alias. Relative imports only inside the same module.
- Types come **only** from `src/contracts/`. Never redefine a type for an existing concept.

## Language

- **English:** code, file names, identifiers, comments, commits, branches, PRs, this file.
- **Spanish, by exception:** user-facing text (UI labels, the templates in `src/engine/messages.ts`) and everything in `docs/` and `README.md`.

## Glossary: one concept, one name

| Concept                                  | In code                                                       | Never use                    | In the UI                             |
| ---------------------------------------- | ------------------------------------------------------------- | ---------------------------- | ------------------------------------- |
| A sellable item                          | `product`, `productId`                                        | `item`, `sku`, `article`     | Producto / Referencia                 |
| Units in the warehouse today             | `currentStockUnits`                                           | `stock`, `qty`, `inventory`  | Stock hoy                             |
| Units ordered, not received              | `inTransitUnits`                                              | `pending`, `onOrder`         | En tránsito                           |
| Current stock + in transit               | `availableUnits`                                              | `totalStock`                 | Disponible                            |
| Units sold in the analysis period        | `soldUnits`                                                   | `sales`, `sold`, `demand`    | Vendido                               |
| Unit cost / sale price, in centavos      | `unitCostMinor` / `unitPriceMinor`                            | `cost`, `price`, `amount`    | Costo / Precio                        |
| Analysis window and analysis date        | `periodStart`, `periodEnd`, `asOf`                            | `from`, `to`, `today`, `now` | Periodo / Fecha de análisis           |
| Days between order and delivery          | `leadTimeDays`                                                | `deliveryDays`, `leadTime`   | Tiempo de entrega                     |
| Days between one order and the next      | `reviewPeriodDays`                                            | `cycle`, `orderEvery`        | Ciclo de pedido                       |
| Probability of not running out           | `serviceLevel`                                                | `confidence`, `safety`       | Nivel de servicio                     |
| Configurable rules and their version     | `RulesConfig`, `version`                                      | `settings`, `policy`         | Reglas                                |
| Units covering lead time + review period | `targetLevelUnits`                                            | `maxStock`, `par`            | Nivel objetivo                        |
| Units covering lead time only            | `reorderPointUnits`                                           | `minStock`, `threshold`      | Punto de pedido                       |
| What to buy                              | `suggestedPurchaseUnits`, `suggestedPurchaseMinor`            | `orderQty`, `toBuy`          | Compra sugerida                       |
| Sold units / average stock               | `rotation`                                                    | `turnover`, `turns`          | Rotación                              |
| Average stock expressed in days          | `daysOfInventory`                                             | `doh`, `coverage`            | Días de inventario                    |
| Gross margin on inventory investment     | `gmroiAnnualized`                                             | `roi`, `yield`               | GMROI                                 |
| Capital in products with no sales        | `stagnantCapitalMinor`                                        | `deadStock`, `idleCapital`   | Capital parado                        |
| One rule's result                        | `RuleResult` (`ruleId`, `outcome`, `reasonCode`)              | `check`, `validation`        | Resultado por regla                   |
| Final recommendation                     | `outcome`: `ORDER_NOW` / `WATCH` / `SUFFICIENT`               | `BUY`, `OK`, `LOW`           | Pedir ya / Vigilar / Stock suficiente |
| Human decision                           | `PurchaseApproval`, `action`: `APPROVE` / `ADJUST` / `REJECT` | `confirm`, `accept`          | Aprobar / Ajustar / Rechazar          |
| Audit log entry                          | `AuditEntry`                                                  | `log`, `event`               | Registro                              |

A new concept is added to this table **in the same change** that introduces it.

## Naming patterns

| Element             | Pattern                                                           | Example                                    |
| ------------------- | ----------------------------------------------------------------- | ------------------------------------------ |
| Zod schema and type | `<Name>Schema` + `type <Name> = z.infer<...>`                     | `RulesConfigSchema`, `RulesConfig`         |
| Rule file           | `src/engine/rules/<concept>-rule.ts`                              | `reorder-point-rule.ts`                    |
| Rule function       | `evaluate<Concept>Rule(ctx: RuleContext): RuleResult`             | `evaluateReorderPointRule`                 |
| Rule ids            | `R<number>_<NAME>`                                                | `R2_REORDER_POINT`                         |
| Reason codes        | `UPPER_SNAKE_CASE`, one template each in `messages.ts`            | `AT_REORDER_POINT`                         |
| Other functions     | verb + noun                                                       | `computePurchasePlan`, `evaluatePortfolio` |
| Data access         | `src/store/<entity>-repository.ts`; `find…` / `list…` / `insert…` | `findRulesVersion`                         |
| Booleans            | `is…`, `has…`, `can…`                                             | `isDataTrusted`                            |
| Tables and columns  | `snake_case`, plural tables                                       | `rules_versions.lead_time_days`            |
| API JSON, contracts | `camelCase`                                                       | `suggestedPurchaseUnits`                   |
| Enum values         | `UPPER_SNAKE_CASE`                                                | `ORDER_NOW`                                |
| Files               | `kebab-case`                                                      | `evaluate-product.ts`                      |
| Tests               | `tests/<module>/<file>.test.ts`                                   | `tests/engine/rules.test.ts`               |

## Good practices, without over-engineering

- Each rule is a plain function in its own file; the engine runs an array of them. No classes, plugin systems or dependency injection.
- No `any`. External data always enters through `schema.parse`.
- Never swallow errors. Bad rows are reported, not skipped silently, and never stop the other rows.
- Short, single-purpose functions. No dead code, no commented-out code, no `console.log` in `src/`.
- Each rule has tests for pass, fail and boundary (equal to the limit, one above, one below).
- The Yellow golden test (`tests/engine/yellow-line.test.ts`) must keep passing. If a change alters it, justify it in `docs/casos/yellow-agosto-2026.md`.
- No new dependency or abstraction without a concrete need today.

## Working method (AI-DLC)

Spec first → failing tests → implement → `npm test && npm run typecheck && npm run lint` → review as architect → record the decision in `docs/` → small commit. Details in `docs/ROADMAP-AIDLC.md`.

## Commits

Conventional Commits, in English: `<type>(<scope>): <description>` (`feat(engine): add coverage rule`). One logical change per commit.
