import { EQUATIONS, type EquationRow } from "./data/98g_aglime_equations";

export type EquationSet = "UW" | "ISU";
export type Tillage = "Conventional" | "No-Till";
export type UseCase98G = "Correction" | "Maintenance";
export type RateMethod98G = "equation" | "safety_net" | "maintenance";

export interface SelectionCommon {
  institution: EquationSet;
  tillage: Tillage;
  soil_pH: number;
  buffer_pH: number;
}

export interface Selection98G extends SelectionCommon {
  useCase: UseCase98G;
  target_pH_98g: number;
}

export interface SelectionAglime extends SelectionCommon {
  target_pH_aglime: number;
  ecce_percent: number;
}

const clamp0 = (n: number) => (n < 0 ? 0 : n);
const roundTo = (n: number, step: number) => Math.round(n / step) * step;

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

export function calc98G(selection: Selection98G) {
  if (selection.useCase === "Maintenance") {
    const lbs_ac = 250;
    const tons_ac = lbs_ac / 2000;

    return {
      tons_ac,
      lbs_ac,
      tons_ac_display: Number(tons_ac.toFixed(2)),
      lbs_ac_display: roundTo(lbs_ac, 50),
      method: "maintenance" as RateMethod98G,
    };
  }

  const row = pickRow("98G", selection.institution, selection.tillage, selection.target_pH_98g);

  if (!row) {
    throw new Error("No 98G equation row matched selection");
  }

  const equation_lbs_ac = clamp0(
    evalEquation(row.equation, selection.buffer_pH, selection.soil_pH)
  );

  const pH_gap = Math.max(0, selection.target_pH_98g - selection.soil_pH);
  const safety_net_lbs_ac = pH_gap * 1000;
  const lbs_ac = Math.max(equation_lbs_ac, safety_net_lbs_ac);
  const tons_ac = lbs_ac / 2000;

  const method: RateMethod98G =
    safety_net_lbs_ac > equation_lbs_ac ? "safety_net" : "equation";

  return {
    tons_ac,
    lbs_ac,
    tons_ac_display: Number(tons_ac.toFixed(2)),
    lbs_ac_display: roundTo(lbs_ac, 50),
    method,
    equation_lbs_ac,
    safety_net_lbs_ac,
    pH_gap,
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

  const base_tons_ac = clamp0(
    evalEquation(row.equation, selection.buffer_pH, selection.soil_pH)
  );

  const adjusted_tons_ac =
    selection.ecce_percent > 0 ? base_tons_ac / (selection.ecce_percent / 100) : base_tons_ac;

  const tons_ac = clamp0(adjusted_tons_ac);
  const lbs_ac = tons_ac * 2000;

  return {
    tons_ac,
    lbs_ac,
    tons_ac_display: Number(tons_ac.toFixed(2)),
    lbs_ac_display: roundTo(lbs_ac, 50),
  };
}

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