// HolisticLandmarker-ийн үр дүнг DTW-д тохиромжтой тогтмол хэмжээтэй вектор
// болгон хувиргана. (sign-test/lib/features.js-ийн TypeScript порт.)
//
// НОРМЧЛОЛ (камерын зайнаас үл хамаарах, гэхдээ дохио бие дээр ХААНА хийгдэж
// байгааг хадгалах):
//   - эх цэг = мөрний төв (зүүн мөр 11 ба баруун мөр 12-ийн дунд)
//   - масштаб = мөрний өргөн (цэг 11 → цэг 12 хоорондын зай)
//
// Бүтэц (нэг фрейм): поз дэд олонлог (5×2=10) + зүүн гар (21×2=42) +
//   баруун гар (21×2=42) = 94. Илрээгүй гар/цэгийг тэгээр дүүргэнэ.

export interface Landmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

/** detectForVideo-гийн буцаах хэлбэрийн бидэнд хэрэгтэй хэсэг. */
export interface HolisticResult {
  poseLandmarks?: Landmark[][];
  leftHandLandmarks?: Landmark[][];
  rightHandLandmarks?: Landmark[][];
}

export type FeatureVector = number[];

// Pose (BlazePose 33) индексүүд
const L_SHOULDER = 11;
const R_SHOULDER = 12;
// features-д оруулах поз цэгүүд: хамар, тохой ×2, бугуй ×2.
const POSE_KEYS = [0, 13, 14, 15, 16];

export const POSE_DIM = POSE_KEYS.length * 2; // 10
export const HAND_DIM = 21 * 2; // 42
export const VEC_DIM = POSE_DIM + HAND_DIM * 2; // 94

function first<T>(arr: T[][] | undefined): T[] | null {
  return arr && arr.length ? arr[0] : null;
}

// ---------------------------------------------------------------------------
// Таних дүрслэл (handshape-focused).
//
// 94-хэмжээст түүхий вектор нь мөр-нормчилсон тул ГАРЫН БАЙРЛАЛ давамгайлж,
// статик хуруу-хэлбэрийн нарийн ялгаа бүдгэрдэг (цагаан толгойн дохио ихэвчлэн
// нэг гарын ХЭЛБЭР). Тиймээс DTW-д орохын өмнө фрейм бүрийг гарын хэлбэрт
// төвлөрүүлж хувиргана: гар бүрийг ӨӨРИЙНХ нь бугуй дээр төвлөрүүлж, гарын
// хэмжээгээр (бугуй→дунд хурууны MCP) нормчилно. Хөдөлгөөн/байрлалыг бүрэн
// алдахгүйн тулд бугуйн мөр-нормчилсон байрлалыг бага жинтэйгээр нэмнэ.
//
// Эталон ба амьд дараалал ХОЁУЛАНД ижил хэрэглэнэ (offline сонголтоор баталгаажсан:
// гарын хэлбэр + бугуйн байрлал ≈ хамгийн сайн ялгана; velocity муутгасан).

const LH_OFF = POSE_DIM; // 10 — зүүн гарын блок эхлэх индекс
const RH_OFF = POSE_DIM + HAND_DIM; // 52 — баруун гар
const WRIST_POS_WEIGHT = 1.0;

export const FEATURE_DIM = HAND_DIM * 2 + 4; // 42+42+2+2 = 88

function handLocal(frame: number[], off: number, out: number[], at: number): void {
  // идэвхгүй (бүхэлдээ 0) гар уу?
  let nz = false;
  for (let i = 0; i < HAND_DIM; i++) {
    if (frame[off + i] !== 0) {
      nz = true;
      break;
    }
  }
  if (!nz) return; // тэгээр үлдээнэ
  const wx = frame[off];
  const wy = frame[off + 1];
  const mx = frame[off + 18]; // цэг 9 (дунд хурууны MCP)
  const my = frame[off + 19];
  const scale = Math.hypot(mx - wx, my - wy) || 1e-6;
  for (let i = 0; i < 21; i++) {
    out[at + i * 2] = (frame[off + i * 2] - wx) / scale;
    out[at + i * 2 + 1] = (frame[off + i * 2 + 1] - wy) / scale;
  }
}

function wristPos(frame: number[], off: number): [number, number] {
  for (let i = 0; i < HAND_DIM; i++) {
    if (frame[off + i] !== 0) return [frame[off] * WRIST_POS_WEIGHT, frame[off + 1] * WRIST_POS_WEIGHT];
  }
  return [0, 0];
}

/** Нэг 94-хэмжээст түүхий фреймийг 88-хэмжээст таних фрейм болгоно. */
export function toFeatureFrame(frame: FeatureVector): FeatureVector {
  const out = new Array<number>(FEATURE_DIM).fill(0);
  handLocal(frame, LH_OFF, out, 0);
  handLocal(frame, RH_OFF, out, HAND_DIM);
  const [lwx, lwy] = wristPos(frame, LH_OFF);
  const [rwx, rwy] = wristPos(frame, RH_OFF);
  out[HAND_DIM * 2] = lwx;
  out[HAND_DIM * 2 + 1] = lwy;
  out[HAND_DIM * 2 + 2] = rwx;
  out[HAND_DIM * 2 + 3] = rwy;
  return out;
}

/** Дарааллыг таних дүрслэлд хувиргана. */
export function toFeatureSequence(seq: FeatureVector[]): FeatureVector[] {
  return seq.map(toFeatureFrame);
}

/** Дор хаяж нэг гар илэрсэн эсэх (сегментчлэлд ашиглана). */
export function hasHands(result: HolisticResult | null | undefined): boolean {
  if (!result) return false;
  const l = first(result.leftHandLandmarks);
  const r = first(result.rightHandLandmarks);
  return !!(l && l.length) || !!(r && r.length);
}

/**
 * detectForVideo-гийн үр дүнгээс 94 хэмжээст вектор гаргана.
 * Поз (мөр) илрээгүй бол null буцаана — нормчлох эх цэг алга гэсэн үг.
 */
export function resultToVector(
  result: HolisticResult | null | undefined,
): FeatureVector | null {
  if (!result) return null;
  const pose = first(result.poseLandmarks);
  if (!pose || pose.length <= R_SHOULDER) return null;

  const ls = pose[L_SHOULDER];
  const rs = pose[R_SHOULDER];
  if (!ls || !rs) return null;

  const cx = (ls.x + rs.x) / 2;
  const cy = (ls.y + rs.y) / 2;
  const scale = Math.hypot(ls.x - rs.x, ls.y - rs.y) || 1e-6;

  const vec = new Array<number>(VEC_DIM).fill(0);
  let o = 0;

  // --- поз дэд олонлог ---
  for (const k of POSE_KEYS) {
    const p = pose[k];
    if (p) {
      vec[o] = (p.x - cx) / scale;
      vec[o + 1] = (p.y - cy) / scale;
    }
    o += 2;
  }

  // --- зүүн гар ---
  const lh = first(result.leftHandLandmarks);
  if (lh && lh.length === 21) {
    for (let i = 0; i < 21; i++) {
      vec[o + i * 2] = (lh[i].x - cx) / scale;
      vec[o + i * 2 + 1] = (lh[i].y - cy) / scale;
    }
  }
  o += HAND_DIM;

  // --- баруун гар ---
  const rh = first(result.rightHandLandmarks);
  if (rh && rh.length === 21) {
    for (let i = 0; i < 21; i++) {
      vec[o + i * 2] = (rh[i].x - cx) / scale;
      vec[o + i * 2 + 1] = (rh[i].y - cy) / scale;
    }
  }

  return vec;
}
