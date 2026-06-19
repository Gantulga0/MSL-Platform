# -*- coding: utf-8 -*-
"""
Offline эталон (template) бэлтгэгч.

Урсгал:
  1. apps/web/public/signs/alphabet/ доторх түүхий бичлэгүүдийг (*.MOV / *.mp4)
     ffmpeg-static-аар браузерт тоглох H.264 mp4 болгон .work/ дотор хөрвүүлнэ
     (iPhone HEVC-г Chromium декодлож чаддаггүй).
  2. .work/ дотор manifest.json + extractor.html-ийг бэлдээд локал HTTP сервер
     дээр тавина.
  3. Playwright (headless Chromium, swiftshader) extractor.html-ийг ачаалж
     MediaPipe Holistic-оор фичер дараалал гаргана.
  4. Үсэг тус бүрээр бүлэглэж, дотоод DTW-ээс санал болгох босго тооцоод
     apps/web/src/lib/games/alphabet-templates.json-д бичнэ.

Файлын нэр: "<ҮСЭГ>-<дугаар>.<ext>"  ж: А-1.MOV → label "А".

Ажиллуулах:  python apps/web/scripts/templates/build_templates.py
"""
import json
import math
import os
import re
import socket
import subprocess
import sys
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

SCRIPT_DIR = Path(__file__).resolve().parent
WEB_DIR = SCRIPT_DIR.parents[1]          # apps/web
REPO_DIR = WEB_DIR.parents[1]            # msl-platform
SRC_VIDEOS = WEB_DIR / "public" / "signs" / "alphabet"
WORK_DIR = SCRIPT_DIR / ".work"
OUT_JSON = WEB_DIR / "src" / "lib" / "games" / "alphabet-templates.json"

VIDEO_EXTS = {".mov", ".mp4", ".webm", ".m4v"}


def find_ffmpeg() -> str:
    env = os.environ.get("FFMPEG")
    if env and Path(env).exists():
        return env
    for base in (WEB_DIR, REPO_DIR):
        cand = base / "node_modules" / "ffmpeg-static" / "ffmpeg.exe"
        if cand.exists():
            return str(cand)
        cand = base / "node_modules" / "ffmpeg-static" / "ffmpeg"
        if cand.exists():
            return str(cand)
    raise SystemExit("ffmpeg-static олдсонгүй. `npm i -D ffmpeg-static` ажиллуулна уу.")


def parse_letter(stem: str) -> str:
    m = re.match(r"^([^-_\d]+)", stem)
    return (m.group(1) if m else stem).strip()


def transcode(ffmpeg: str, src: Path, dst: Path) -> None:
    cmd = [
        ffmpeg, "-y", "-i", str(src),
        "-an",                                  # дуу хасна
        "-vf", "scale=640:-2",                  # 640px өргөн, тэгш өндөр
        "-pix_fmt", "yuv420p",                  # 8-bit (10-bit HEVC-г буулгана)
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
        "-movflags", "+faststart",
        str(dst),
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0 or not dst.exists():
        sys.stderr.write(res.stderr[-1500:] + "\n")
        raise SystemExit(f"хөрвүүлэлт бүтэлгүйтэв: {src.name}")


# ---------- path-length нормчилсон DTW (Python хувилбар) ----------
def frame_dist(p, q):
    s = 0.0
    for a, b in zip(p, q):
        d = a - b
        s += d * d
    return math.sqrt(s)


def dtw(a, b):
    n, m = len(a), len(b)
    if n == 0 or m == 0:
        return float("inf")
    INF = float("inf")
    pC = [INF] * (m + 1)
    pL = [0] * (m + 1)
    cC = [INF] * (m + 1)
    cL = [0] * (m + 1)
    pC[0] = 0.0
    for i in range(1, n + 1):
        cC[0] = INF
        cL[0] = 0
        for j in range(1, m + 1):
            c = frame_dist(a[i - 1], b[j - 1])
            bC, bL = pC[j], pL[j]
            if cC[j - 1] < bC:
                bC, bL = cC[j - 1], cL[j - 1]
            if pC[j - 1] < bC:
                bC, bL = pC[j - 1], pL[j - 1]
            cC[j] = c + bC
            cL[j] = bL + 1
        pC, cC = cC, pC
        pL, cL = cL, pL
    return pC[m] / (pL[m] or 1)


def serve(directory: Path):
    handler = lambda *a, **k: SimpleHTTPRequestHandler(*a, directory=str(directory), **k)
    # чөлөөт порт сонгоно
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(("127.0.0.1", 0))
    port = s.getsockname()[1]
    s.close()
    httpd = ThreadingHTTPServer(("127.0.0.1", port), handler)
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    return httpd, port


def main():
    if not SRC_VIDEOS.exists():
        raise SystemExit(f"эх видео фолдер алга: {SRC_VIDEOS}")
    clips = sorted(
        p for p in SRC_VIDEOS.iterdir()
        if p.is_file() and p.suffix.lower() in VIDEO_EXTS
    )
    if not clips:
        raise SystemExit("боловсруулах бичлэг олдсонгүй.")

    max_clips = int(os.environ.get("MAX_CLIPS", "0") or "0")
    if max_clips > 0:
        clips = clips[:max_clips]
    skip_transcode = os.environ.get("SKIP_TRANSCODE", "") not in ("", "0")
    use_gpu = os.environ.get("USE_GPU", "") not in ("", "0")
    timeout_ms = int(os.environ.get("EXTRACT_TIMEOUT_S", "5400")) * 1000

    WORK_DIR.mkdir(parents=True, exist_ok=True)

    if skip_transcode:
        # Эх клипүүдийн ЭРЭМБЭЭС manifest-ийг дахин байгуулна (transcode-той ижил
        # дараалал → clip-001.. гэх мэт). manifest.json тайрагдсан байж болзошгүй
        # тул түүнд найдахгүй.
        manifest = []
        for idx, src in enumerate(clips, 1):
            out_name = f"clip-{idx:03d}.mp4"
            if (WORK_DIR / out_name).exists():
                manifest.append(
                    {"id": src.stem, "label": parse_letter(src.stem), "url": f"./{out_name}"}
                )
        print(f"хөрвүүлэлт алгассан — {len(manifest)} бэлэн клип ашиглана.")
    else:
        ffmpeg = find_ffmpeg()
        for old in WORK_DIR.glob("*.mp4"):
            old.unlink()
        print(f"{len(clips)} бичлэг хөрвүүлж байна…")
        manifest = []
        for idx, src in enumerate(clips, 1):
            letter = parse_letter(src.stem)
            out_name = f"clip-{idx:03d}.mp4"
            dst = WORK_DIR / out_name
            print(f"  [{idx}/{len(clips)}] {src.name} → {out_name}  (үсэг: {letter})")
            transcode(ffmpeg, src, dst)
            manifest.append({"id": src.stem, "label": letter, "url": f"./{out_name}"})

    if max_clips > 0:
        manifest = manifest[:max_clips]
    (WORK_DIR / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False), encoding="utf-8"
    )
    # extractor.html-ийг .work дотор хуулна
    (WORK_DIR / "extractor.html").write_text(
        (SCRIPT_DIR / "extractor.html").read_text(encoding="utf-8"), encoding="utf-8"
    )

    httpd, port = serve(WORK_DIR)
    url = f"http://127.0.0.1:{port}/extractor.html"
    print(f"extractor ажиллуулж байна: {url}  (gpu={use_gpu}, клип={len(manifest)})")

    from playwright.sync_api import sync_playwright

    if use_gpu:
        args = [
            "--ignore-gpu-blocklist",
            "--enable-gpu-rasterization",
            "--use-angle=d3d11",
        ]
    else:
        args = ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"]

    import time as _time

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=args)
        page = browser.new_page()
        page.on("pageerror", lambda e: print("  [pageerror]", e))
        page.goto(url)

        # progress polling — урт ажиллагааны явцыг харуулна
        start = _time.monotonic()
        last_done = -1
        while True:
            done = page.evaluate("() => window.__DONE__ === true")
            prog = page.evaluate("() => window.__PROGRESS__ || null")
            if prog and prog["done"] != last_done:
                last_done = prog["done"]
                el = _time.monotonic() - start
                rate = prog["done"] / el if el > 0 else 0
                eta = (prog["total"] - prog["done"]) / rate if rate > 0 else 0
                print(
                    f"  явц {prog['done']}/{prog['total']}  ({prog['last']})  "
                    f"{rate:.2f} клип/сек  ETA ~{eta/60:.1f} мин",
                    flush=True,
                )
            if done:
                break
            if (_time.monotonic() - start) * 1000 > timeout_ms:
                # timeout — хэсэгчилсэн үр дүн авч хадгална
                print("  ⚠ timeout — хэсэгчилсэн үр дүн авна", flush=True)
                break
            _time.sleep(2)

        err = page.evaluate("() => window.__ERROR__ || null")
        if err:
            print("extractor алдаа:\n" + err, flush=True)
        result = page.evaluate("() => window.__RESULT__ || null")
        if not result:
            partial = page.evaluate("() => window.__PARTIAL__ || []")
            result = {"seqLen": 32, "dim": 94, "items": partial}
        browser.close()
    httpd.shutdown()

    items = result["items"]
    seq_len = result["seqLen"]
    dim = result["dim"]

    # үсгээр бүлэглэх
    by_letter = {}
    for it in items:
        by_letter.setdefault(it["label"], []).append(it)

    letters_out = []
    all_intra = []
    for letter, group in by_letter.items():
        samples = [g["seq"] for g in group if g["seq"]]
        # нэг үсгийн дотоод хамгийн ойр-хөршийн зайнууд (зөв гүйцэтгэлийн тархалт)
        for i, a in enumerate(samples):
            nearest = min(
                (dtw(a, b) for j, b in enumerate(samples) if i != j),
                default=float("inf"),
            )
            if math.isfinite(nearest):
                all_intra.append(nearest)
        letters_out.append({
            "letter": letter,
            "frames": [g["frames"] for g in group],
            "samples": samples,
        })
        print(f"  үсэг {letter}: {len(samples)} эталон, фрейм={[g['frames'] for g in group]}")

    # санал болгох босго: дотоод хамгийн ойр зайн 90-р хувийн цэг × 1.25
    suggested = 5.0
    if all_intra:
        all_intra.sort()
        p90 = all_intra[min(len(all_intra) - 1, int(0.9 * len(all_intra)))]
        suggested = round(p90 * 1.25, 2)
    print(f"дотоод зай: n={len(all_intra)} → санал болгох босго ≈ {suggested}")

    payload = {
        "version": 1,
        "seqLen": seq_len,
        "dim": dim,
        "suggestedThreshold": suggested,
        "letters": letters_out,
    }
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    size_kb = OUT_JSON.stat().st_size / 1024
    print(f"\n✓ бичлээ: {OUT_JSON}  ({size_kb:.0f} KB)")


if __name__ == "__main__":
    main()
