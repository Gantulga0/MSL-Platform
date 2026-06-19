// HolisticLandmarker-ийн ганц (singleton) инстанс. (sign-test/lib/holistic.js
// порт.) detectForVideo-гийн timestamp монотон өсөж байх ёстой тул нэг инстансыг
// дахин ашиглана. WASM ба моделийг CDN-ээс ачаална (NFR — гадаад сүлжээ шаардна).

import type { HolisticLandmarker } from '@mediapipe/tasks-vision';

const VERSION = '0.10.35';
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}/wasm`;
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/latest/holistic_landmarker.task';

let instance: HolisticLandmarker | null = null;
let loading: Promise<HolisticLandmarker> | null = null;

export async function getHolistic(): Promise<HolisticLandmarker> {
  if (instance) return instance;
  if (loading) return loading;

  loading = (async () => {
    const { FilesetResolver, HolisticLandmarker: HL } = await import(
      '@mediapipe/tasks-vision'
    );
    const vision = await FilesetResolver.forVisionTasks(WASM_URL);

    const makeOptions = (delegate: 'GPU' | 'CPU') => ({
      baseOptions: { modelAssetPath: MODEL_URL, delegate },
      runningMode: 'VIDEO' as const,
      minHandLandmarksConfidence: 0.3,
      minPoseDetectionConfidence: 0.4,
      minPosePresenceConfidence: 0.4,
      minFaceDetectionConfidence: 0.4,
    });

    try {
      instance = await HL.createFromOptions(vision, makeOptions('GPU'));
    } catch (e) {
      console.warn('GPU delegate бүтэлгүйтэв, CPU ашиглана:', e);
      instance = await HL.createFromOptions(vision, makeOptions('CPU'));
    }
    return instance;
  })();

  return loading;
}
