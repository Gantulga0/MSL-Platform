// Амьд дохиог урьдчилан тооцсон эталонтой DTW-ээр харьцуулж үсэг таних.
//
// Эталон JSON (alphabet-templates.json) нь түүхий 94-хэмжээст векторуудыг
// агуулна. Ачаалах үед бүх эталоныг таних дүрслэлд (гарын хэлбэр + бугуйн
// байрлал, features.toFeatureSequence) хувиргаж кэшлэнэ; амьд дарааллыг ч мөн
// ижил хувиргаад DTW-ддэг. Үсэг бүр ОЛОН эталонтай тул тухайн үсэг хүртэлх зайг
// эталонуудынх нь ХАМГИЙН БАГА DTW-ээр авна.
//
// Таних шалгуур (offline LOO-оор тааруулсан): цагаан толгойн 35 дохио олонх нь
// маш төстэй тул нэг-алдартай top-1 ялгалт хязгаарлагдмал. Тоглоом нь ЗОРИЛТОТ
// үсгийг мэддэг тул "зорилт нь хамгийн ойр ACCEPT_RANK дотор БА зай ≤ босго"
// гэсэн зөөлөн шалгуур ашиглана (genuine recall ≈ 72%).

import { dtw, resample, SEQ_LEN, type Sequence } from './dtw';
import { toFeatureSequence } from './features';

// Offline тааруулсан анхдагчид (eval_threshold.mjs). Хоёулаа тааруулж болно.
export const DEFAULT_THRESHOLD = 4.6;
export const ACCEPT_RANK = 3;

export interface TemplateLetter {
  letter: string;
  samples: Sequence[]; // ачаалсны дараа таних дүрслэлд хувиргагдсан
}

export interface TemplateBundle {
  version: number;
  seqLen: number;
  dim: number;
  suggestedThreshold: number;
  threshold: number; // тоглоомын ашиглах бодит босго
  letters: TemplateLetter[];
}

export interface LetterScore {
  letter: string;
  dist: number;
}

export interface ClassifyResult {
  best: LetterScore | null;
  ranking: LetterScore[]; // зайгаар өсөхөөр эрэмбэлсэн
  threshold: number;
}

interface RawLetter {
  letter: string;
  samples: Sequence[];
}
interface RawBundle {
  version: number;
  seqLen: number;
  dim: number;
  suggestedThreshold: number;
  letters: RawLetter[];
}

/** Эталоны багцыг /public-аас ачаалж, таних дүрслэлд хувиргана (lazy). */
export async function loadTemplates(
  url = '/games/alphabet-templates.json',
): Promise<TemplateBundle> {
  const res = await fetch(url, { cache: 'force-cache' });
  if (!res.ok) throw new Error(`эталон ачаалж чадсангүй (${res.status})`);
  const raw = (await res.json()) as RawBundle;
  return {
    version: raw.version,
    seqLen: raw.seqLen,
    dim: raw.dim,
    suggestedThreshold: raw.suggestedThreshold,
    threshold: DEFAULT_THRESHOLD,
    letters: raw.letters.map((l) => ({
      letter: l.letter,
      samples: l.samples
        .filter((s) => s && s.length)
        .map((seq) => toFeatureSequence(resample(seq, SEQ_LEN))),
    })),
  };
}

/** Нэг үсэг хүртэлх зай = эталонуудынх нь хамгийн бага DTW. */
function letterDistance(live: Sequence, letter: TemplateLetter): number {
  let best = Infinity;
  for (const sample of letter.samples) {
    const d = dtw(live, sample);
    if (d < best) best = d;
  }
  return best;
}

/** Амьд дарааллыг хувиргаад бүх үсэгтэй харьцуулж зайгаар эрэмбэлнэ. */
export function classify(
  liveSeq: Sequence,
  bundle: TemplateBundle,
  threshold: number = bundle.threshold,
): ClassifyResult {
  const live = toFeatureSequence(resample(liveSeq, SEQ_LEN));

  const scored: LetterScore[] = bundle.letters
    .map((l) => ({ letter: l.letter, dist: letterDistance(live, l) }))
    .filter((s) => Number.isFinite(s.dist));

  scored.sort((a, b) => a.dist - b.dist);
  return { best: scored[0] ?? null, ranking: scored, threshold };
}

/**
 * Зорилтот үсэгт тааруулж шалгана: хүүхэд үзүүлсэн дохио зорилтот үсэгт
 * хангалттай ойр (зай ≤ босго) бөгөөд зорилт нь хамгийн ойр ACCEPT_RANK дотор
 * багтаж байвал зөв гэнэ.
 */
export interface TargetCheck {
  correct: boolean;
  targetDist: number;
  targetRank: number; // 0 = хамгийн ойр
  confidence: number;
  best: LetterScore | null;
}

export function checkTarget(
  liveSeq: Sequence,
  bundle: TemplateBundle,
  targetLetter: string,
  threshold: number = bundle.threshold,
  acceptRank: number = ACCEPT_RANK,
): TargetCheck {
  const res = classify(liveSeq, bundle, threshold);
  const rank = res.ranking.findIndex((r) => r.letter === targetLetter);
  const targetDist = rank >= 0 ? res.ranking[rank].dist : Infinity;
  const correct = rank >= 0 && rank < acceptRank && targetDist <= threshold;
  const confidence = Number.isFinite(targetDist)
    ? Math.max(0, Math.min(1, 1 - targetDist / threshold))
    : 0;
  return { correct, targetDist, targetRank: rank, confidence, best: res.best };
}
