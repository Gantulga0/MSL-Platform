// Хэд хэдэн дүрслэлийн хувилбарыг (одоо байгаа дата дээр) харьцуулна.
// Зорилго: дахин extract хийхгүйгээр хамгийн сайн таних дүрслэлийг сонгох.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const WEB_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const b = JSON.parse(readFileSync(resolve(WEB_DIR, 'src/lib/games/alphabet-templates.json'), 'utf8'));

const LH = 10, RH = 52;

function handLocal(frame, off) {
  const out = new Array(42).fill(0);
  let nz = false;
  for (let i = 0; i < 42; i++) if (frame[off + i] !== 0) { nz = true; break; }
  if (!nz) return out;
  const wx = frame[off], wy = frame[off + 1];
  const mx = frame[off + 18], my = frame[off + 19];
  const scale = Math.hypot(mx - wx, my - wy) || 1e-6;
  for (let i = 0; i < 21; i++) {
    out[i * 2] = (frame[off + i * 2] - wx) / scale;
    out[i * 2 + 1] = (frame[off + i * 2 + 1] - wy) / scale;
  }
  return out;
}
// бугуйн байрлал (мөр-нормчилсон) — хөдөлгөөн/байрлалыг хадгална
function wrist(frame, off, w) {
  let nz = false;
  for (let i = 0; i < 42; i++) if (frame[off + i] !== 0) { nz = true; break; }
  return nz ? [frame[off] * w, frame[off + 1] * w] : [0, 0];
}

// frame builder: posW = бугуйн байрлалын жин (0 бол хасна)
function makeFrames(seq, posW) {
  return seq.map((f) => {
    const base = [...handLocal(f, LH), ...handLocal(f, RH)];
    if (posW > 0) base.push(...wrist(f, LH, posW), ...wrist(f, RH, posW));
    return base;
  });
}
// velocity нэмэх (resample хийсэн дарааллын фрейм-зөрүү), жин velW
function addVelocity(frames, velW) {
  if (!velW) return frames;
  const dim = frames[0].length;
  return frames.map((cur, i) => {
    const prev = i > 0 ? frames[i - 1] : cur;
    const aug = cur.slice();
    for (let k = 0; k < dim; k++) aug.push((cur[k] - prev[k]) * velW);
    return aug;
  });
}

function frameDist(p, q) { let s = 0; for (let k = 0; k < p.length; k++) { const d = p[k] - q[k]; s += d * d; } return Math.sqrt(s); }
function dtw(a, c) {
  const n = a.length, m = c.length; if (!n || !m) return Infinity;
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

const variants = [
  { name: 'хэлбэр',                 posW: 0,   velW: 0 },
  { name: 'хэлбэр+байрлал(.5)',     posW: 0.5, velW: 0 },
  { name: 'хэлбэр+байрлал(1)',      posW: 1,   velW: 0 },
  { name: 'хэлбэр+velocity(2)',     posW: 0,   velW: 2 },
  { name: 'хэлбэр+байр(.5)+vel(2)', posW: 0.5, velW: 2 },
  { name: 'хэлбэр+байр(1)+vel(3)',  posW: 1,   velW: 3 },
];

const Kq = 8; // үсэг тус бүрээс query тоо (хурдны үүднээс)
for (const v of variants) {
  const letters = b.letters.map((L) => ({
    letter: L.letter,
    samples: L.samples.map((s) => addVelocity(makeFrames(s, v.posW), v.velW)),
  }));
  let total = 0, top1 = 0, top3 = 0, top5 = 0;
  for (const L of letters) {
    for (let si = 0; si < Math.min(Kq, L.samples.length); si++) {
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
    }
  }
  const pct = (n) => ((100 * n) / total).toFixed(1) + '%';
  console.log(`${v.name.padEnd(26)} top1=${pct(top1)}  top3=${pct(top3)}  top5=${pct(top5)}`);
}
