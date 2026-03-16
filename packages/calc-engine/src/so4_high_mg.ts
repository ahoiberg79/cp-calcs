export type So4HighMgInput = {
  cec_cmolkg: number; // numerically equivalent to CEC in meq/100g
  basis: "percent" | "ppm";
  currentMg: number;  // if basis="percent" → % base saturation; if basis="ppm" → ppm
  desiredMg: number;  // same basis as current
};

export type So4HighMgOutput = {
  rate_ton_ac: number;
  rate_lbs_ac: number;
  details: {
    meqMg: number;
    pctToLower: number;
    fractionOfCurrent: number;
    meqToDisplace: number;
    factor_ton_per_meq: number;
    currentMgPct: number;
    desiredMgPct: number;
  };
};

// Approximate agronomy standard: 1 cmol(+)/kg of Mg ≈ 120.4 mg/kg (ppm)
const MG_PPM_PER_CMOLC = 120.4;

function pctFromPpm(ppmMg: number, cec: number): number {
  if (cec <= 0) return 0;
  const cmolcMg = ppmMg / MG_PPM_PER_CMOLC;
  return (cmolcMg / cec) * 100;
}

export function runSo4HighMg(i: So4HighMgInput): So4HighMgOutput {
  const { cec_cmolkg, basis } = i;

  const currentMgPct =
    basis === "percent"
      ? Math.max(0, i.currentMg)
      : pctFromPpm(Math.max(0, i.currentMg), cec_cmolkg);

  const desiredMgPct =
    basis === "percent"
      ? Math.max(0, i.desiredMg)
      : pctFromPpm(Math.max(0, i.desiredMg), cec_cmolkg);

  const meqMg = cec_cmolkg * (Math.max(0, Math.min(100, currentMgPct)) / 100);

  const pctToLower = Math.max(0, currentMgPct - desiredMgPct);

  const fractionOfCurrent =
    currentMgPct > 0 ? Math.min(1, pctToLower / currentMgPct) : 0;

  const meqToDisplace = meqMg * fractionOfCurrent;

  const factor_ton_per_meq = 0.68;
  const rate_ton_ac = Math.max(0, meqToDisplace * factor_ton_per_meq);
  const rate_lbs_ac = rate_ton_ac * 2000;

  return {
    rate_ton_ac,
    rate_lbs_ac,
    details: {
      meqMg,
      pctToLower,
      fractionOfCurrent,
      meqToDisplace,
      factor_ton_per_meq,
      currentMgPct,
      desiredMgPct,
    },
  };
}