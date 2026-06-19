# -*- coding: utf-8 -*-
# Эерэг тест: fake камер нь "А" клип тэжээнэ. Зорилтыг "А" болтол Алгасаад,
# зөв таних (оноо нэмэгдэх / "Зөв" төлөв) эсэхийг шалгана.
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
            "--use-gl=swiftshader", "--enable-unsafe-swiftshader",
            "--use-fake-device-for-media-stream",
            "--use-fake-ui-for-media-stream",
            f"--use-file-for-fake-video-capture={FAKE}",
        ],
    )
    ctx = browser.new_context(permissions=["camera"])
    page = ctx.new_page()
    page.goto(URL, wait_until="domcontentloaded")
    page.wait_for_function("() => document.body.innerText.includes('Бэлэн')", timeout=60000)
    page.get_by_text("Эхлэх", exact=True).click()
    page.wait_for_function("() => document.body.innerText.includes('дохиог')", timeout=60000)

    def target():
        return page.evaluate(
            "() => { const el=[...document.querySelectorAll('div')]"
            ".find(e=>/text-8xl/.test(e.className)); return el? el.textContent.trim():''; }"
        )

    # Зорилт "А" болтол Алгасах
    tries = 0
    while target() != "А" and tries < 80:
        page.get_by_text("Алгасах", exact=True).click()
        time.sleep(0.15)
        tries += 1
    print("зорилт:", target(), "| алгасалт:", tries)

    if target() != "А":
        print("РЕЗУЛЬТАТ: «А» зорилт тохироогүй"); browser.close(); sys.exit(1)

    # "А"-г таниx хүртэл ~25 сек ажиглах
    ok = False
    for _ in range(25):
        status = page.evaluate("() => document.querySelector('p[aria-live]').textContent")
        score = page.evaluate(
            "() => { const dd=document.querySelectorAll('dd'); return dd[0]?dd[0].textContent:'0'; }"
        )
        if "Зөв" in status or (score.strip().isdigit() and int(score) > 0):
            print("✓ таньсан:", status, "| оноо:", score)
            ok = True
            break
        time.sleep(1)

    if not ok:
        print("төлөв:", page.evaluate("() => document.querySelector('p[aria-live]').textContent"))
    browser.close()
    print("РЕЗУЛЬТАТ:", "OK — «А» зөв танигдлаа" if ok else "«А» танигдсангүй (босго тохируулах шаардлагатай)")
    sys.exit(0 if ok else 2)
