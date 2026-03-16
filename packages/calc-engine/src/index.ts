// packages/calc-engine/src/index.ts

export * from "./so4_sulfur";
export * from "./so4_high_mg";
export * from "./fertilizer_acidity";
export * from "./98g_vs_aglime";
export * from "./ph_efficiency";
export * from "./so4_sodic";

/* 98G application rate */
export {
  calc98GApplicationRate,
  list98GTargetPHs,
} from "./98g_application_rate";

export type {
  UseCase98GApplication,
  Selection98GApplication,
  Selection98GApplicationCorrection,
  Selection98GApplicationMaintenance,
  Calc98GApplicationResult,
  RateMethod,
} from "./98g_application_rate";

/* -------------------- pH Efficiency -------------------- */
export {
  runPhEfficiency,
  ALLOWED_PHS,
  DEFAULT_PRICE,
  listFertilizersFor,
} from "./ph_efficiency";

export type {
  Crop, Nutrient, FertilizerId, FertChoice, RunInput, RunOutput, EfficiencyRow
} from "./ph_efficiency";

export type {
  RunInput as PhEfficiencyInput,
  RunOutput as PhEfficiencyOutput,
  Crop as PhEfficiencyCrop,
} from "./ph_efficiency";

/* sodic */
export { runSo4Sodic } from "./so4_sodic";
export type { So4SodicInput, So4SodicOutput } from "./so4_sodic";