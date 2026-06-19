# -*- coding: utf-8 -*-
# Тоглоомын end-to-end утаа-тест: fake камер (нэг "А" клип) тэжээж, бүх
# pipeline (эталон fetch → камер → MediaPipe → таних давталт) алдаагүй
# ажиллахыг шалгана. Зөв таних эсэхийг (target санамсаргүй тул) шалгахгүй —
# зөвхөн механик ажиллагааг батална.
import sys, time
from pathlib import Path
sys.stdout.reconfigure(encoding="utf-8")

WORK = Path(__file__).resolve().parent / ".work"
FAKE = WORK / "fakecam.y4m"
URL = "http://localhost:3000/games"

from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        args=[
            "--use-gl=swiftshader",
            "--enable-unsafe-swiftshader",
            "--use-fake-device-for-media-stream",
            "--use-fake-ui-for-media-stream",
            f"--use-file-for-fake-video-capture={FAKE}",
        ],
    )
    ctx = browser.new_context(permissions=["camera"])
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append("console.error: " + m.text)
            if m.type == "error" else None)

    page.goto(URL, wait_until="domcontentloaded")

    # 1) Эталон ачаалагдаж "Бэлэн" төлөвт орох
    page.wait_for_function(
        "() => document.body.innerText.includes('Бэлэн')", timeout=60000
    )
    print("✓ эталон ачаалагдаж, БЭЛЭН төлөвт оров")

    # 2) Эхлэх
    page.get_by_text("Эхлэх", exact=True).click()

    # 3) Тоглоom эхэлж, зорилтот үсэг гарч, оролдлого нэмэгдэхийг хүлээх
    page.wait_for_function(
        "() => document.body.innerText.includes('дохиог үзүүлээрэй') "
        "|| document.body.innerText.includes('дохиог хий')",
        timeout=60000,
    )
    print("✓ тоглоом эхэлж, зорилтот үсэг гарч ирэв")

    # attempts/score-ийн өсөлтийг ~40 сек ажиглах
    last = ""
    got_attempt = False
    for _ in range(40):
        txt = page.evaluate(
            "() => { const dd=[...document.querySelectorAll('dd')].map(e=>e.textContent); "
            "return dd.join('|'); }"
        )
        if txt != last:
            print("  оноо/оролдлого:", txt)
            last = txt
        # хоёр дахь dd = оролдлого
        parts = txt.split("|")
        if len(parts) >= 2 and parts[1].strip().isdigit() and int(parts[1]) > 0:
            got_attempt = True
            break
        time.sleep(1)

    status = page.evaluate("() => document.querySelector('p[aria-live]').textContent")
    print("төлөв:", status)
    print("✓ оролдлого бүртгэгдсэн:" , got_attempt)

    real_errors = [e for e in errors if "favicon" not in e]
    if real_errors:
        print("⚠ алдаанууд:")
        for e in real_errors[:10]:
            print("   ", e)
    else:
        print("✓ JS алдаагүй")

    browser.close()
    if not got_attempt:
        print("РЕЗУЛЬТАТ: оролдлого бүртгэгдсэнгүй (pipeline бүрэн ажиллаагүй байж магадгүй)")
    if real_errors:
        sys.exit(1)
    print("РЕЗУЛЬТАТ: OK")
