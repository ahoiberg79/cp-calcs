/**
 * Nutrient dollars at risk vs soil pH (no Excel dependency).
 * - Catalog of fertilizers with analyses and default prices
 * - Per-nutrient dropdowns (N, P, K, S) using `primary` tags
 * - N product is sized AFTER crediting N contributed by P/K/S choices
 * - "$ at risk" cards allocate each product's cost by nutrient share
 */

export type Crop = "Corn Grain" | "Soybean" | "Wheat" | "Alfalfa";
export type Nutrient = "N" | "P2O5" | "K2O" | "S";

/** Allowed soil pH menu (typed literal union) */
export const ALLOWED_PHS = [5.0, 5.2, 5.4, 5.6, 5.8, 6.0, 6.3, 6.5, 6.8] as const;

/* crop removal per unit yield (bu/ac, alfalfa in tons/ac – placeholders except Corn) */
const CROP_REMOVAL: Record<Crop, { N: number; P2O5: number; K2O: number; S: number }> = {
  "Corn Grain": { N: 1.00, P2O5: 0.32, K2O: 0.22, S: 0.08 },
  Soybean:      { N: 0.00, P2O5: 0.80, K2O: 1.40, S: 0.10 },
  Wheat:        { N: 1.20, P2O5: 0.60, K2O: 0.35, S: 0.08 },
  Alfalfa:      { N: 0.00, P2O5: 1.30, K2O: 5.50, S: 0.25 },
};

/** Fertilizers we support */
export type FertilizerId =
  // N
  | "NH3" | "Urea46" | "AN34" | "UAN32" | "UAN28"
  // P
  | "MAP11-52" | "DAP18-46" | "APP-10-34-0" | "MES-S10" | "MES-S15" | "MES-SZ" | "FortyRock" | "SSP" | "TSP" | "Croplex-12-40-0" | "Croplex-13-33-0"
  // K
  | "KCl60" | "KCl62" | "K2SO4-50" | "KTS-0-0-25-17S"
  // S
  | "AMS-21-24S" | "ATS-12-0-0-26S" | "SO4-17S" | "ElemS-90" | "ElemS-85";

type FertEntry = {
  label: string;
  analysis: { N: number; P2O5: number; K2O: number; S: number };
  /** Which nutrient dropdown(s) should list this product */
  primary: Nutrient[];
  defaultPrice: number; // $/ton
};

const FERT_CATALOG: Record<FertilizerId, FertEntry> = {
  // ---------- N ----------
  NH3:    { label: "Anhydrous Ammonia (82-0-0)", analysis: { N:82,P2O5:0,K2O:0,S:0 }, primary:["N"], defaultPrice:550 },
  Urea46: { label: "Urea (46-0-0)",              analysis: { N:46,P2O5:0,K2O:0,S:0 }, primary:["N"], defaultPrice:500 },
  UAN32:  { label: "32 % UAN (32-0-0)",          analysis: { N:32,P2O5:0,K2O:0,S:0 }, primary:["N"], defaultPrice:350 },
  UAN28:  { label: "28 % UAN (28-0-0)",          analysis: { N:28,P2O5:0,K2O:0,S:0 }, primary:["N"], defaultPrice:330 },
  AN34:   { label: "Ammonium Nitrate (34-0-0)",  analysis: { N:34,P2O5:0,K2O:0,S:0 }, primary:["N"], defaultPrice:520 },

  // ---------- P ----------
  "MAP11-52":        { label:"Monoammonium Phosphate (MAP 11-52-0)",  analysis:{N:11,P2O5:52,K2O:0,S:0}, primary:["P2O5"], defaultPrice:850 },
  "DAP18-46":        { label:"Diammonium Phosphate (DAP 18-46-0)",     analysis:{N:18,P2O5:46,K2O:0,S:0}, primary:["P2O5"], defaultPrice:820 },
  "APP-10-34-0":     { label:"Ammonium Polyphosphate (10-34-0)",       analysis:{N:10,P2O5:34,K2O:0,S:0}, primary:["P2O5"], defaultPrice:780 },
  "MES-S10":         { label:"MicroEssentials S10 (12-40-0-10S)",      analysis:{N:12,P2O5:40,K2O:0,S:10},primary:["P2O5"], defaultPrice:900 },
  "MES-S15":         { label:"MicroEssentials S15 (13-33-0-15S)",      analysis:{N:13,P2O5:33,K2O:0,S:15},primary:["P2O5"], defaultPrice:900 },
  "MES-SZ":          { label:"MicroEssentials SZ (12-40-0-10S)",       analysis:{N:12,P2O5:40,K2O:0,S:10},primary:["P2O5"], defaultPrice:900 },
  "FortyRock":       { label:"40 Rock (0-28-0)",                       analysis:{N:0,P2O5:28,K2O:0,S:0}, primary:["P2O5"], defaultPrice:500 },
  "SSP":             { label:"Single Superphosphate (0-20-0-12S)",     analysis:{N:0,P2O5:20,K2O:0,S:12},primary:["P2O5"], defaultPrice:520 },
  "TSP":             { label:"Triple Superphosphate (0-46-0)",         analysis:{N:0,P2O5:46,K2O:0,S:0}, primary:["P2O5"], defaultPrice:780 },
  "Croplex-12-40-0": { label:"Croplex 12-40-0",                        analysis:{N:12,P2O5:40,K2O:0,S:0}, primary:["P2O5"], defaultPrice:880 },
  "Croplex-13-33-0": { label:"Croplex 13-33-0",                        analysis:{N:13,P2O5:33,K2O:0,S:0}, primary:["P2O5"], defaultPrice:870 },

  // ---------- K ----------
  KCl60:             { label:"Potassium Chloride 60 %",                analysis:{N:0,P2O5:0,K2O:60,S:0}, primary:["K2O"], defaultPrice:400 },
  KCl62:             { label:"Potassium Chloride 62 %",                analysis:{N:0,P2O5:0,K2O:62,S:0}, primary:["K2O"], defaultPrice:420 },
  "K2SO4-50":        { label:"Potassium Sulfate (0-0-50-18S)",         analysis:{N:0,P2O5:0,K2O:50,S:18},primary:["K2O"], defaultPrice:600 },
  "KTS-0-0-25-17S":  { label:"Potassium Thiosulfate (0-0-25-17S)",     analysis:{N:0,P2O5:0,K2O:25,S:17},primary:["K2O"], defaultPrice:580 },

  // ---------- S ----------
  "AMS-21-24S":      { label:"Ammonium Sulfate (21-0-0-24S)",          analysis:{N:21,P2O5:0,K2O:0,S:24},primary:["S"], defaultPrice:550 },
  "ATS-12-0-0-26S":  { label:"Ammonium Thiosulfate (12-0-0-26S)",      analysis:{N:12,P2O5:0,K2O:0,S:26},primary:["S"], defaultPrice:520 },
  "SO4-17S":         { label:"SO₄ Pelletized Gypsum (0-0-0-17S)",      analysis:{N:0,P2O5:0,K2O:0,S:17}, primary:["S"], defaultPrice:150 },
  "ElemS-90":        { label:"Elemental Sulfur 90 %",                  analysis:{N:0,P2O5:0,K2O:0,S:90}, primary:["S"], defaultPrice:400 },
  "ElemS-85":        { label:"Elemental Sulfur 85 %",                  analysis:{N:0,P2O5:0,K2O:0,S:85}, primary:["S"], defaultPrice:380 },
};

/** Lists for per-nutrient menus (strictly filtered) */
export function listFertilizersFor(n: Nutrient): { id: FertilizerId; label: string }[] {
  return (Object.keys(FERT_CATALOG) as FertilizerId[])
    .filter(id => FERT_CATALOG[id].primary.includes(n))
    .map(id => ({ id, label: FERT_CATALOG[id].label }));
}

/** Default prices by id (for UI defaults) */
export const DEFAULT_PRICE: Record<FertilizerId, number> = Object.fromEntries(
  (Object.keys(FERT_CATALOG) as FertilizerId[]).map(id => [id, FERT_CATALOG[id].defaultPrice])
) as Record<FertilizerId, number>;

/** pH → utilization fractions */
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

/* ---------------- types exported to the app ---------------- */

export interface FertChoice {
  id: FertilizerId;
  pricePerTon: number; // $/ton
}

export interface RunInput {
  crop: Crop;
  yieldGoal: number;
  soil_pH: number; // will be clamped to ALLOWED_PHS
  n: FertChoice;
  p: FertChoice;
  k: FertChoice;
  s: FertChoice;
}

export interface EfficiencyRow {
  nutrient: Nutrient;
  needed_lb_ac: number;
  utilization_frac: number;
  rate_lb_ac: number;         // product rate to meet removal (after credits for N)
  cost_per_ac: number;        // product cost for that nutrient
  atRisk_per_ac: number;      // = cost_per_ac * (1 - utilization)
  fertilizer: FertilizerId;
  analysis_pct: number;
}

export interface RunOutput {
  rows: EfficiencyRow[];                 // N, P2O5, K2O, S order
  totalCostPerAc: number;
  totalAtRiskPerAc: number;
  cards: {                               // N/P/K cards below the table
    N: { util: number; atRisk: number };
    P: { util: number; atRisk: number };
    K: { util: number; atRisk: number };
  };
}

/* ---------------- helpers ---------------- */

function clampToAllowedPH(pH: number): (typeof ALLOWED_PHS)[number] {
  let best: (typeof ALLOWED_PHS)[number] = ALLOWED_PHS[0];
  let dBest = Math.abs(pH - best);
  for (const v of ALLOWED_PHS as readonly (typeof ALLOWED_PHS)[number][]) {
    const d = Math.abs(pH - v);
    if (d < dBest) { best = v; dBest = d; }
  }
  return best;
}

function rateFromPct(pct: number, unitsLb: number): number {
  if (pct <= 0) return 0;
  return unitsLb / (pct / 100);
}
function dollarsPerA(rateLbAc: number, pricePerTon: number): number {
  return (rateLbAc / 2000) * pricePerTon;
}
const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;

/* ---------------- main ---------------- */

export function runPhEfficiency(input: RunInput): RunOutput {
  const pH = clampToAllowedPH(input.soil_pH);
  const util = EFFICIENCY[pH];

  const removal = CROP_REMOVAL[input.crop];
  const needed = {
    N:   removal.N   * input.yieldGoal,
    P2O5:removal.P2O5* input.yieldGoal,
    K2O: removal.K2O * input.yieldGoal,
    S:   removal.S   * input.yieldGoal,
  };

  // Selected entries
  const entries = {
    N: FERT_CATALOG[input.n.id],
    P2O5: FERT_CATALOG[input.p.id],
    K2O: FERT_CATALOG[input.k.id],
    S: FERT_CATALOG[input.s.id],
  };

  // Product rates for P/K/S directly to meet removal
  const rateP = rateFromPct(entries.P2O5.analysis.P2O5, needed.P2O5);
  const rateK = rateFromPct(entries.K2O.analysis.K2O, needed.K2O);
  const rateS = rateFromPct(entries.S.analysis.S,     needed.S);

  // N contributed by P/K/S products
  const nFromP = rateP * (entries.P2O5.analysis.N / 100);
  const nFromK = rateK * (entries.K2O.analysis.N / 100);
  const nFromS = rateS * (entries.S.analysis.N / 100);
  const nCredit = nFromP + nFromK + nFromS;

  const nNeedFromNProduct = Math.max(0, needed.N - nCredit);
  const rateN = rateFromPct(entries.N.analysis.N, nNeedFromNProduct);

  // Row builder
  const row = (nutrient: Nutrient, rate: number, choice: FertChoice): EfficiencyRow => {
    const ent = FERT_CATALOG[choice.id];
    const cost = dollarsPerA(rate, choice.pricePerTon);
    const u = util[nutrient];
    return {
      nutrient,
      needed_lb_ac: r1(needed[nutrient]),
      utilization_frac: u,
      rate_lb_ac: r1(rate),
      cost_per_ac: r2(cost),
      atRisk_per_ac: r2(cost * (1 - u)),
      fertilizer: choice.id,
      analysis_pct: ent.analysis[nutrient],
    };
  };

  const rows: EfficiencyRow[] = [
    row("N",   rateN, input.n),
    row("P2O5",rateP, input.p),
    row("K2O", rateK, input.k),
    row("S",   rateS, input.s),
  ];

  const totalCostPerAc   = r2(rows.reduce((s, r) => s + r.cost_per_ac, 0));
  const totalAtRiskPerAc = r2(rows.reduce((s, r) => s + r.atRisk_per_ac, 0));

  // ---------- Bottom cards: allocate each product's cost by nutrient share ----------
  const productCosts = {
    N:   dollarsPerA(rateN, input.n.pricePerTon),
    P2O5:dollarsPerA(rateP, input.p.pricePerTon),
    K2O: dollarsPerA(rateK, input.k.pricePerTon),
    S:   dollarsPerA(rateS, input.s.pricePerTon),
  };

  function share(ent: FertEntry, n: Nutrient): number {
    const sum = ent.analysis.N + ent.analysis.P2O5 + ent.analysis.K2O + ent.analysis.S;
    return sum > 0 ? (ent.analysis[n] / sum) : 0;
  }

  const allocatedCost: Record<Nutrient, number> = { N: 0, P2O5: 0, K2O: 0, S: 0 };
  ([
    { n: "N"   as const, ent: entries.N,   cost: productCosts.N   },
    { n: "P2O5"as const, ent: entries.P2O5,cost: productCosts.P2O5},
    { n: "K2O" as const, ent: entries.K2O, cost: productCosts.K2O },
    { n: "S"   as const, ent: entries.S,   cost: productCosts.S   },
  ]).forEach(p => {
    // allocate this product’s cost to each nutrient by analysis % share
    (["N","P2O5","K2O","S"] as Nutrient[]).forEach(nu => {
      allocatedCost[nu] += p.cost * share(p.ent, nu);
    });
  });

  const cards = {
    N: { util: util.N,   atRisk: r2(allocatedCost.N   * (1 - util.N)) },
    P: { util: util.P2O5,atRisk: r2(allocatedCost.P2O5* (1 - util.P2O5)) },
    K: { util: util.K2O, atRisk: r2(allocatedCost.K2O * (1 - util.K2O)) },
  };

  return { rows, totalCostPerAc, totalAtRiskPerAc, cards };
}
