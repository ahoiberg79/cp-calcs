export type Crop = "Corn" | "Soybean" | "Wheat" | "Alfalfa";

export type So4SulfurInput = {
  crop: Crop;
  yieldGoal: number;          // bushels/acre for Corn/Soybean/Wheat; tons/acre for Alfalfa
  organicMatterPct: number;   // %
  sulfurPpm?: number;         // optional soil test sulfate-S ppm; defaults to 0 for web version
};

export type So4SulfurOutput = {
  sulfurNeededLbPerA: number;      // final sulfur requirement after credits, floored at 0
  rateLbPerA: number;              // SO4 product rate in lb/acre
  rateTonsPerA: number;            // SO4 product rate in tons/acre
  details: {
    sulfurDemandLbPerA: number;    // crop sulfur demand from yield goal
    sulfurCreditFromSoilLbPerA: number;
    sulfurCreditFromOMLbPerA: number;
    preFloorSulfurNeededLbPerA: number;
    productSulfurPct: number;      // 17
    cropCoefficient: number;       // lb S per bushel or lb S per ton, depending on crop
  };
};

/**
 * Current calculator logic carried forward from the existing Excel model.
 *
 * Crop coefficients represent the sulfur demand factors used by the model:
 * - Corn:    0.18 lb S per bushel
 * - Soybean: 0.26 lb S per bushel
 * - Wheat:   0.28 lb S per bushel
 * - Alfalfa: 6.0 lb S per ton
 *
 * Credits:
 * - Organic matter credit = OM % * 3
 * - Soil sulfur credit:
 *    - Alfalfa: sulfur ppm * 0.2 * 2
 *    - Others:  sulfur ppm * 0.3 * 8
 *
 * Product conversion:
 * - SO4 assumed at 17% S
 * - lb product/acre = lb S needed * 100 / 17
 */
export function runSo4Sulfur(i: So4SulfurInput): So4SulfurOutput {
  const sulfurPpm = i.sulfurPpm ?? 0;

  const cropCoef: Record<Crop, number> = {
    Corn: 0.18,
    Soybean: 0.26,
    Wheat: 0.28,
    Alfalfa: 6.0,
  };

  const cropCoefficient = cropCoef[i.crop];
  const sulfurDemandLbPerA = i.yieldGoal * cropCoefficient;

  const sulfurCreditFromSoilLbPerA =
    i.crop === "Alfalfa"
      ? sulfurPpm * 0.2 * 2
      : sulfurPpm * 0.3 * 8;

  const sulfurCreditFromOMLbPerA = i.organicMatterPct * 3;

  const preFloorSulfurNeededLbPerA =
    sulfurDemandLbPerA - sulfurCreditFromSoilLbPerA - sulfurCreditFromOMLbPerA;

  const sulfurNeededLbPerA = Math.max(0, preFloorSulfurNeededLbPerA);

  const rateLbPerA = (sulfurNeededLbPerA * 100) / 17;
  const rateTonsPerA = rateLbPerA / 2000;

  return {
    sulfurNeededLbPerA,
    rateLbPerA,
    rateTonsPerA,
    details: {
      sulfurDemandLbPerA,
      sulfurCreditFromSoilLbPerA,
      sulfurCreditFromOMLbPerA,
      preFloorSulfurNeededLbPerA,
      productSulfurPct: 17,
      cropCoefficient,
    },
  };
}