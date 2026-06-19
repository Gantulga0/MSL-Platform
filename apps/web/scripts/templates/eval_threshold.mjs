// Сонгосон дүрслэл (гарын хэлбэр + бугуйн байрлал, жин 1) дээр:
//   - жинхэнэ-үсэг LOO зайн тархалт → босго сонгох
//   - тоглоомын шалгуур (target нь top-K дотор БА зай ≤ босго) genuine recall
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const WEB_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const b = JSON.parse(readFileSync(resolve(WEB_DIR, 'src/lib/games/alphabet-templates.json'), 'utf8'));
const LH = 10, RH = 52, POSW = 1;

function handLocal(f, off) {
  const out = new Array(42).fill(0);
  let nz = false; for (let i = 0; i < 42; i++) if (f[off + i] !== 0) { nz = true; break; }
  if (!nz) return out;
  const wx = f[off], wy = f[off + 1], mx = f[off + 18], my = f[off + 19];
  const s = Math.hypot(mx - wx, my - wy) || 1e-6;
  for (let i = 0; i < 21; i++) { out[i * 2] = (f[off + i * 2] - wx) / s; out[i * 2 + 1] = (f[off + i * 2 + 1] - wy) / s; }
  return out;
}
function wrist(f, off) {
  let nz = false; for (let i = 0; i < 42; i++) if (f[off + i] !== 0) { nz = true; break; }
  return nz ? [f[off] * POSW, f[off + 1] * POSW] : [0, 0];
}
const tf = (seq) => seq.map((f) => [...handLocal(f, LH), ...handLocal(f, RH), ...wrist(f, LH), ...wrist(f, RH)]);
function fd(p, q) { let s = 0; for (let k = 0; k < p.length; k++) { const d = p[k] - q[k]; s += d * d; } return Math.sqrt(s); }
function dtw(a, c) {
  const n = a.length, m = c.length; if (!n || !m) return Infinity;
  let pC = new Array(m + 1).fill(Infinity), pL = new Array(m + 1).fill(0);
  let cC = new Array(m + 1).fill(Infinity), cL = new Array(m + 1).fill(0); pC[0] = 0;
  for (let i = 1; i <= n; i++) { cC[0] = Infinity; cL[0] = 0;
    for (let j = 1; j <= m; j++) { const cost = fd(a[i - 1], c[j - 1]);
      let bc = pC[j], bl = pL[j];
      if (cC[j - 1] < bc) { bc = cC[j - 1]; bl = cL[j - 1]; }
      if (pC[j - 1] < bc) { bc = pC[j - 1]; bl = pL[j - 1]; }
      cC[j] = cost + bc; cL[j] = bl + 1; }
    [pC, cC] = [cC, pC]; [pL, cL] = [cL, pL]; }
  return pC[m] / (pL[m] || 1);
}
const letters = b.letters.map((L) => ({ letter: L.letter, samples: L.samples.map(tf) }));

const trueDists = [];
const rows = []; // {trueDist, rank}
for (const L of letters) {
  for (let si = 0; si < L.samples.length; si++) {
    const q = L.samples[si];
    const scores = [];
    for (const C of letters) {
      let d = Infinity;
      for (let k = 0; k < C.samples.length; k++) {
        if (C.letter === L.letter && k === si) continue;
        const dd = dtw(q, C.samples[k]); if (dd < d) d = dd;
      }
      scores.push({ letter: C.letter, d });
    }
    scores.sort((a, c) => a.d - c.d);
    const rank = scores.findIndex((s) => s.letter === L.letter);
    rows.push({ trueDist: scores[rank].d, rank });
    trueDists.push(scores[rank].d);
  }
}
trueDists.sort((x, y) => x - y);
const q = (p) => trueDists[Math.min(trueDists.length - 1, Math.floor(p * trueDists.length))];
console.log(`жинхэнэ-үсэг зай: p50=${q(0.5).toFixed(2)} p80=${q(0.8).toFixed(2)} p90=${q(0.9).toFixed(2)} p95=${q(0.95).toFixed(2)}`);

for (const thr of [q(0.85), q(0.9), q(0.95)]) {
  for (const K of [1, 2, 3]) {
    const ok = rows.filter((r) => r.rank < K && r.trueDist <= thr).length;
    console.log(`  босго=${thr.toFixed(2)}  K=${K}  genuine recall=${((100 * ok) / rows.length).toFixed(1)}%`);
  }
}
console.log('САНАЛ: босго≈' + q(0.9).toFixed(2) + ', acceptRank=3');
