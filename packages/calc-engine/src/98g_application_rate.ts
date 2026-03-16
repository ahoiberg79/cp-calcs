import { EQUATIONS, type EquationRow } from "./data/98g_aglime_equations";
import type { EquationSet, Tillage } from "./98g_vs_aglime";

export type UseCase98GApplication = "Correction" | "Maintenance";

export interface Selection98GApplicationCorrection {
  useCase: "Correction";
  institution: EquationSet;
  tillage: Tillage;
  soil_pH: number;
  buffer_pH: number;
  target_pH_98g: number;
}

export interface Selection98GApplicationMaintenance {
  useCase: "Maintenance";
  nitrogen_units_applied: number;
}

export type Selection98GApplication =
  | Selection98GApplicationCorrection
  | Selection98GApplicationMaintenance;

export type RateMethod = "equation" | "safety_net" | "maintenance";

export interface Calc98GApplicationResult {
  lbs_ac: number;
  lbs_ac_display: number;
  method: RateMethod;
  equation_lbs_ac?: number;
  safety_net_lbs_ac?: number;
  pH_gap?: number;
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

export function list98GTargetPHs(
  institution: EquationSet,
  tillage: Tillage
): number[] {
  const values = new Set<number>();

  for (const r of EQUATIONS) {
    if (
      r.material === "98G" &&
      r.institution === institution &&
      r.tillage === tillage &&
      r.useCase === "Correction"
    ) {
      values.add(r.target_pH);
    }
  }

  return Array.from(values).sort((a, b) => a - b);
}

export function calc98GApplicationRate(
  selection: Selection98GApplication
): Calc98GApplicationResult {
  if (selection.useCase === "Maintenance") {
    const lbs_ac = clamp0(selection.nitrogen_units_applied);

    return {
      lbs_ac,
      lbs_ac_display: Math.round(lbs_ac),
      method: "maintenance",
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

  const equation_lbs_ac = clamp0(
    evalEquation(row.equation, selection.buffer_pH, selection.soil_pH)
  );

  const pH_gap = Math.max(0, selection.target_pH_98g - selection.soil_pH);
  const safety_net_lbs_ac = pH_gap * 1000;

  const shouldUseSafetyNet =
    selection.soil_pH < selection.target_pH_98g && equation_lbs_ac <= 100;

  if (shouldUseSafetyNet) {
    return {
      lbs_ac: safety_net_lbs_ac,
      lbs_ac_display: roundTo(safety_net_lbs_ac, 50),
      method: "safety_net",
      equation_lbs_ac,
      safety_net_lbs_ac,
      pH_gap,
    };
  }

  return {
    lbs_ac: equation_lbs_ac,
    lbs_ac_display: roundTo(equation_lbs_ac, 50),
    method: "equation",
    equation_lbs_ac,
    pH_gap,
  };
}