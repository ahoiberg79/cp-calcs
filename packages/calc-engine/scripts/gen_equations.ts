import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

type CsvRow = {
  "Use Case"?: string;
  Material?: string;
  Institution?: string;
  "Target pH"?: string;
  Till?: string;
  Equation?: string;
};

// Resolve paths relative to this script (works no matter your CWD)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkgRoot = dirname(__dirname); // -> packages/calc-engine

const inPath  = join(pkgRoot, "data", "equations.csv");
const outDir  = join(pkgRoot, "src", "data");
const outPath = join(outDir, "98g_aglime_equations.ts");

const csv = readFileSync(inPath, "utf8");
const parsed = parse(csv, { columns: true, skip_empty_lines: true }) as CsvRow[];

// Map + sanitize
const mapped = parsed.map((r) => {
  const useCase = (r["Use Case"] ?? "").trim();
  const material = (r.Material ?? "").trim();
  const institution = (r.Institution ?? "").trim();
  const tillage = (r.Till ?? "").trim();
  const target_pH = Number((r["Target pH"] ?? "").toString().trim());
  const equation = (r.Equation ?? "").trim();
  return { useCase, material, institution, tillage, target_pH, equation };
});

// Keep only complete CORRECTION rows (Maintenance handled in code = 250 lb/ac)
const filtered = mapped.filter((r) =>
  r.useCase === "Correction" &&
  (r.material === "98G" || r.material === "Aglime") &&
  (r.institution === "UW" || r.institution === "ISU") &&
  (r.tillage === "Conventional" || r.tillage === "No-Till") &&
  Number.isFinite(r.target_pH) &&
  r.equation.length > 0
);

// Optional: de-dupe just in case
const keyOf = (r: typeof filtered[number]) =>
  `${r.useCase}|${r.material}|${r.institution}|${r.tillage}|${r.target_pH}|${r.equation}`;
const unique = Array.from(new Map(filtered.map((r) => [keyOf(r), r])).values());

// Emit TS
mkdirSync(outDir, { recursive: true });

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/`/g, "\\`");

const outTs = `// GENERATED FILE. Do not edit by hand.
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
${unique
  .map(
    (r) =>
      `  { useCase: "Correction", material: "${r.material as "98G" | "Aglime"}", institution: "${
        r.institution as "UW" | "ISU"
      }", target_pH: ${r.target_pH}, tillage: "${r.tillage as "Conventional" | "No-Till"}", equation: \`${esc(
        r.equation
      )}\` },`
  )
  .join("\n")}
];
`;

writeFileSync(outPath, outTs, "utf8");
console.log(`Generated ${unique.length} rows -> ${outPath}`);
