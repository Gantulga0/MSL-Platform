// Туршилт: одоо байгаа 94-хэмжээст (мөр-нормчилсон) векторуудыг ГАРЫН ХЭЛБЭРТ
// төвлөрсөн дүрслэл болгон хувиргаад top-1/top-3/top-5-ийг дахин хэмжинэ.
// Зорилго: дахин extract хийхээс өмнө сайжруулалтын боломжийг тогтоох.
//
// 94-хэмжээст бүтэц: поз 0..9 (5×2), зүүн гар 10..51 (21×2), баруун гар 52..93.
// Хувиргалт: гар бүрийг ӨӨРИЙНХ нь бугуй (цэг 0) дээр төвлөрүүлж, гарын
// хэмжээгээр (бугуй→дунд хурууны MCP=цэг 9) масштаблана. Поз-г хаяна.
// Идэвхгүй (бүхэлдээ 0) гарыг 0-оор үлдээнэ.

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const WEB_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const b = JSON.parse(readFileSync(resolve(WEB_DIR, 'src/lib/games/alphabet-templates.json'), 'utf8'));

const POSE = 10; // эхний 10 утга поз
const LH = 10;   // зүүн гар эхлэх индекс
const RH = 52;   // баруун гар эхлэх индекс

function handLocal(frame, off) {
  // 21 цэг × (x,y) → бугуйд төвлөрүүлж, хэмжээгээр нормчлох
  const out = new Array(42).fill(0);
  const wx = frame[off], wy = frame[off + 1];
  // бүхэлдээ 0 бол идэвхгүй гар
  let nz = false;
  for (let i = 0; i < 42; i++) if (frame[off + i] !== 0) { nz = true; break; }
  if (!nz) return out;
  const mx = frame[off + 9 * 2], my = frame[off + 9 * 2 + 1]; // цэг 9 (дунд MCP)
  let scale = Math.hypot(mx - wx, my - wy) || 1e-6;
  for (let i = 0; i < 21; i++) {
    out[i * 2] = (frame[off + i * 2] - wx) / scale;
    out[i * 2 + 1] = (frame[off + i * 2 + 1] - wy) / scale;
  }
  return out;
}

function transform(seq) {
  return seq.map((f) => [...handLocal(f, LH), ...handLocal(f, RH)]); // 84-хэмжээст
}

function frameDist(p, q) {
  let s = 0;
  for (let k = 0; k < p.length; k++) { const d = p[k] - q[k]; s += d * d; }
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

// эталонуудыг хувиргаж урьдчилан бэлдэх
const letters = b.letters.map((L) => ({
  letter: L.letter,
  samples: L.samples.map(transform),
}));

let total = 0, top1 = 0, top3 = 0, top5 = 0;
const trueDists = [];
for (let li = 0; li < letters.length; li++) {
  const L = letters[li];
  for (let si = 0; si < L.samples.length; si++) {
    const query = L.samples[si];
    total++;
    const scores = [];
    for (const C of letters) {
      let d = Infinity;
      for (let k = 0; k < C.samples.length; k++) {
        if (C.letter === L.letter && k === si) continue;
        const dd = dtw(query, C.samples[k]);
        if (dd < d) d = dd;
      }
      scores.push({ letter: C.letter, d });
    }
    scores.sort((a, c) => a.d - c.d);
    const rank = scores.findIndex((s) => s.letter === L.letter);
    if (rank === 0) top1++;
    if (rank < 3) top3++;
    if (rank < 5) top5++;
    trueDists.push(scores[rank].d);
  }
}
trueDists.sort((x, y) => x - y);
const pct = (n) => ((100 * n) / total).toFixed(1) + '%';
const q = (p) => trueDists[Math.min(trueDists.length - 1, Math.floor(p * trueDists.length))].toFixed(2);
console.log('ГАРЫН-ХЭЛБЭР дүрслэл (84-хэмжээст):');
console.log(`  нийт=${total}  top1=${pct(top1)}  top3=${pct(top3)}  top5=${pct(top5)}`);
console.log(`  жинхэнэ-үсэг зай: p50=${q(0.5)} p90=${q(0.9)} p95=${q(0.95)}`);
