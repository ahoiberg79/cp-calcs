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
  useCase: UseCase98G;
  target_pH_98g: number; // used only when useCase = Correction
}

export interface SelectionAglime extends SelectionCommon {
  target_pH_aglime: number;
  ecce_percent: number; // e.g. 68.8
}

// ---------- Helpers ----------
const clamp0 = (n: number) => (n < 0 ? 0 : n);
const roundTo = (n: number, step: number) => Math.round(n / step) * step;

// Safe-ish evaluator for our controlled equations.
// Variables allowed: BpH, WpH, Math
function evalEquation(expr: string, BpH: number, WpH: number): number {
  if (!/^[0-9+\-*/().\sBpHWpMath]*[A-Za-z]*$/.test(expr.replace(/Math\.\w+/g, ""))) {
    throw new Error("Equation contains unexpected tokens");
  }

  // eslint-disable-next-line no-new-func
  const fn = new Function("BpH", "WpH", "Math", `return (${expr});`);
  const out = Number(fn(BpH, WpH, Math));

  if (!Number.isFinite(out)) {
    throw new Error("Equation returned non-finite value");
  }

  return out;
}

function pickRow(
  material: "98G" | "Aglime",
  institution: EquationSet,
  tillage: Tillage,
  target_pH: number
): EquationRow | undefined {
  return EQUATIONS.find(
    (r) =>
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
  const values = new Set<number>();

  for (const r of EQUATIONS) {
    if (
      r.material === material &&
      r.institution === institution &&
      r.tillage === tillage &&
      r.useCase === "Correction"
    ) {
      values.add(r.target_pH);
    }
  }

  return Array.from(values).sort((a, b) => a - b);
}

// ---------- Core calculators ----------
export function calc98G(selection: Selection98G) {
  if (selection.useCase === "Maintenance") {
    const lbs_ac = 250;
    const tons_ac = lbs_ac / 2000;

    return {
      tons_ac,
      lbs_ac,
      tons_ac_display: Number(tons_ac.toFixed(2)),
      lbs_ac_display: roundTo(lbs_ac, 50),
    };
  }

  const row = pickRow(
    "98G",
    selection.institution,
    selection.tillage,
    selection.target_pH_98g
  );

  if (!row) {
    throw new Error("No 98G equation row matched selection");
  }

  // 98G equations return lb/acre
  const lbs_ac = clamp0(evalEquation(row.equation, selection.buffer_pH, selection.soil_pH));
  const tons_ac = lbs_ac / 2000;

  return {
    tons_ac,
    lbs_ac,
    tons_ac_display: Number(tons_ac.toFixed(2)),
    lbs_ac_display: roundTo(lbs_ac, 50),
  };
}

export function calcAglime(selection: SelectionAglime) {
  const row = pickRow(
    "Aglime",
    selection.institution,
    selection.tillage,
    selection.target_pH_aglime
  );

  if (!row) {
    throw new Error("No aglime equation row matched selection");
  }

  // aglime equations return tons/acre before ECCE adjustment
  const base_tons_ac = clamp0(
    evalEquation(row.equation, selection.buffer_pH, selection.soil_pH)
  );

  const adjusted_tons_ac =
    selection.ecce_percent > 0
      ? base_tons_ac / (selection.ecce_percent / 100)
      : base_tons_ac;

  const tons_ac = clamp0(adjusted_tons_ac);
  const lbs_ac = tons_ac * 2000;

  return {
    tons_ac,
    lbs_ac,
    tons_ac_display: Number(tons_ac.toFixed(2)),
    lbs_ac_display: roundTo(lbs_ac, 50),
  };
}

// ---------- Economics ----------
export function economics(
  rate_tons_acre: number,
  cost_per_ton: number,
  yield_increase_bushels_acre: number,
  price_per_bushel: number
) {
  const cost_per_acre = rate_tons_acre * cost_per_ton;
  const revenue_increase = yield_increase_bushels_acre * price_per_bushel;
  const net_return = revenue_increase - cost_per_acre;

  return {
    cost_per_acre,
    revenue_increase,
    net_return,
  };
}