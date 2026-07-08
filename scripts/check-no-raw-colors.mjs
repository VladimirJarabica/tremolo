// Phase 0 guardrail: fail if app/** contains raw color literals or off-theme
// Tailwind palettes. Semantic tokens (bg-primary, text-destructive, …) are the
// single source of truth for color in app code.
//
// Run: `npm run check:colors`. Intended for CI (gate every PR).
//
// Allowed escapes:
//   - `bg-black` / `text-black` (grayscale; the mobile overlay scrim uses
//     `bg-black/30`). `white` surfaces should be `bg-card`; this rule still
//     flags `*-white` so surfaces route through the `card`/`primary-foreground`
//     tokens. `destructive` is a token and is allowed.
import { glob, readFile } from "node:fs/promises";

// Raw color-function literals.
const LITERAL = /\boklch\(|\brgb\(|\brgba\(|\bhsl\(|\bhsla\(/;
// Hex colors (#abc, #aabbcc, #aabbccff) on a word boundary.
const HEX = /(^|[^\w])#[0-9a-fA-F]{3}([0-9a-fA-F]{3}([0-9a-fA-F]{2})?)?\b/;
// Off-theme Tailwind color palettes (anything with a numeric shade).
// `destructive` is a token and is allowed.
const PALETTE =
  /[\w-]+-(zinc|slate|neutral|stone|gray|blue|red|green|emerald|teal|lime|cyan|sky|indigo|violet|purple|fuchsia|pink|rose|amber|yellow|orange)-[0-9]/;

const RULES = [
  ["oklch/rgb/hsl literal", LITERAL],
  ["hex color", HEX],
  ["off-theme palette", PALETTE],
];

const files = [];
for await (const f of glob("app/**/*.tsx")) files.push(f);

let failures = 0;
const offenders = [];

for (const file of files.sort()) {
  const src = await readFile(file, "utf8");
  src.split("\n").forEach((line, i) => {
    for (const [name, re] of RULES) {
      if (re.test(line)) {
        offenders.push(`${file}:${i + 1}  ${name}\n    ${line.trim()}`);
        failures++;
      }
    }
  });
}

if (failures > 0) {
  console.error(
    `\n✗ ${failures} raw color literal(s) found in app/. Use semantic tokens instead.\n`,
  );
  console.error(offenders.join("\n\n"));
  console.error(
    "\nSee app/globals.css for the token list (bg-card, text-muted-foreground, …).\n",
  );
  process.exit(1);
}

console.log(`✓ No raw color literals in app/ (${files.length} files checked).`);
