export type AmsInput = {
  targetS_lb_ac: number;
  analysis: { N_pct: number; S_pct: number }; // e.g., AMS 21-0-0-24
};

export type AmsOutput = {
  ams_required_lb_ac: number;
  n_credit_lb_ac: number;
};

export function runAmsSulfur(i: AmsInput): AmsOutput {
  const sPerLb = i.analysis.S_pct / 100; // lb S per lb of product
  const ams_required_lb_ac = i.targetS_lb_ac / (sPerLb || 1);
  const n_credit_lb_ac = ams_required_lb_ac * (i.analysis.N_pct / 100);
  return { ams_required_lb_ac, n_credit_lb_ac };
}
