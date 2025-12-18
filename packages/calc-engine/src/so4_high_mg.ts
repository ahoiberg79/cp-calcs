export type So4HighMgInput = {
  cec_cmolkg: number;          // CEC (cmolc/kg), required for %↔ppm conversion
  // Choose ONE basis for BOTH current & desired Mg:
  basis: "percent" | "ppm";
  currentMg: number;           // if basis="percent" → %; if basis="ppm" → ppm
  desiredMg: number;           // same basis as current
};

export type So4HighMgOutput = {
  rate_ton_ac: number;
  rate_lbs_ac: number;
  details: {
    meqMg: number;             // Calc 1, meq (cmolc) of Mg on exchange sites
    pctToLower: number;        // Calc 2, %Mg to lower (clamped ≥ 0)
    fractionOfCurrent: number; // Calc 3
    meqToDisplace: number;     // Calc 4
    factor_ton_per_meq: number;// 0.68
    // extra visibility
    currentMgPct: number;
    desiredMgPct: number;
  };
};

// Mg conversion helpers
// Approximate agronomy standard: 1 cmol(+)/kg of Mg ≈ 120.4 mg/kg (ppm)
const MG_PPM_PER_CMOLC = 120.4;

function pctFromPpm(ppmMg: number, cec: number): number {
  if (cec <= 0) return 0;
  const cmolcMg = ppmMg / MG_PPM_PER_CMOLC;
  return (cmolcMg / cec) * 100;
}

export function runSo4HighMg(i: So4HighMgInput): So4HighMgOutput {
  const { cec_cmolkg, basis } = i;

  // Normalize inputs to % base saturation
  const currentMgPct =
    basis === "percent" ? Math.max(0, i.currentMg) : pctFromPpm(Math.max(0, i.currentMg), cec_cmolkg);
  const desiredMgPct =
    basis === "percent" ? Math.max(0, i.desiredMg) : pctFromPpm(Math.max(0, i.desiredMg), cec_cmolkg);

  // Calc 1: meq Mg on exchange sites
  const meqMg = cec_cmolkg * (Math.max(0, Math.min(100, currentMgPct)) / 100);

  // Calc 2: %Mg to lower (sign fixed: current - desired), clamped ≥ 0
  const pctToLower = Math.max(0, currentMgPct - desiredMgPct);

  // Guard divide-by-zero
  const fractionOfCurrent =
    currentMgPct > 0 ? Math.min(1, pctToLower / currentMgPct) : 0;

  // Calc 4: meq to displace
  const meqToDisplace = meqMg * fractionOfCurrent;

  // Calc 5/6: rate
  const factor_ton_per_meq = 0.68; // as in your Excel
  const rate_ton_ac_raw = meqToDisplace * factor_ton_per_meq;
  const rate_ton_ac = Math.max(0, rate_ton_ac_raw);
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
