// packages/calc-engine/src/fertilizer_acidity.ts

// Acidification coefficients (lbs CaCO3 required per lb of nutrient applied)
export const acidificationCoefficients: Record<
  string,
  { N?: number; S?: number }
> = {
  "Anhydrous Ammonia (AA)": { N: 1.8 },
  "Urea": { N: 1.8 },
  "Ammonium Sulfate (AMS)": { N: 5.4 },
  "Monoammonium Phosphate (MAP)": { N: 5.4 },
  "Diammonium Phosphate (DAP)": { N: 3.6 },
  "Ammonium Nitrate (AN)": { N: 1.8 },
  "Urea Ammonium Nitrate (UAN)": { N: 1.8 },
  "MicroEssentials SZ (MES-SZ)": { N: 5.4, S: 3.0 },
  "MicroEssentials S10 (MES-S10)": { N: 5.4, S: 3.0 },
  "MicroEssentials S15 (MES-S15)": { N: 5.4, S: 3.0 },
  "Elemental Sulfur (ES)": { S: 3.0 },
};

// Label analyses used to derive product rate and S units for MES.
// These are the common labels; change here if your spec differs.
const MES_ANALYSIS: Record<
  "MicroEssentials SZ (MES-SZ)" | "MicroEssentials S10 (MES-S10)" | "MicroEssentials S15 (MES-S15)",
  { N_pct: number; S_pct: number }
> = {
  "MicroEssentials SZ (MES-SZ)": { N_pct: 12, S_pct: 10 }, // 12-40-0-10S-1Zn
  "MicroEssentials S10 (MES-S10)": { N_pct: 12, S_pct: 10 }, // 12-40-0-10S
  "MicroEssentials S15 (MES-S15)": { N_pct: 13, S_pct: 15 }, // 13-33-0-15S
};

export type FertAcidityRowInput =
  | {
      fertilizer:
        | "Anhydrous Ammonia (AA)"
        | "Urea"
        | "Ammonium Sulfate (AMS)"
        | "Monoammonium Phosphate (MAP)"
        | "Diammonium Phosphate (DAP)"
        | "Ammonium Nitrate (AN)"
        | "Urea Ammonium Nitrate (UAN)";
      unitsN?: number; // lbs N/ac
    }
  | {
      fertilizer:
        | "MicroEssentials SZ (MES-SZ)"
        | "MicroEssentials S10 (MES-S10)"
        | "MicroEssentials S15 (MES-S15)";
      unitsN?: number;               // lbs N/ac (optional)
      mesProductRate_lbs_ac?: number; // product rate; if omitted and unitsN given, derive from %N
    }
  | {
      fertilizer: "Elemental Sulfur (ES)";
      unitsS?: number; // lbs S/ac (100% elemental)
    };

export type FertAcidityOutputRow = {
  fertilizer: string;
  lbs98gNeeded: number;        // rounded
  contrib_N_lbs98g?: number;   // rounded (if any)
  contrib_S_lbs98g?: number;   // rounded (if any)
  debug?: {
    mes_rate_from_unitsN?: number;     // derived product rate (lb/ac) if we computed it
    mes_total_S_units?: number;        // total S units from label
    mes_elemental_S_units?: number;    // acidifying S units (half of total)
  };
};

export type FertAcidityRunInput = {
  rows: FertAcidityRowInput[];
  enpFraction98G?: number; // default 0.94
};

export type FertAcidityRunOutput = {
  total_lbs98g_per_ac: number; // rounded
  rows: FertAcidityOutputRow[];
};

/**
 * lbs98G = (CaCO3_need_from_N + CaCO3_need_from_S) / ENP
 * MES S units:
 *  - If mesProductRate is provided, S_units = rate * (%S/100)
 *  - Else if unitsN is provided, rate = unitsN / (%N/100) → S_units from rate
 *  - Only the elemental half of S contributes to acidity → S_elemental = S_units * 0.5
 */
export function runFertilizerAcidityAll(input: FertAcidityRunInput): FertAcidityRunOutput {
  const enp = input.enpFraction98G ?? 0.94;
  const rowsOut: FertAcidityOutputRow[] = [];
  let total = 0;

  for (const row of input.rows) {
    const fert = (row as any).fertilizer as string;
    const coeffs = acidificationCoefficients[fert];
    if (!coeffs) continue;

    let needCaCO3_N = 0;
    let needCaCO3_S = 0;

    // N contribution (all N-bearing products incl. MES)
    if ("unitsN" in row && typeof row.unitsN === "number" && coeffs.N) {
      const unitsN = Math.max(0, row.unitsN);
      needCaCO3_N = unitsN * coeffs.N;
    }

    // S contribution logic
    if (fert === "Elemental Sulfur (ES)") {
      if (typeof (row as any).unitsS === "number" && coeffs.S) {
        const sUnits = Math.max(0, (row as any).unitsS); // 100% elemental
        needCaCO3_S = sUnits * coeffs.S;
      }
    } else if (fert in MES_ANALYSIS && coeffs.S) {
      const { N_pct, S_pct } =
        MES_ANALYSIS[fert as keyof typeof MES_ANALYSIS];

      // Prefer explicit product rate if provided; otherwise derive from unitsN using %N
      let mesRate = 0;
      if ("mesProductRate_lbs_ac" in row && typeof row.mesProductRate_lbs_ac === "number") {
        mesRate = Math.max(0, row.mesProductRate_lbs_ac);
      } else if ("unitsN" in row && typeof row.unitsN === "number" && N_pct > 0) {
        mesRate = Math.max(0, row.unitsN) / (N_pct / 100);
      }

      if (mesRate > 0) {
        const totalS_units = mesRate * (S_pct / 100);
        const elementalS_units = totalS_units * 0.5; // acidifying half
        needCaCO3_S = elementalS_units * coeffs.S;

        rowsOut.push({
          fertilizer: fert,
          lbs98gNeeded: Math.round((needCaCO3_N + needCaCO3_S) / enp),
          contrib_N_lbs98g: needCaCO3_N ? Math.round(needCaCO3_N / enp) : undefined,
          contrib_S_lbs98g: needCaCO3_S ? Math.round(needCaCO3_S / enp) : undefined,
          debug: {
            mes_rate_from_unitsN: ("mesProductRate_lbs_ac" in row && typeof row.mesProductRate_lbs_ac === "number")
              ? undefined
              : mesRate,
            mes_total_S_units: totalS_units,
            mes_elemental_S_units: elementalS_units,
          },
        });
        total += Math.round((needCaCO3_N + needCaCO3_S) / enp);
        continue;
      }
    }

    // Default row (non-MES or MES with no S info)
    const lbs98g = (needCaCO3_N + needCaCO3_S) / (enp || 1);
    const rowOut: FertAcidityOutputRow = {
      fertilizer: fert,
      lbs98gNeeded: Math.round(lbs98g),
    };
    if (needCaCO3_N) rowOut.contrib_N_lbs98g = Math.round(needCaCO3_N / (enp || 1));
    if (needCaCO3_S) rowOut.contrib_S_lbs98g = Math.round(needCaCO3_S / (enp || 1));
    rowsOut.push(rowOut);
    total += rowOut.lbs98gNeeded;
  }

  return { total_lbs98g_per_ac: total, rows: rowsOut };
}
