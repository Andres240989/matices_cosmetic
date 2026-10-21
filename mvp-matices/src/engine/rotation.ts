export type RotationInput = {
  openingStockUnits: number;
  closingStockUnits: number;
  soldUnits: number;
  periodDays: number;
};

export type RotationResult = {
  /** Sold units divided by average stock over the period. `null` if average stock is zero. */
  rotation: number | null;
  /** Days the average stock would last at the period's pace. `null` if nothing was sold. */
  daysOfInventory: number | null;
};

export function computeRotation(input: RotationInput): RotationResult {
  const averageStock = (input.openingStockUnits + input.closingStockUnits) / 2;
  if (averageStock <= 0) return { rotation: null, daysOfInventory: null };
  const rotation = input.soldUnits / averageStock;
  const daysOfInventory = rotation > 0 ? input.periodDays / rotation : null;
  return { rotation, daysOfInventory };
}
