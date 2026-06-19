// Dynamic Time Warping ба дараалал жигдрүүлэлт. (sign-test/lib/dtw.js-ийн порт.)
// Дохио бол хугацааны дагуух хөдөлгөөн тул урт нь өөр өөр дарааллуудыг DTW-ээр
// уян хатан зэрэгцүүлж зай (ялгаа)-г хэмжинэ.

import type { FeatureVector } from './features';

export type Sequence = FeatureVector[];

export const SEQ_LEN = 32; // эталон ба амьд дарааллыг ийм уртад жигдрүүлнэ

/**
 * Дарааллыг тогтмол N фреймд дахин түүвэрлэнэ (хэт урт DTW-ээс сэргийлж, мөн
 * DTW-ийн зайг харьцуулахуйц болгоно).
 */
export function resample(seq: Sequence, N: number = SEQ_LEN): Sequence {
  if (seq.length === 0) return [];
  if (seq.length === N) return seq;
  if (seq.length === 1) return new Array<FeatureVector>(N).fill(seq[0]);

  const out = new Array<FeatureVector>(N);
  for (let i = 0; i < N; i++) {
    const idx = Math.round((i * (seq.length - 1)) / (N - 1));
    out[i] = seq[idx];
  }
  return out;
}

function frameDist(p: FeatureVector, q: FeatureVector): number {
  let s = 0;
  for (let k = 0; k < p.length; k++) {
    const d = p[k] - q[k];
    s += d * d;
  }
  return Math.sqrt(s);
}

/**
 * Хоёр дарааллын хоорондын DTW зай. Хуримтлагдсан зардлыг alignment замын
 * ЖИНХЭНЭ УРТААР хуваан нормчилно (нэг алхамд ногдох дундаж зай). Ингэснээр
 * богино/урт дараалал систематикаар давуу болохгүй, босготой харьцуулж болно.
 */
export function dtw(a: Sequence, b: Sequence): number {
  const n = a.length;
  const m = b.length;
  if (n === 0 || m === 0) return Infinity;

  const INF = Infinity;
  let prevCost = new Array<number>(m + 1).fill(INF);
  let prevLen = new Array<number>(m + 1).fill(0);
  let curCost = new Array<number>(m + 1).fill(INF);
  let curLen = new Array<number>(m + 1).fill(0);
  prevCost[0] = 0;

  for (let i = 1; i <= n; i++) {
    curCost[0] = INF;
    curLen[0] = 0;
    for (let j = 1; j <= m; j++) {
      const cost = frameDist(a[i - 1], b[j - 1]);

      let bC = prevCost[j]; // дээрээс (i-1, j)
      let bL = prevLen[j];
      if (curCost[j - 1] < bC) {
        // зүүнээс (i, j-1)
        bC = curCost[j - 1];
        bL = curLen[j - 1];
      }
      if (prevCost[j - 1] < bC) {
        // диагональ (i-1, j-1)
        bC = prevCost[j - 1];
        bL = prevLen[j - 1];
      }

      curCost[j] = cost + bC;
      curLen[j] = bL + 1;
    }
    const tc = prevCost;
    prevCost = curCost;
    curCost = tc;
    const tl = prevLen;
    prevLen = curLen;
    curLen = tl;
  }

  const pathLen = prevLen[m] || 1;
  return prevCost[m] / pathLen;
}
