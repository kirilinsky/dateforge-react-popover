import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const KiB = 1024;

const moduleFiles = (extension) =>
  readdirSync("dist/modules")
    .filter((file) => file.endsWith(extension))
    .map((file) => join("dist/modules", file))
    .sort();

const budgets = [
  {
    name: "root esm",
    files: ["dist/index.mjs"],
    maxGzip: 3 * KiB,
  },
  {
    name: "root cjs",
    files: ["dist/index.cjs"],
    maxGzip: 3 * KiB,
  },
  {
    name: "modules esm",
    files: moduleFiles(".mjs"),
    maxGzip: 5 * KiB,
  },
  {
    name: "modules cjs",
    files: moduleFiles(".cjs"),
    maxGzip: 5 * KiB,
  },
  {
    name: "css",
    files: ["dist/style.css", "dist/modules/style.css"],
    maxGzip: 1 * KiB,
  },
];

const formatKiB = (bytes) => `${(bytes / KiB).toFixed(2)} KiB`;

let failed = false;

for (const budget of budgets) {
  const raw = budget.files.reduce((total, file) => total + statSync(file).size, 0);
  const gzip = budget.files.reduce(
    (total, file) => total + gzipSync(readFileSync(file)).length,
    0,
  );
  const ok = gzip <= budget.maxGzip;

  console.log(
    `${ok ? "OK" : "FAIL"} ${budget.name}: ${formatKiB(gzip)} gzip / ${formatKiB(
      budget.maxGzip,
    )} budget (${formatKiB(raw)} raw)`,
  );

  if (!ok) failed = true;
}

if (failed) {
  process.exitCode = 1;
}
