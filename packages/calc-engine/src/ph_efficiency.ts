/**
 * pH Efficiency — Fertilizer dollars at risk (engine)
 * - Dropdowns restricted by "primary" nutrient
 * - Rates sized to meet crop removal for P/K/S first, then N after crediting N from P/K/S products
 * - $ at risk + utilization emphasis: N/P/K only (S excluded by platform spec)
 */

export type Crop = "Corn Grain" | "Soybean" | "Wheat" | "Alfalfa";
export type Nutrient = "N" | "P2O5" | "K2O" | "S";

export type FertilizerId =
  // N sources
  | "NH3"
  | "Urea46"
  | "UAN32"
  | "UAN28"
  | "AN34"
  // P sources
  | "MAP11-52"
  | "DAP18-46"
  | "APP10-34"
  | "MES-S10"
  | "MES-S15"
  | "MES-SZ"
  | "Rock40"
  | "SSP"
  | "TSP"
  | "Croplex12-40"
  | "Croplex13-33"
  // K sources
  | "KCl60"
  | "KCl62"
  | "K2SO4"
  | "KTS"
  // S sources
  | "AMS"
  | "ATS"
  | "SO4"
  | "S90"
  | "S85";

export interface FertChoice {
  id: FertilizerId;
  pricePerTon: number;
}

export interface RunInput {
  crop: Crop;
  yieldGoal: number; // bu/ac (Alfalfa = ton/ac)
  soil_pH: number; // snapped to ALLOWED_PHS internally
  n: FertChoice;
  p: FertChoice;
  k: FertChoice;
  s: FertChoice;
}

export interface EfficiencyRow {
  nutrient: Nutrient;
  needed_lb_ac: number;
  supplied_lb_ac: number; // we size to meet removal
  utilization_frac: number; // from pH curve
  rate_lb_ac: number; // product rate used for this nutrient
  cost_per_ac: number; // $/A for this nutrient’s product
  atRiskDollarsPerAc: number; // cost * (1 - utilization) [S excluded in totals by spec]
  fertilizer: FertilizerId;
  analysis_pct: number; // percent of that nutrient in that product
}

export interface FertRow {
  id: FertilizerId;
  label: string;
  primary: Nutrient;
  pricePerTon: number;
  analysis_pct: { N: number; P2O5: number; K2O: number; S: number };
  rate_lb_ac: number;
  cost_per_ac: number;
  supplied_lb_ac: { N: number; P2O5: number; K2O: number; S: number };
}

export interface RunOutput {
  rows: EfficiencyRow[]; // one per nutrient (N,P,K,S)
  fertRows: FertRow[]; // one per selected product (N,P,K,S)
  suppliedTotals: { N: number; P2O5: number; K2O: number; S: number };

  totalCostPerAc: number;

  // Spec: show $ at risk due to soil pH for N/P/K only (exclude S)
  totalAtRiskDollarsPerAc: number;

  // convenience for UI tiles (N/P/K only)
  cards: {
    N: { util: number; atRisk: number; cost: number };
    P: { util: number; atRisk: number; cost: number };
    K: { util: number; atRisk: number; cost: number };
  };

  emphasis: "P2O5";
}

/* ------------------------- Config / reference data ---------------------- */

export const ALLOWED_PHS = [5.0, 5.2, 5.4, 5.6, 5.8, 6.0, 6.3, 6.5, 6.8] as const;

/** Crop removal per unit yield (bu/ac; Alfalfa = ton/ac). */
const CROP_REMOVAL: Record<Crop, { N: number; P2O5: number; K2O: number; S: number }> = {
  "Corn Grain": { N: 1.0, P2O5: 0.32, K2O: 0.22, S: 0.08 },
  Soybean: { N: 0.0, P2O5: 0.80, K2O: 1.40, S: 0.10 }, // placeholders
  Wheat: { N: 1.2, P2O5: 0.60, K2O: 0.35, S: 0.08 }, // placeholders
  Alfalfa: { N: 0.0, P2O5: 1.30, K2O: 5.50, S: 0.25 }, // per ton, placeholders
};

/** Utilization (efficiency) per nutrient by soil pH. */
const EFFICIENCY: Record<(typeof ALLOWED_PHS)[number], Record<Nutrient, number>> = {
  5.0: { N: 0.53, P2O5: 0.34, K2O: 0.52, S: 0.85 },
  5.2: { N: 0.58, P2O5: 0.40, K2O: 0.55, S: 0.86 },
  5.4: { N: 0.63, P2O5: 0.48, K2O: 0.58, S: 0.88 },
  5.6: { N: 0.68, P2O5: 0.57, K2O: 0.63, S: 0.90 },
  5.8: { N: 0.73, P2O5: 0.66, K2O: 0.70, S: 0.92 },
  6.0: { N: 0.78, P2O5: 0.75, K2O: 0.78, S: 0.95 },
  6.3: { N: 0.85, P2O5: 0.86, K2O: 0.88, S: 0.98 },
  6.5: { N: 0.90, P2O5: 0.92, K2O: 0.93, S: 1.00 },
  6.8: { N: 0.95, P2O5: 0.96, K2O: 0.96, S: 1.00 },
};

/** Catalog with strict “primary” nutrient so dropdowns show only intended choices. */
export type FertEntry = {
  label: string;
  analysis: { N: number; P2O5: number; K2O: number; S: number };
  primary: Nutrient[]; // which selector(s) show it (strict!)
  defaultPrice: number;
};

export const FERT_CATALOG: Record<FertilizerId, FertEntry> = {
  // N
  NH3: { label: "Anhydrous Ammonia (82-0-0)", analysis: { N: 82, P2O5: 0, K2O: 0, S: 0 }, primary: ["N"], defaultPrice: 550 },
  Urea46: { label: "Urea (46-0-0)", analysis: { N: 46, P2O5: 0, K2O: 0, S: 0 }, primary: ["N"], defaultPrice: 500 },
  UAN32: { label: "32% UAN (32-0-0)", analysis: { N: 32, P2O5: 0, K2O: 0, S: 0 }, primary: ["N"], defaultPrice: 350 },
  UAN28: { label: "28% UAN (28-0-0)", analysis: { N: 28, P2O5: 0, K2O: 0, S: 0 }, primary: ["N"], defaultPrice: 330 },
  AN34: { label: "Ammonium Nitrate (34-0-0)", analysis: { N: 34, P2O5: 0, K2O: 0, S: 0 }, primary: ["N"], defaultPrice: 520 },

  // P
  "MAP11-52": { label: "Monoammonium Phosphate (MAP 11-52-0)", analysis: { N: 11, P2O5: 52, K2O: 0, S: 0 }, primary: ["P2O5"], defaultPrice: 850 },
  "DAP18-46": { label: "Diammonium Phosphate (DAP 18-46-0)", analysis: { N: 18, P2O5: 46, K2O: 0, S: 0 }, primary: ["P2O5"], defaultPrice: 820 },
  "APP10-34": { label: "Ammonium Polyphosphate (10-34-0)", analysis: { N: 10, P2O5: 34, K2O: 0, S: 0 }, primary: ["P2O5"], defaultPrice: 780 },
  "MES-S10": { label: "MicroEssentials S10 (12-40-0-10S)", analysis: { N: 12, P2O5: 40, K2O: 0, S: 10 }, primary: ["P2O5"], defaultPrice: 900 },
  "MES-S15": { label: "MicroEssentials S15 (13-33-0-15S)", analysis: { N: 13, P2O5: 33, K2O: 0, S: 15 }, primary: ["P2O5"], defaultPrice: 900 },
  "MES-SZ": { label: "MicroEssentials SZ (12-40-0-10S)", analysis: { N: 12, P2O5: 40, K2O: 0, S: 10 }, primary: ["P2O5"], defaultPrice: 900 },
  Rock40: { label: "40 Rock (0-28-0)", analysis: { N: 0, P2O5: 28, K2O: 0, S: 0 }, primary: ["P2O5"], defaultPrice: 500 },
  SSP: { label: "Single Superphosphate (0-20-0-12S)", analysis: { N: 0, P2O5: 20, K2O: 0, S: 12 }, primary: ["P2O5"], defaultPrice: 520 },
  TSP: { label: "Triple Superphosphate (0-46-0)", analysis: { N: 0, P2O5: 46, K2O: 0, S: 0 }, primary: ["P2O5"], defaultPrice: 780 },
  "Croplex12-40": { label: "Croplex 12-40-0", analysis: { N: 12, P2O5: 40, K2O: 0, S: 0 }, primary: ["P2O5"], defaultPrice: 880 },
  "Croplex13-33": { label: "Croplex 13-33-0", analysis: { N: 13, P2O5: 33, K2O: 0, S: 0 }, primary: ["P2O5"], defaultPrice: 870 },

  // K
  KCl60: { label: "Potassium Chloride 60%", analysis: { N: 0, P2O5: 0, K2O: 60, S: 0 }, primary: ["K2O"], defaultPrice: 400 },
  KCl62: { label: "Potassium Chloride 62%", analysis: { N: 0, P2O5: 0, K2O: 62, S: 0 }, primary: ["K2O"], defaultPrice: 420 },
  K2SO4: { label: "Potassium Sulfate (0-0-50-18S)", analysis: { N: 0, P2O5: 0, K2O: 50, S: 18 }, primary: ["K2O"], defaultPrice: 600 },
  KTS: { label: "Potassium Thiosulfate (0-0-25-17S)", analysis: { N: 0, P2O5: 0, K2O: 25, S: 17 }, primary: ["K2O"], defaultPrice: 580 },

  // S
  AMS: { label: "Ammonium Sulfate (21-0-0-24S)", analysis: { N: 21, P2O5: 0, K2O: 0, S: 24 }, primary: ["S"], defaultPrice: 550 },
  ATS: { label: "Ammonium Thiosulfate (12-0-0-26S)", analysis: { N: 12, P2O5: 0, K2O: 0, S: 26 }, primary: ["S"], defaultPrice: 520 },
  SO4: { label: "SO4 Pelletized Gypsum (0-0-0-17S)", analysis: { N: 0, P2O5: 0, K2O: 0, S: 17 }, primary: ["S"], defaultPrice: 150 },
  S90: { label: "Elemental Sulfur 90%", analysis: { N: 0, P2O5: 0, K2O: 0, S: 90 }, primary: ["S"], defaultPrice: 400 },
  S85: { label: "Elemental Sulfur 85%", analysis: { N: 0, P2O5: 0, K2O: 0, S: 85 }, primary: ["S"], defaultPrice: 380 },
};

/** For dropdowns (STRICT: uses catalog.primary) */
export function listFertilizersFor(nutrient: Nutrient): { id: FertilizerId; label: string }[] {
  return (Object.keys(FERT_CATALOG) as FertilizerId[])
    .filter((id) => FERT_CATALOG[id].primary.includes(nutrient))
    .map((id) => ({ id, label: FERT_CATALOG[id].label }));
}

export const DEFAULT_PRICE: Record<FertilizerId, number> = Object.fromEntries(
  (Object.keys(FERT_CATALOG) as FertilizerId[]).map((id) => [id, FERT_CATALOG[id].defaultPrice])
) as Record<FertilizerId, number>;

/* ------------------------------- Helpers -------------------------------- */

const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;

function snapPH(pH: number): (typeof ALLOWED_PHS)[number] {
  let best: (typeof ALLOWED_PHS)[number] = ALLOWED_PHS[0];
  let dBest = Math.abs(pH - best);

  for (const v of ALLOWED_PHS) {
    const d = Math.abs(pH - v);
    if (d < dBest) {
      best = v;   
      dBest = d;
    }
  }
  return best;
}

function rateFromPct(pct: number, units: number) {
  return pct <= 0 ? 0 : units / (pct / 100);
}

function dollarsPerA(rateLbAc: number, pricePerTon: number) {
  return (rateLbAc / 2000) * pricePerTon;
}

function unitsSupplied(analysis: { N: number; P2O5: number; K2O: number; S: number }, rate: number) {
  return {
    N: (analysis.N / 100) * rate,
    P2O5: (analysis.P2O5 / 100) * rate,
    K2O: (analysis.K2O / 100) * rate,
    S: (analysis.S / 100) * rate,
  };
}

/* --------------------------------- Main ---------------------------------- */

export function runPhEfficiency(input: RunInput): RunOutput {
  const pH = snapPH(input.soil_pH);
  const eff = EFFICIENCY[pH];

  const rem = CROP_REMOVAL[input.crop];
  const need = {
    N: rem.N * input.yieldGoal,
    P2O5: rem.P2O5 * input.yieldGoal,
    K2O: rem.K2O * input.yieldGoal,
    S: rem.S * input.yieldGoal,
  };

  const Nf = FERT_CATALOG[input.n.id];
  const Pf = FERT_CATALOG[input.p.id];
  const Kf = FERT_CATALOG[input.k.id];
  const Sf = FERT_CATALOG[input.s.id];

  // Defensive guard (prevents any "undefined.analysis" runtime crash if IDs ever drift)
  if (!Nf) throw new Error(`[ph_efficiency] Unknown N fertilizer id: ${input.n.id}`);
  if (!Pf) throw new Error(`[ph_efficiency] Unknown P fertilizer id: ${input.p.id}`);
  if (!Kf) throw new Error(`[ph_efficiency] Unknown K fertilizer id: ${input.k.id}`);
  if (!Sf) throw new Error(`[ph_efficiency] Unknown S fertilizer id: ${input.s.id}`);

  // Size P/K/S first, then credit their N to reduce the N rate.
  const rP = rateFromPct(Pf.analysis.P2O5, need.P2O5);
  const rK = rateFromPct(Kf.analysis.K2O, need.K2O);
  const rS = rateFromPct(Sf.analysis.S, need.S);

  const sp = unitsSupplied(Pf.analysis, rP);
  const sk = unitsSupplied(Kf.analysis, rK);
  const ss = unitsSupplied(Sf.analysis, rS);

  const creditedN = sp.N + sk.N + ss.N;
  const nNeedAfterCredits = Math.max(0, need.N - creditedN);
  const rN = rateFromPct(Nf.analysis.N, nNeedAfterCredits);
  const sn = unitsSupplied(Nf.analysis, rN);

  const costN = dollarsPerA(rN, input.n.pricePerTon);
  const costP = dollarsPerA(rP, input.p.pricePerTon);
  const costK = dollarsPerA(rK, input.k.pricePerTon);
  const costS = dollarsPerA(rS, input.s.pricePerTon);

  const rows: EfficiencyRow[] = (["N", "P2O5", "K2O", "S"] as Nutrient[]).map((n) => {
    const rate = n === "N" ? rN : n === "P2O5" ? rP : n === "K2O" ? rK : rS;
    const cost = n === "N" ? costN : n === "P2O5" ? costP : n === "K2O" ? costK : costS;
    const fert = n === "N" ? input.n.id : n === "P2O5" ? input.p.id : n === "K2O" ? input.k.id : input.s.id;
    const analysisPct =
      n === "N" ? Nf.analysis.N : n === "P2O5" ? Pf.analysis.P2O5 : n === "K2O" ? Kf.analysis.K2O : Sf.analysis.S;

    const util = eff[n] ?? 1;

    return {
      nutrient: n,
      needed_lb_ac: r1(need[n]),
      supplied_lb_ac: r1(need[n]),
      utilization_frac: util,
      rate_lb_ac: r1(rate),
      cost_per_ac: r2(cost),
      atRiskDollarsPerAc: r2(cost * (1 - util)),
      fertilizer: fert,
      analysis_pct: analysisPct,
    };
  });

  const fertRows: FertRow[] = [
    {
      id: input.n.id,
      label: Nf.label,
      primary: "N",
      pricePerTon: input.n.pricePerTon,
      analysis_pct: { ...Nf.analysis },
      rate_lb_ac: r1(rN),
      cost_per_ac: r2(costN),
      supplied_lb_ac: { N: r1(sn.N), P2O5: r1(sn.P2O5), K2O: r1(sn.K2O), S: r1(sn.S) },
    },
    {
      id: input.p.id,
      label: Pf.label,
      primary: "P2O5",
      pricePerTon: input.p.pricePerTon,
      analysis_pct: { ...Pf.analysis },
      rate_lb_ac: r1(rP),
      cost_per_ac: r2(costP),
      supplied_lb_ac: { N: r1(sp.N), P2O5: r1(sp.P2O5), K2O: r1(sp.K2O), S: r1(sp.S) },
    },
    {
      id: input.k.id,
      label: Kf.label,
      primary: "K2O",
      pricePerTon: input.k.pricePerTon,
      analysis_pct: { ...Kf.analysis },
      rate_lb_ac: r1(rK),
      cost_per_ac: r2(costK),
      supplied_lb_ac: { N: r1(sk.N), P2O5: r1(sk.P2O5), K2O: r1(sk.K2O), S: r1(sk.S) },
    },
    {
      id: input.s.id,
      label: Sf.label,
      primary: "S",
      pricePerTon: input.s.pricePerTon,
      analysis_pct: { ...Sf.analysis },
      rate_lb_ac: r1(rS),
      cost_per_ac: r2(costS),
      supplied_lb_ac: { N: r1(ss.N), P2O5: r1(ss.P2O5), K2O: r1(ss.K2O), S: r1(ss.S) },
    },
  ];

  const suppliedTotals = {
    N: r1(sn.N + sp.N + sk.N + ss.N),
    P2O5: r1(sn.P2O5 + sp.P2O5 + sk.P2O5 + ss.P2O5),
    K2O: r1(sn.K2O + sp.K2O + sk.K2O + ss.K2O),
    S: r1(sn.S + sp.S + sk.S + ss.S),
  };

  const totalCostPerAc = r2(costN + costP + costK + costS);

  // Spec: N/P/K only for dollars-at-risk summary
  const nRow = rows.find((r) => r.nutrient === "N")!;
  const pRow = rows.find((r) => r.nutrient === "P2O5")!;
  const kRow = rows.find((r) => r.nutrient === "K2O")!;
  const totalAtRiskDollarsPerAc = r2(nRow.atRiskDollarsPerAc + pRow.atRiskDollarsPerAc + kRow.atRiskDollarsPerAc);

  const cards = {
    N: { util: nRow.utilization_frac, atRisk: nRow.atRiskDollarsPerAc, cost: nRow.cost_per_ac },
    P: { util: pRow.utilization_frac, atRisk: pRow.atRiskDollarsPerAc, cost: pRow.cost_per_ac },
    K: { util: kRow.utilization_frac, atRisk: kRow.atRiskDollarsPerAc, cost: kRow.cost_per_ac },
  };

  return {
    rows,
    fertRows,
    suppliedTotals,
    totalCostPerAc,
    totalAtRiskDollarsPerAc,
    cards,
    emphasis: "P2O5",
  };
}
