export type Crop = "Corn" | "Soybean" | "Wheat" | "Alfalfa";

export type So4SulfurInput = {
  crop: Crop;                 // Corn | Soybean | Wheat | Alfalfa
  yieldGoal: number;          // bu/ac for Corn/Soybean/Wheat; tons/ac for Alfalfa
  sulfurPpm: number;          // soil test sulfate-S ppm
  organicMatterPct: number;   // soil test OM, %
};

export type So4SulfurOutput = {
  rate_lbs_SO4_per_ac: number;   // final product rate (SO4 Pelletized Gypsum), floored at 0
  details: {
    yieldTerm: number;
    sulfurTerm: number;
    omTerm: number;
    preConversion: number;       // (yieldTerm - sulfurTerm - omTerm)
  };
};

/**
 * Logic (from your Excel):
 * For Corn:    RATE = (((YG*0.22) - (Sppm*0.3*8) - (OM*3)) * 100) / 17
 * For Soybean: RATE = (((YG*0.29) - (Sppm*0.3*8) - (OM*3)) * 100) / 17
 * For Wheat:   RATE = (((YG*0.35) - (Sppm*0.3*8) - (OM*3)) * 100) / 17
 * For Alfalfa: RATE = (((YG*6.3)  - (Sppm*0.2*2) - (OM*3)) * 100) / 17
 * If negative → return 0.
 */
export function runSo4Sulfur(i: So4SulfurInput): So4SulfurOutput {
  const cropCoef: Record<Crop, number> = {
    Corn: 0.22,
    Soybean: 0.29,
    Wheat: 0.35,
    Alfalfa: 6.3,
  };

  // sulfur ppm term differs for Alfalfa vs the others
  const sulfurTerm =
    i.crop === "Alfalfa"
      ? i.sulfurPpm * 0.2 * 2
      : i.sulfurPpm * 0.3 * 8;

  const yieldTerm = i.yieldGoal * cropCoef[i.crop];
  const omTerm = i.organicMatterPct * 3;

  const pre = yieldTerm - sulfurTerm - omTerm;

  // 100/17 converts required S to lbs of product at 17% S
  const rate = Math.max(0, (pre * 100) / 17);

  return {
    rate_lbs_SO4_per_ac: rate,
    details: { yieldTerm, sulfurTerm, omTerm, preConversion: pre },
  };
}
