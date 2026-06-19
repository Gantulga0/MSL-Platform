// Бүтэн эталон JSON-г (src/lib/games/alphabet-templates.json — ~17MB бүрэн нарийвчлал)
// клиентэд тохиромжтой болгож багасгана:
//   - landmark координатуудыг 3 оронтой бутархайд бөөрөнхийлнө (DTW-д нөлөөгүй)
//   - дибаг талбаруудыг (frames) хасна
//   - /public/games/alphabet-templates.json-д бичнэ (runtime-д fetch хийнэ)
//
// Ажиллуулах:  node apps/web/scripts/templates/optimize_templates.mjs

import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_DIR = resolve(__dirname, '..', '..');
const IN = resolve(WEB_DIR, 'src/lib/games/alphabet-templates.json');
const OUT = resolve(WEB_DIR, 'public/games/alphabet-templates.json');

const Q = 1000; // 3 орон

const round = (x) => Math.round(x * Q) / Q;

const full = JSON.parse(readFileSync(IN, 'utf8'));

const letters = full.letters.map((l) => ({
  letter: l.letter,
  samples: l.samples
    .filter((s) => s && s.length)
    .map((seq) => seq.map((frame) => frame.map(round))),
}));

const out = {
  version: full.version,
  seqLen: full.seqLen,
  dim: full.dim,
  suggestedThreshold: full.suggestedThreshold,
  letters,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(out));

const inKb = statSync(IN).size / 1024;
const outKb = statSync(OUT).size / 1024;
const totalSamples = letters.reduce((n, l) => n + l.samples.length, 0);
console.log(
  `✓ ${letters.length} үсэг, ${totalSamples} эталон | ` +
    `${inKb.toFixed(0)}KB → ${outKb.toFixed(0)}KB → ${OUT}`,
);
