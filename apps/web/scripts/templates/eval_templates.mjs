// Эталоны таних чанарыг leave-one-out-аар хэмжих (browser-гүй, детерминист).
// Дээж бүрийг эх багцаасаа хасаад үлдсэн эталонтой DTW-ээр ангилж:
//   - top-1: хамгийн ойр үсэг нь жинхэнэ үсэгтэй таарч байна уу
//   - босго: жинхэнэ үсэг хүртэлх зай suggestedThreshold-д багтаж байна уу
//
// Ажиллуулах:  node apps/web/scripts/templates/eval_templates.mjs

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const WEB_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const FULL = resolve(WEB_DIR, 'src/lib/games/alphabet-templates.json');

const b = JSON.parse(readFileSync(FULL, 'utf8'));

function frameDist(p, q) {
  let s = 0;
  for (let k = 0; k < p.length; k++) {
    const d = p[k] - q[k];
    s += d * d;
  }
  return Math.sqrt(s);
}
function dtw(a, c) {
  const n = a.length, m = c.length;
  if (!n || !m) return Infinity;
  let pC = new Array(m + 1).fill(Infinity), pL = new Array(m + 1).fill(0);
  let cC = new Array(m + 1).fill(Infinity), cL = new Array(m + 1).fill(0);
  pC[0] = 0;
  for (let i = 1; i <= n; i++) {
    cC[0] = Infinity; cL[0] = 0;
    for (let j = 1; j <= m; j++) {
      const cost = frameDist(a[i - 1], c[j - 1]);
      let bc = pC[j], bl = pL[j];
      if (cC[j - 1] < bc) { bc = cC[j - 1]; bl = cL[j - 1]; }
      if (pC[j - 1] < bc) { bc = pC[j - 1]; bl = pL[j - 1]; }
      cC[j] = cost + bc; cL[j] = bl + 1;
    }
    [pC, cC] = [cC, pC]; [pL, cL] = [cL, pL];
  }
  return pC[m] / (pL[m] || 1);
}

const thr = b.suggestedThreshold;
let total = 0, top1 = 0, withinTrue = 0;
const wrong = [];
const trueDists = [];

for (let li = 0; li < b.letters.length; li++) {
  const L = b.letters[li];
  for (let si = 0; si < L.samples.length; si++) {
    const query = L.samples[si];
    if (!query || !query.length) continue;
    total++;

    // бүх үсэг хүртэлх хамгийн ойр зай (тухайн дээжийг өөрийнх нь үсгээс хасна)
    let bestLetter = null, bestDist = Infinity, trueDist = Infinity;
    for (const C of b.letters) {
      let d = Infinity;
      for (let k = 0; k < C.samples.length; k++) {
        if (C.letter === L.letter && k === si) continue; // leave-one-out
        const dd = dtw(query, C.samples[k]);
        if (dd < d) d = dd;
      }
      if (C.letter === L.letter) trueDist = d;
      if (d < bestDist) { bestDist = d; bestLetter = C.letter; }
    }

    trueDists.push(trueDist);
    if (bestLetter === L.letter) top1++;
    else wrong.push(`${L.letter}→${bestLetter}`);
    if (trueDist <= thr) withinTrue++;
  }
}

trueDists.sort((x, y) => x - y);
const pct = (n) => ((100 * n) / total).toFixed(1) + '%';
const q = (p) => trueDists[Math.min(trueDists.length - 1, Math.floor(p * trueDists.length))].toFixed(2);

console.log(`нийт дээж: ${total}`);
console.log(`top-1 (хамгийн ойр = жинхэнэ үсэг): ${top1}/${total}  ${pct(top1)}`);
console.log(`жинхэнэ үсэг босго(${thr})-д багтсан: ${withinTrue}/${total}  ${pct(withinTrue)}`);
console.log(`жинхэнэ-үсэг зайн тархалт: p50=${q(0.5)} p90=${q(0.9)} p95=${q(0.95)} max=${trueDists[trueDists.length - 1].toFixed(2)}`);
const wc = {};
wrong.forEach((w) => (wc[w] = (wc[w] || 0) + 1));
const topConf = Object.entries(wc).sort((a, c) => c[1] - a[1]).slice(0, 12);
if (topConf.length) console.log('хамгийн их андуурал:', topConf.map(([k, v]) => `${k}×${v}`).join('  '));
