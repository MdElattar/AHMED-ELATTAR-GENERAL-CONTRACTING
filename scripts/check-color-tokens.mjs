import { readdirSync, readFileSync } from "node:fs";
import { extname, join, relative, resolve, sep } from "node:path";

/**
 * Guardrail for the executive theme: no component may introduce a literal
 * color. Everything must resolve through src/app/globals.css semantic tokens.
 */
const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const GLOBALS_CSS = join(SRC, "app", "globals.css");
const DESIGN_TOKENS = join(SRC, "lib", "design", "tokens.ts");
const EXTENSIONS = new Set([".ts", ".tsx", ".css"]);

const RULES = [
  { name: "hex color", pattern: /#[0-9a-fA-F]{3,8}\b/g },
  { name: "numeric rgb/rgba color", pattern: /\b(?:rgba?|hsla?)\(\s*[0-9.]/g },
  { name: "text-white utility", pattern: /\btext-white\b/g },
  { name: "bg-black utility", pattern: /\bbg-black\b/g },
  { name: "raw linear-gradient color", pattern: /\blinear-gradient\([^)]*#[0-9a-fA-F]{3,8}\b/g },
];

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(path);
    } else if (entry.isFile() && EXTENSIONS.has(extname(entry.name))) {
      yield path;
    }
  }
}

/** Blank out comments while preserving line and column positions. */
function sanitize(source) {
  const state = { inBlock: false };
  return source
    .split("\n")
    .map((line) => {
      let out = "";
      let index = 0;
      while (index < line.length) {
        if (state.inBlock) {
          if (line.startsWith("*/", index)) {
            state.inBlock = false;
            out += "  ";
            index += 2;
          } else {
            out += " ";
            index += 1;
          }
          continue;
        }
        if (line.startsWith("/*", index)) {
          state.inBlock = true;
          out += "  ";
          index += 2;
          continue;
        }
        // Ignore line comments, but never mistake `https://` for one.
        if (
          line.startsWith("//", index) &&
          (index === 0 || /\s/.test(line[index - 1])) &&
          line[index - 2] !== ":"
        ) {
          out += " ".repeat(line.length - index);
          break;
        }
        out += line[index];
        index += 1;
      }
      return out;
    })
    .join("\n");
}

const files = [...walk(SRC)].filter(
  (file) => resolve(file) !== GLOBALS_CSS && resolve(file) !== DESIGN_TOKENS,
);
const failures = [];

for (const file of files) {
  const relativePath = relative(ROOT, file).split(sep).join("/");
  sanitize(readFileSync(file, "utf8"))
    .split("\n")
    .forEach((line, index) => {
      for (const rule of RULES) {
        rule.pattern.lastIndex = 0;
        const match = rule.pattern.exec(line);
        if (match) {
          failures.push(`${relativePath}:${index + 1}: ${rule.name} "${match[0]}"`);
        }
      }
    });
}

if (failures.length > 0) {
  console.error("Raw color literals found outside src/app/globals.css:");
  for (const failure of failures) console.error(` - ${failure}`);
  console.error("\nUse semantic tokens (for example text-fg or rgb(var(--accent-rgb) / 0.14)).");
  process.exit(1);
}

console.log(`Color tokens OK: ${files.length} source files scanned.`);
