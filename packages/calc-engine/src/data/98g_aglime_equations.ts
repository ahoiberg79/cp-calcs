// GENERATED FILE. Do not edit by hand.
// Source: packages/calc-engine/data/equations.csv

export type EquationRow = {
  useCase: "Correction";
  material: "98G" | "Aglime";
  institution: "UW" | "ISU";
  target_pH: number;
  tillage: "Conventional" | "No-Till";
  // Returns: for 98G => LBS/AC   |   for Aglime => TONS/AC (pre-ECCE)
  equation: string;
};

export const EQUATIONS: EquationRow[] = [
  { useCase: "Correction", material: "Aglime", institution: "ISU", target_pH: 6, tillage: "Conventional", equation: `((38619 - (5915 * BpH)) * (6 * 0.167)) / 2000` },
  { useCase: "Correction", material: "Aglime", institution: "ISU", target_pH: 6.5, tillage: "Conventional", equation: `((49886 - (7245 * BpH)) * (6 * 0.167)) / 2000` },
  { useCase: "Correction", material: "Aglime", institution: "ISU", target_pH: 6.8, tillage: "Conventional", equation: `((58776 - (8244 * BpH)) * (6 * 0.167)) / 2000` },
  { useCase: "Correction", material: "Aglime", institution: "ISU", target_pH: 6, tillage: "No-Till", equation: `((38619 - (5915 * BpH)) * (3 * 0.167)) / 2000` },
  { useCase: "Correction", material: "Aglime", institution: "ISU", target_pH: 6.5, tillage: "No-Till", equation: `((49886 - (7245 * BpH)) * (3 * 0.167)) / 2000` },
  { useCase: "Correction", material: "Aglime", institution: "ISU", target_pH: 6.8, tillage: "No-Till", equation: `((58776 - (8244 * BpH)) * (3 * 0.167)) / 2000` },
  { useCase: "Correction", material: "Aglime", institution: "UW", target_pH: 5.2, tillage: "Conventional", equation: `(36.1 - (3.29 * BpH) - (2.67 * WpH))` },
  { useCase: "Correction", material: "Aglime", institution: "UW", target_pH: 5.4, tillage: "Conventional", equation: `(48.2 - (4.84 * BpH) - (3.03 * WpH))` },
  { useCase: "Correction", material: "Aglime", institution: "UW", target_pH: 5.6, tillage: "Conventional", equation: `(51 - (5.4 * BpH) - (2.67 * WpH))` },
  { useCase: "Correction", material: "Aglime", institution: "UW", target_pH: 5.8, tillage: "Conventional", equation: `(57.2 - (5.55 * BpH) - (3.5 * WpH))` },
  { useCase: "Correction", material: "Aglime", institution: "UW", target_pH: 6, tillage: "Conventional", equation: `(72.7 - (7.59 * BpH) - (3.78 * WpH))` },
  { useCase: "Correction", material: "Aglime", institution: "UW", target_pH: 6.3, tillage: "Conventional", equation: `(103 - (12.6 * BpH) - (3.18 * WpH))` },
  { useCase: "Correction", material: "Aglime", institution: "UW", target_pH: 6.5, tillage: "Conventional", equation: `(134 - (17.2 * BpH) - (2.73 * WpH))` },
  { useCase: "Correction", material: "Aglime", institution: "UW", target_pH: 6.6, tillage: "Conventional", equation: `(152 - (20.3 * BpH) - (2.17 * WpH))` },
  { useCase: "Correction", material: "Aglime", institution: "UW", target_pH: 6.8, tillage: "Conventional", equation: `(195 - (28.4 * BpH) + (0.144 * WpH))` },
  { useCase: "Correction", material: "Aglime", institution: "UW", target_pH: 5.2, tillage: "No-Till", equation: `(36.1 - (3.29 * BpH) - (2.67 * WpH)) * 0.5` },
  { useCase: "Correction", material: "Aglime", institution: "UW", target_pH: 5.4, tillage: "No-Till", equation: `(48.2 - (4.84 * BpH) - (3.03 * WpH)) * 0.5` },
  { useCase: "Correction", material: "Aglime", institution: "UW", target_pH: 5.6, tillage: "No-Till", equation: `(51 - (5.4 * BpH) - (2.67 * WpH)) * 0.5` },
  { useCase: "Correction", material: "Aglime", institution: "UW", target_pH: 5.8, tillage: "No-Till", equation: `(57.2 - (5.55 * BpH) - (3.5 * WpH)) * 0.5` },
  { useCase: "Correction", material: "Aglime", institution: "UW", target_pH: 6, tillage: "No-Till", equation: `(72.7 - (7.59 * BpH) - (3.78 * WpH)) * 0.5` },
  { useCase: "Correction", material: "Aglime", institution: "UW", target_pH: 6.3, tillage: "No-Till", equation: `(103 - (12.6 * BpH) - (3.18 * WpH)) * 0.5` },
  { useCase: "Correction", material: "Aglime", institution: "UW", target_pH: 6.5, tillage: "No-Till", equation: `(134 - (17.2 * BpH) - (2.73 * WpH)) * 0.5` },
  { useCase: "Correction", material: "Aglime", institution: "UW", target_pH: 6.6, tillage: "No-Till", equation: `(152 - (20.3 * BpH) - (2.17 * WpH)) * 0.5` },
  { useCase: "Correction", material: "Aglime", institution: "UW", target_pH: 6.8, tillage: "No-Till", equation: `(195 - (28.4 * BpH) + (0.144 * WpH)) * 0.5` },
  { useCase: "Correction", material: "98G", institution: "UW", target_pH: 5.2, tillage: "Conventional", equation: `(36.1 - (3.29 * BpH) - (2.67 * WpH)) * 2000 * 0.18` },
  { useCase: "Correction", material: "98G", institution: "UW", target_pH: 5.4, tillage: "Conventional", equation: `(48.2 - (4.84 * BpH) - (3.03 * WpH)) * 2000 * 0.18` },
  { useCase: "Correction", material: "98G", institution: "UW", target_pH: 5.6, tillage: "Conventional", equation: `(51 - (5.4 * BpH) - (2.67 * WpH)) * 2000 * 0.18` },
  { useCase: "Correction", material: "98G", institution: "UW", target_pH: 5.8, tillage: "Conventional", equation: `(57.2 - (5.55 * BpH) - (3.5 * WpH)) * 2000 * 0.18` },
  { useCase: "Correction", material: "98G", institution: "UW", target_pH: 6, tillage: "Conventional", equation: `(72.7 - (7.59 * BpH) - (3.78 * WpH)) * 2000 * 0.18` },
  { useCase: "Correction", material: "98G", institution: "UW", target_pH: 6.3, tillage: "Conventional", equation: `(103 - (12.6 * BpH) - (3.18 * WpH)) * 2000 * 0.18` },
  { useCase: "Correction", material: "98G", institution: "UW", target_pH: 6.5, tillage: "Conventional", equation: `(134 - (17.2 * BpH) - (2.73 * WpH)) * 2000 * 0.18` },
  { useCase: "Correction", material: "98G", institution: "UW", target_pH: 6.6, tillage: "Conventional", equation: `(152 - (20.3 * BpH) - (2.17 * WpH)) * 2000 * 0.18` },
  { useCase: "Correction", material: "98G", institution: "UW", target_pH: 6.8, tillage: "Conventional", equation: `(195 - (28.4 * BpH) + (0.144 * WpH)) * 2000 * 0.18` },
  { useCase: "Correction", material: "98G", institution: "UW", target_pH: 5.2, tillage: "No-Till", equation: `(36.1 - (3.29 * BpH) - (2.67 * WpH)) * 2000 * 0.1` },
  { useCase: "Correction", material: "98G", institution: "UW", target_pH: 5.4, tillage: "No-Till", equation: `(48.2 - (4.84 * BpH) - (3.03 * WpH)) * 2000 * 0.1` },
  { useCase: "Correction", material: "98G", institution: "UW", target_pH: 5.6, tillage: "No-Till", equation: `(51 - (5.4 * BpH) - (2.67 * WpH)) * 2000 * 0.1` },
  { useCase: "Correction", material: "98G", institution: "UW", target_pH: 5.8, tillage: "No-Till", equation: `(57.2 - (5.55 * BpH) - (3.5 * WpH)) * 2000 * 0.1` },
  { useCase: "Correction", material: "98G", institution: "UW", target_pH: 6, tillage: "No-Till", equation: `(72.7 - (7.59 * BpH) - (3.78 * WpH)) * 2000 * 0.1` },
  { useCase: "Correction", material: "98G", institution: "UW", target_pH: 6.3, tillage: "No-Till", equation: `(103 - (12.6 * BpH) - (3.18 * WpH)) * 2000 * 0.1` },
  { useCase: "Correction", material: "98G", institution: "UW", target_pH: 6.5, tillage: "No-Till", equation: `(134 - (17.2 * BpH) - (2.73 * WpH)) * 2000 * 0.1` },
  { useCase: "Correction", material: "98G", institution: "UW", target_pH: 6.6, tillage: "No-Till", equation: `(152 - (20.3 * BpH) - (2.17 * WpH)) * 2000 * 0.1` },
  { useCase: "Correction", material: "98G", institution: "UW", target_pH: 6.8, tillage: "No-Till", equation: `(195 - (28.4 * BpH) + (0.144 * WpH)) * 2000 * 0.1` },
];
