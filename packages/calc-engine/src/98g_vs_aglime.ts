import { EQUATIONS, type EquationRow } from "./data/98g_aglime_equations";

// ---------- Types ----------
export type EquationSet = "UW" | "ISU";
export type Tillage = "Conventional" | "No-Till";
export type UseCase98G = "Correction" | "Maintenance";

export interface SelectionCommon {
  institution: EquationSet;
  tillage: Tillage;
  soil_pH: number;   // WpH
  buffer_pH: number; // BpH
}

export interface Selection98G extends SelectionCommon {
  useCase: UseCase98G;      // Maintenance => always 250 lb/ac
  target_pH_98g: number;    // used only when useCase = Correction
}

export interface SelectionAglime extends SelectionCommon {
  target_pH_aglime: number;
  ecce_percent: number;     // e.g., 68.8
}

// ---------- Helpers ----------
const clamp0 = (n: number) => (n < 0 ? 0 : n);
const roundTo = (n: number, step: number) => Math.round(n / step) * step;

// Safe-ish evaluator for our controlled equations.
// Variables allowed: BpH (buffer), WpH (soil/water), Math
function evalEquationTons(expr: string, BpH: number, WpH: number): number {
  // Prevent accidental letters outside allowed tokens
  if (!/^[0-9+\-*/().\sBpHWpMath]*[A-Za-z]*$/.test(expr.replace(/Math\.\w+/g, ""))) {
    throw new Error("Equation contains unexpected tokens");
  }
  // eslint-disable-next-line no-new-func
  const fn = new Function("BpH", "WpH", "Math", `return (${expr});`);
  const out = Number(fn(BpH, WpH, Math));
  if (!Number.isFinite(out)) throw new Error("Equation returned non-finite");
  return out;
}

function pickRow(
  material: "98G" | "Aglime",
  institution: EquationSet,
  tillage: Tillage,
  target_pH: number
): EquationRow | undefined {
  return EQUATIONS.find(
    r =>
      r.material === material &&
      r.institution === institution &&
      r.tillage === tillage &&
      r.target_pH === target_pH &&
      r.useCase === "Correction"
  );
}

export function listTargetPHs(
  material: "98G" | "Aglime",
  institution: EquationSet,
  tillage: Tillage
): number[] {
  const s = new Set<number>();
  for (const r of EQUATIONS) {
    if (r.material === material && r.institution === institution && r.tillage === tillage && r.useCase === "Correction") {
      s.add(r.target_pH);
    }
  }
  return Array.from(s).sort((a, b) => a - b);
}

// ---------- Core calculators ----------
// BEFORE (was treating as tons)
export function calc98G(selection: Selection98G) {
  if (selection.useCase === "Maintenance") {
    const lbs_ac = 250;
    return {
      tons_ac: lbs_ac / 2000,
      lbs_ac: lbs_ac,
      tons_ac_display: Number((lbs_ac / 2000).toFixed(2)),
      lbs_ac_display: roundTo(lbs_ac, 50),
    };
  }

  const row = pickRow("98G", selection.institution, selection.tillage, selection.target_pH_98g);
  if (!row) throw new Error("No 98G equation row matched selection");

  // 🔁 CHANGE: equation returns LBS/AC for 98G → convert to tons
  const lbs = clamp0(evalEquationTons(row.equation, selection.buffer_pH, selection.soil_pH));
  const tons = lbs / 2000;

  return {
    tons_ac: tons,
    lbs_ac: lbs,
    tons_ac_display: Number(tons.toFixed(2)),
    lbs_ac_display: roundTo(lbs, 50),
  };
}


export function calcAglime(selection: SelectionAglime) {
  const row = pickRow("Aglime", selection.institution, selection.tillage, selection.target_pH_aglime);
  if (!row) throw new Error("No Aglime equation row matched selection");

  const baseTons = clamp0(evalEquationTons(row.equation, selection.buffer_pH, selection.soil_pH)); // pre-adjust
  // ECCE/NI adjustment (coded version): raise rate when ECCE is lower
  const adjTons = selection.ecce_percent > 0 ? baseTons / (selection.ecce_percent / 100) : baseTons;
  const tons = clamp0(adjTons);
  const lbs = tons * 2000;

  return {
    tons_ac: tons,
    lbs_ac: lbs,
    tons_ac_display: Number(tons.toFixed(2)),
    lbs_ac_display: roundTo(lbs, 50)
  };
}

// ---------- Economics ----------
export function economics(rate_ton_ac: number, cost_per_ton: number, yield_increase_bu: number, price_per_bu: number) {
  const cost_ac = rate_ton_ac * cost_per_ton;
  const roi = yield_increase_bu * price_per_bu;
  const net = cost_ac - roi; // per spec
  return {
    cost_per_ac: cost_ac,
    roi,
    net
  };
}
