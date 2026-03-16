// packages/calc-engine/src/fertilizer_acidity.ts

export const acidificationCoefficients: Record<string, { N?: number; S?: number }> = {
  "Anhydrous Ammonia (AA)": { N: 1.8 },
  Urea: { N: 1.8 },
  "Ammonium Sulfate (AMS)": { N: 5.4 },
  "Monoammonium Phosphate (MAP)": { N: 5.4 },
  "Diammonium Phosphate (DAP)": { N: 3.6 },
  "Ammonium Nitrate (AN)": { N: 1.8 },
  "32% UAN": { N: 1.8 },
  "28% UAN": { N: 1.8 },
  "Ammonium Polyphosphate (10-34-0)": { N: 5.4 },

  "Ammonium Thiosulfate (ATS)": { N: 5.4, S: 3.0 },

  "Co-Granulated (12-40-0-10S-1Zn)": { N: 5.4, S: 3.0 },
  "Co-Granulated (12-40-0-10S)": { N: 5.4, S: 3.0 },
  "Co-Granulated (13-33-0-15S)": { N: 5.4, S: 3.0 },
  "Elemental Sulfur (ES)": { S: 3.0 },
};

const COGRAN_ANALYSIS = {
  "Co-Granulated (12-40-0-10S-1Zn)": { N_pct: 12, S_pct: 10 },
  "Co-Granulated (12-40-0-10S)": { N_pct: 12, S_pct: 10 },
  "Co-Granulated (13-33-0-15S)": { N_pct: 13, S_pct: 15 },
} as const;

const ATS_ANALYSIS = {
  N_pct: 12,
  S_pct: 26,
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
        | "32% UAN"
        | "28% UAN"
        | "Ammonium Polyphosphate (10-34-0)";
      unitsN?: number;
    }
  | {
      fertilizer:
        | "Co-Granulated (12-40-0-10S-1Zn)"
        | "Co-Granulated (12-40-0-10S)"
        | "Co-Granulated (13-33-0-15S)";
      unitsN?: number;
      coGranulatedProductRate_lbs_ac?: number;
    }
  | {
      fertilizer: "Ammonium Thiosulfate (ATS)";
      unitsN?: number;
      atsProductRate_lbs_ac?: number;
    }
  | {
      fertilizer: "Elemental Sulfur (ES)";
      unitsS?: number;
    };

export type FertAcidityOutputRow = {
  fertilizer: string;
  lbs98gNeeded: number;
  contrib_N_lbs98g?: number;
  contrib_S_lbs98g?: number;
  debug?: {
    coGranulated_rate_from_unitsN?: number;
    coGranulated_total_S_units?: number;
    coGranulated_elemental_S_units?: number;

    ats_rate_from_unitsN?: number;
    ats_total_S_units?: number;
    ats_acidifying_S_units?: number;
  };
};

export type FertAcidityRunInput = {
  rows: FertAcidityRowInput[];
  enpFraction98G?: number;
};

export type FertAcidityRunOutput = {
  total_caco3_needed_per_ac: number;
  total_lbs98g_per_ac: number;
  rows: FertAcidityOutputRow[];
};

export function runFertilizerAcidityAll(
  input: FertAcidityRunInput
): FertAcidityRunOutput {
  const enp = input.enpFraction98G ?? 0.94;

  const rowsOut: FertAcidityOutputRow[] = [];
  let total98G = 0;
  let totalCaCO3 = 0;

  for (const row of input.rows) {
    const fert = row.fertilizer;
    const coeffs = acidificationCoefficients[fert];
    if (!coeffs) continue;

    let needCaCO3_N = 0;
    let needCaCO3_S = 0;

    if ("unitsN" in row && typeof row.unitsN === "number" && coeffs.N) {
      const unitsN = Math.max(0, row.unitsN);
      needCaCO3_N = unitsN * coeffs.N;
    }

    if (fert === "Elemental Sulfur (ES)") {
      if ("unitsS" in row && typeof row.unitsS === "number" && coeffs.S) {
        const sUnits = Math.max(0, row.unitsS);
        needCaCO3_S = sUnits * coeffs.S;
      }
    } else if (fert in COGRAN_ANALYSIS && coeffs.S) {
      const { N_pct, S_pct } =
        COGRAN_ANALYSIS[fert as keyof typeof COGRAN_ANALYSIS];

      let coGranulatedRate = 0;

      if (
        "coGranulatedProductRate_lbs_ac" in row &&
        typeof row.coGranulatedProductRate_lbs_ac === "number"
      ) {
        coGranulatedRate = Math.max(0, row.coGranulatedProductRate_lbs_ac);
      } else if ("unitsN" in row && typeof row.unitsN === "number") {
        coGranulatedRate = Math.max(0, row.unitsN) / (N_pct / 100);
      }

      if (coGranulatedRate > 0) {
        const totalS_units = coGranulatedRate * (S_pct / 100);
        const elementalS_units = totalS_units * 0.5;

        needCaCO3_S = elementalS_units * coeffs.S;

        const rowCaCO3 = needCaCO3_N + needCaCO3_S;
        const lbs98g = Math.round((needCaCO3_N + needCaCO3_S) / enp);
        

        rowsOut.push({
          fertilizer: fert,
          lbs98gNeeded: lbs98g,
          contrib_N_lbs98g: needCaCO3_N ? Math.round(needCaCO3_N / enp) : undefined,
          contrib_S_lbs98g: needCaCO3_S ? Math.round(needCaCO3_S / enp) : undefined,
          debug: {
            coGranulated_rate_from_unitsN:
              "coGranulatedProductRate_lbs_ac" in row ? undefined : coGranulatedRate,
            coGranulated_total_S_units: totalS_units,
            coGranulated_elemental_S_units: elementalS_units,
          },
        });

        totalCaCO3 += rowCaCO3;
        total98G += lbs98g;
        continue;
      }
    } else if (fert === "Ammonium Thiosulfate (ATS)" && coeffs.S) {
      let atsRate = 0;

      if (
        "atsProductRate_lbs_ac" in row &&
        typeof row.atsProductRate_lbs_ac === "number"
      ) {
        atsRate = Math.max(0, row.atsProductRate_lbs_ac);
      } else if ("unitsN" in row && typeof row.unitsN === "number") {
        atsRate = Math.max(0, row.unitsN) / (ATS_ANALYSIS.N_pct / 100);
      }

      if (atsRate > 0) {
        const totalS_units = atsRate * (ATS_ANALYSIS.S_pct / 100);

        needCaCO3_S = totalS_units * coeffs.S;

        const rowCaCO3 = needCaCO3_N + needCaCO3_S;
        const lbs98g = Math.round((needCaCO3_N + needCaCO3_S) / enp);

        rowsOut.push({
          fertilizer: fert,
          lbs98gNeeded: lbs98g,
          contrib_N_lbs98g: needCaCO3_N ? Math.round(needCaCO3_N / enp) : undefined,
          contrib_S_lbs98g: needCaCO3_S ? Math.round(needCaCO3_S / enp) : undefined,
          debug: {
            ats_rate_from_unitsN:
              "atsProductRate_lbs_ac" in row ? undefined : atsRate,
            ats_total_S_units: totalS_units,
            ats_acidifying_S_units: totalS_units,
          },
        });

        totalCaCO3 += rowCaCO3;
        total98G += lbs98g;
        continue;
      }
    }

    const rowCaCO3 = needCaCO3_N + needCaCO3_S;
    const lbs98g = Math.round((needCaCO3_N + needCaCO3_S) / enp);

    rowsOut.push({
      fertilizer: fert,
      lbs98gNeeded: lbs98g,
      contrib_N_lbs98g: needCaCO3_N ? Math.round(needCaCO3_N / enp) : undefined,
      contrib_S_lbs98g: needCaCO3_S ? Math.round(needCaCO3_S / enp) : undefined,
    });

    totalCaCO3 += rowCaCO3;
    total98G += lbs98g;
  }

  return {
    total_caco3_needed_per_ac: Math.round(totalCaCO3 * 10) / 10,
    total_lbs98g_per_ac: total98G,
    rows: rowsOut,
  };
}