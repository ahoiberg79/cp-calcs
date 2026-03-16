// packages/calc-engine/src/so4_sodic.ts

export type So4SodicInput =
  | {
      /** CEC, meq/100g */
      cec_meq_per_100g: number;
      /** Provide sodium as ppm */
      sodium_ppm: number;
      /** Optional: % Na; if provided, takes precedence over ppm */
      baseSatNa_pct?: number;
    }
  | {
      /** CEC, meq/100g */
      cec_meq_per_100g: number;
      /** Provide % Na directly */
      baseSatNa_pct: number;
      /** Optional: sodium ppm; if omitted, it will be derived */
      sodium_ppm?: number;
    };

export type So4SodicOutput = {
  /** % Na actually used in the calculation */
  baseSatNa_pct: number;
  /** Sodium, ppm */
  sodium_ppm: number;
  /** Sodium, meq/L */
  na_meq_per_L: number;
  /** Sodium, meq/100g */
  na_meq_per_100g: number;
  /** ESP as fraction (0–1) */
  esp: number;
  /** SO4 rate, tons/acre */
  rate_tons_per_ac: number;
  /** SO4 rate, lb/acre */
  rate_lbs_so4_per_ac: number;
  /** Notes or assumptions */
  notes?: string[];
};

const PPM_PER_MEQ_PER_100G_NA = 230;
const MG_PER_MEQ_NA = 23;
const TONS_TO_LBS = 2000;

const clamp0 = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);
const isFiniteNum = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n);

export function runSo4Sodic(input: So4SodicInput): So4SodicOutput {
  const notes: string[] = [];

  const cec = Math.max(0, Number((input as any).cec_meq_per_100g));
  const providedPpm = isFiniteNum((input as any).sodium_ppm)
    ? Math.max(0, Number((input as any).sodium_ppm))
    : undefined;
  const providedPct = isFiniteNum((input as any).baseSatNa_pct)
    ? Math.max(0, Number((input as any).baseSatNa_pct))
    : undefined;

  if (!isFiniteNum(cec)) {
    return {
      baseSatNa_pct: 0,
      sodium_ppm: 0,
      na_meq_per_L: 0,
      na_meq_per_100g: 0,
      esp: 0,
      rate_tons_per_ac: 0,
      rate_lbs_so4_per_ac: 0,
      notes: ["Non-finite CEC input."],
    };
  }

  if (cec <= 0) {
    const na_meq_per_L = providedPpm ? providedPpm / MG_PER_MEQ_NA : 0;

    return {
      baseSatNa_pct: 0,
      sodium_ppm: providedPpm ?? 0,
      na_meq_per_L,
      na_meq_per_100g: 0,
      esp: 0,
      rate_tons_per_ac: 0,
      rate_lbs_so4_per_ac: 0,
      notes: ["CEC must be greater than 0; returned 0 recommendation."],
    };
  }

  let baseSatNa_pct: number;

  if (isFiniteNum(providedPct)) {
    baseSatNa_pct = providedPct;
  } else if (isFiniteNum(providedPpm)) {
    // % Na = ((ppm / 230) / CEC) * 100
    baseSatNa_pct = ((providedPpm / PPM_PER_MEQ_PER_100G_NA) / cec) * 100;
    notes.push("% Na was derived from sodium ppm.");
  } else {
    return {
      baseSatNa_pct: 0,
      sodium_ppm: 0,
      na_meq_per_L: 0,
      na_meq_per_100g: 0,
      esp: 0,
      rate_tons_per_ac: 0,
      rate_lbs_so4_per_ac: 0,
      notes: ["Provide either sodium ppm or % Na."],
    };
  }

  // ppm = (% Na / 100) * CEC * 230
  const sodium_ppm = isFiniteNum(providedPpm)
    ? providedPpm
    : (baseSatNa_pct / 100) * cec * PPM_PER_MEQ_PER_100G_NA;

  // meq/L = ppm / 23
  const na_meq_per_L = sodium_ppm / MG_PER_MEQ_NA;

  // meq/100g = CEC * (% Na / 100)
  const na_meq_per_100g = cec * (baseSatNa_pct / 100);

  const esp = baseSatNa_pct / 100;

  // SO4 rate, tons/acre = meq Na/100g × 1.7
  const rate_tons_per_ac = clamp0(na_meq_per_100g * 1.7);

  // SO4 rate, lb/acre
  const rate_lbs_so4_per_ac = clamp0(rate_tons_per_ac * TONS_TO_LBS);

  return {
    baseSatNa_pct,
    sodium_ppm,
    na_meq_per_L,
    na_meq_per_100g,
    esp,
    rate_tons_per_ac,
    rate_lbs_so4_per_ac,
    notes: notes.length ? notes : undefined,
  };
}