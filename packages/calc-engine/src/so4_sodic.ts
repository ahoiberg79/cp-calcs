// packages/calc-engine/src/so4_sodic.ts

/** ---------- Types ---------- */
export type So4SodicInput =
  | {
      /** Cation exchange capacity, meq/100 g (soil test) */
      cec_meq_per_100g: number;
      /** Provide Na as ppm (soil test). %Na will be derived. */
      sodium_ppm: number;
      /** Optional: % base saturation Na (if provided, it takes precedence over ppm) */
      baseSatNa_pct?: number;
    }
  | {
      cec_meq_per_100g: number;
      /** Provide % base saturation Na directly */
      baseSatNa_pct: number;
      /** sodium_ppm is optional; if omitted we'll derive it */
      sodium_ppm?: number;
    };

export type So4SodicOutput = {
  /** % base saturation Na actually used in calc (source-of-truth) */
  baseSatNa_pct: number;
  /** Sodium, ppm (provided or derived) */
  sodium_ppm: number;
  /** Na meq/L (provided via ppm or derived from %Na & CEC) */
  na_meq_per_L: number;
  /** meq Na / 100 g (CEC * %Na) */
  na_meq_per_100g: number;
  /** ESP (fraction 0–1) = %Na / 100 */
  esp: number;
  /** SO4 rate, tons/ac (≥0) */
  rate_tons_per_ac: number;
  /** SO4 rate, lb/ac (≥0) */
  rate_lbs_so4_per_ac: number;
  /** Notes (warnings, assumptions) */
  notes?: string[];
};

/** ---------- Constants (per your sheet) ---------- */
const PPM_PER_MEQ_PER_100G_NA = 230; // used in % base sat calc
const MG_PER_MEQ_NA = 23;            // ppm → meq/L
const TONS_TO_LBS = 2000;

const clamp0 = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);
const isFiniteNum = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);

/** ---------- Solver ---------- */
export function runSo4Sodic(input: So4SodicInput): So4SodicOutput {
  const notes: string[] = [];

  const cec = Math.max(0, Number((input as any).cec_meq_per_100g));
  const providedPpm = isFiniteNum((input as any).sodium_ppm) ? Math.max(0, Number((input as any).sodium_ppm)) : undefined;
  const providedPct = isFiniteNum((input as any).baseSatNa_pct) ? Math.max(0, Number((input as any).baseSatNa_pct)) : undefined;

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
    // With CEC ≤ 0 we cannot form %Na or rate. We can still show meq/L if ppm was given.
    const na_meq_per_L = providedPpm ? providedPpm / MG_PER_MEQ_NA : 0;
    return {
      baseSatNa_pct: 0,
      sodium_ppm: providedPpm ?? 0,
      na_meq_per_L,
      na_meq_per_100g: 0,
      esp: 0,
      rate_tons_per_ac: 0,
      rate_lbs_so4_per_ac: 0,
      notes: ["CEC must be > 0; returned 0 recommendation."],
    };
  }

  // Derive %Na to be the source of truth
  let baseSatNa_pct: number;
  if (isFiniteNum(providedPct)) {
    baseSatNa_pct = providedPct!;
  } else if (isFiniteNum(providedPpm)) {
    // %Na = ((ppm/230) / CEC) * 100
    baseSatNa_pct = ((providedPpm! / PPM_PER_MEQ_PER_100G_NA) / cec) * 100;
    notes.push("Base saturation %Na was derived from ppm.");
  } else {
    return {
      baseSatNa_pct: 0,
      sodium_ppm: 0,
      na_meq_per_L: 0,
      na_meq_per_100g: 0,
      esp: 0,
      rate_tons_per_ac: 0,
      rate_lbs_so4_per_ac: 0,
      notes: ["Provide either sodium_ppm or baseSatNa_pct."],
    };
  }

  // Derive ppm if not provided: ppm = (%Na/100) * CEC * 230
  const sodium_ppm = isFiniteNum(providedPpm) ? providedPpm! : (baseSatNa_pct / 100) * cec * PPM_PER_MEQ_PER_100G_NA;

  // Na meq/L = ppm / 23
  const na_meq_per_L = sodium_ppm / MG_PER_MEQ_NA;

  // meq Na / 100 g = CEC * (%Na/100)
  const na_meq_per_100g = cec * (baseSatNa_pct / 100);

  // ESP = %Na / 100 (fraction)
  const esp = baseSatNa_pct / 100;

  // Rate (tons/ac) = meq Na/100 g × 1.7 (floored at 0)
  const rate_tons_per_ac = clamp0(na_meq_per_100g * 1.7);

  // Rate (lb/ac) = tons/ac × 2000
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
