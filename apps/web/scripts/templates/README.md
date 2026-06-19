# Цагаан толгойн дохио — эталон (template) бэлтгэх

Тоглоом (`/games`) нь камераас уншсан дохиог **урьдчилан тооцсон эталонтой** DTW-ээр
харьцуулж таних. Эталоныг **offline** нэг удаа гаргаж, жижиг JSON болгож хадгална —
түүхий бичлэгийг ажиллах үед шаардахгүй.

## Урсгал

```
public/signs/alphabet/<ҮСЭГ>-<N>.MOV   түүхий бичлэгүүд (git-д ОРОХГҮЙ)
        │  build_templates.py  (ffmpeg-static → H.264, Playwright + MediaPipe)
        ▼
src/lib/games/alphabet-templates.json  бүрэн нарийвчлал (~17MB, git-д ОРОХГҮЙ)
        │  optimize_templates.mjs  (3 орон болгож багасгана)
        ▼
public/games/alphabet-templates.json   runtime эталон (git-д ОРНО)
```

## Шаардлага

- `ffmpeg-static` (devDependency — суусан)
- Python + Playwright + Chromium (`pip install playwright && playwright install chromium`)
- Интернэт (MediaPipe WASM + модель CDN-ээс ачаална)

## Бичлэг нэмэх / шинэчлэх

1. Бичлэгээ `apps/web/public/signs/alphabet/` дотор `<ҮСЭГ>-<дугаар>.MOV`
   нэрээр хийнэ (ж: `Б-1.MOV … Б-13.MOV`). Файлын нэрний `-`-аас өмнөх хэсэг
   нь үсгийн шошго болно.
2. Эталоныг дахин гаргана:

   ```bash
   # 1) бичлэгүүдийг боловсруулж бүрэн JSON гаргах (GPU хурдан)
   USE_GPU=1 python apps/web/scripts/templates/build_templates.py

   # 2) клиентэд тохируулан багасгаж public-д бичих
   node apps/web/scripts/templates/optimize_templates.mjs
   ```

### Орчны хувьсагч (build_templates.py)

| Хувьсагч | Үүрэг | Анхдагч |
|---|---|---|
| `USE_GPU=1` | ANGLE/D3D11 GPU ашиглах (≈2× хурдан) | swiftshader |
| `SKIP_TRANSCODE=1` | `.work/` доторх бэлэн mp4-г дахин ашиглах | хөрвүүлнэ |
| `MAX_CLIPS=N` | эхний N клипийг л боловсруулах (тест) | бүгд |
| `EXTRACT_TIMEOUT_S` | extraction-ийн дээд хугацаа (сек) | 5400 |

> `.work/` (хөрвүүлсэн клип) ба бүрэн `src/lib/games/alphabet-templates.json`
> хоёр нь `.gitignore`-д орсон. Зөвхөн багасгасан
> `public/games/alphabet-templates.json` л git-д commit хийгдэнэ.

## Таних дүрслэл ба тааруулга

Эталон JSON нь түүхий **94-хэмжээст** (мөр-нормчилсон) векторуудыг агуулна.
Ачаалах үед runtime нь тэдгээрийг **гарын хэлбэрт төвлөрсөн** дүрслэлд хувиргадаг
(`src/lib/games/features.ts → toFeatureFrame`): гар бүрийг өөрийнх нь бугуй дээр
төвлөрүүлж, гарын хэмжээгээр нормчлоод бугуйн байрлалыг бага жинтэй нэмнэ. Энэ нь
статик хуруу-хэлбэрийг хамаагүй сайн ялгадаг (offline туршилтаар сонгосон).

Цагаан толгойн 35 дохио олонх нь маш төстэй (О/Ө, Е/Ё, Ш/Щ, И/Й …) тул таних нь
**яг нэг үсэг** биш, **зорилтот үсэгт тааруулсан** горимоор ажиллана. Тааруулах
тогтмолууд `src/lib/games/recognizer.ts`-д:

| Тогтмол | Утга | Үүрэг |
|---|---|---|
| `DEFAULT_THRESHOLD` | 4.6 | зорилтот үсэг хүртэлх дээд DTW зай |
| `ACCEPT_RANK` | 3 | зорилт хамгийн ойр хэдэн дотор багтвал зөв гэх |

Offline хэмжүүр (leave-one-out, нэг гарын дата):
top-1 ≈ 49%, top-5 ≈ 84%, тоглоомын genuine recall (босго 4.6, K=3) ≈ **72%**.

Дүрслэл/босгыг дахин үнэлэх скриптүүд (бүгд `src/lib/games/alphabet-templates.json`
дээр ажиллана, browser шаардахгүй):

```bash
node apps/web/scripts/templates/eval_templates.mjs    # түүхий 94-хэмжээст
node apps/web/scripts/templates/eval_handshape.mjs    # гарын хэлбэр
node apps/web/scripts/templates/eval_variants.mjs     # хувилбаруудыг харьцуулах
node apps/web/scripts/templates/eval_threshold.mjs    # босго + recall
```
