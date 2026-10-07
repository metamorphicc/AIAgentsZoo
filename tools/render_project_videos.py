"""Render two short Agent Zoo screen tours from the live site and a local test session.

Requirements: playwright, opencv-python, imageio-ffmpeg, eth-account.
Run the production build on http://localhost:3033 with an isolated local libSQL file
before recording the interactive tour.
"""

from __future__ import annotations

import argparse
import math
import secrets
import subprocess
from pathlib import Path

import cv2
import imageio_ffmpeg
import numpy as np
from eth_account import Account
from eth_account.messages import encode_defunct
from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import Page, sync_playwright


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "videos"
LIVE = "https://agentzoo.tech"
LOCAL = "http://localhost:3033"
WIDTH, HEIGHT, FPS = 1280, 720, 24
LIME = (218, 250, 18)


class Recorder:
    def __init__(self, filename: str, cursor: bool = False):
        OUTPUT.mkdir(exist_ok=True)
        self.path = OUTPUT / filename
        self.show_cursor = cursor
        self.cursor = (WIDTH // 2, HEIGHT // 2)
        self.count = 0
        self.process = subprocess.Popen(
            [
                imageio_ffmpeg.get_ffmpeg_exe(),
                "-y", "-hide_banner", "-loglevel", "error",
                "-f", "rawvideo", "-pix_fmt", "bgr24",
                "-s", f"{WIDTH}x{HEIGHT}", "-r", str(FPS), "-i", "-",
                "-an", "-c:v", "libx264", "-preset", "veryfast",
                "-crf", "18", "-pix_fmt", "yuv420p",
                "-movflags", "+faststart", str(self.path),
            ],
            stdin=subprocess.PIPE,
        )

    def _write(self, frame: np.ndarray, click: bool = False):
        if self.show_cursor:
            x, y = self.cursor
            if click:
                cv2.circle(frame, (x + 2, y + 2), 26, (30, 70, 95), 3, cv2.LINE_AA)
                cv2.circle(frame, (x + 2, y + 2), 17, (20, 180, 230), 2, cv2.LINE_AA)
            points = np.array([[x, y], [x + 1, y + 23], [x + 7, y + 17], [x + 13, y + 30], [x + 19, y + 27], [x + 13, y + 14], [x + 22, y + 13]], np.int32)
            cv2.fillPoly(frame, [points], (10, 15, 15))
            cv2.polylines(frame, [points], True, (255, 255, 255), 2, cv2.LINE_AA)
        assert self.process.stdin is not None
        self.process.stdin.write(frame.tobytes())
        self.count += 1

    def frame(self, page: Page, click: bool = False):
        raw = np.frombuffer(page.screenshot(type="jpeg", quality=84, animations="allow"), dtype=np.uint8)
        frame = cv2.imdecode(raw, cv2.IMREAD_COLOR)
        if frame is None or frame.shape[:2] != (HEIGHT, WIDTH):
            raise RuntimeError(f"Unexpected browser screenshot size: {None if frame is None else frame.shape}")
        self._write(frame, click=click)

    def hold(self, page: Page, seconds: float, click: bool = False):
        for _ in range(round(seconds * FPS)):
            self.frame(page, click=click)

    def scroll(self, page: Page, target: float, seconds: float):
        start = page.evaluate("window.scrollY")
        total = round(seconds * FPS)
        for index in range(total):
            progress = (index + 1) / total
            smooth = progress * progress * (3 - 2 * progress)
            page.evaluate("y => window.scrollTo({top:y, behavior:'instant'})", start + (target - start) * smooth)
            self.frame(page)

    def move(self, page: Page, target: tuple[float, float], seconds: float):
        start_x, start_y = self.cursor
        total = max(1, round(seconds * FPS))
        end_x, end_y = int(target[0]), int(target[1])
        for index in range(total):
            progress = (index + 1) / total
            smooth = progress * progress * (3 - 2 * progress)
            x = round(start_x + (end_x - start_x) * smooth)
            y = round(start_y + (end_y - start_y) * smooth)
            self.cursor = (x, y)
            page.mouse.move(x, y)
            self.frame(page)

    def point_at(self, page: Page, selector: str, seconds: float = 0.35):
        element = page.locator(selector).first
        element.scroll_into_view_if_needed()
        box = element.bounding_box()
        if not box:
            raise RuntimeError(f"Cannot find visible element: {selector}")
        self.move(page, (box["x"] + box["width"] * 0.5, box["y"] + box["height"] * 0.5), seconds)

    def click(self, page: Page, selector: str, travel: float = 0.3, linger: float = 0.15):
        self.point_at(page, selector, travel)
        page.locator(selector).first.click()
        self.hold(page, linger, click=True)

    def type_text(self, page: Page, selector: str, value: str, seconds: float):
        field = page.locator(selector).first
        self.point_at(page, selector, 0.16)
        field.click()
        count = max(len(value), round(seconds * FPS))
        for index in range(count):
            chars = math.ceil((index + 1) / count * len(value))
            field.fill(value[:chars])
            self.frame(page)

    def title_card(self, heading: str, subheading: str, seconds: float):
        background = Image.new("RGB", (WIDTH, HEIGHT), (5, 12, 7))
        draw = ImageDraw.Draw(background)
        font_path = "C:/Windows/Fonts/arial.ttf"
        bold_path = "C:/Windows/Fonts/arialbd.ttf"
        title_font = ImageFont.truetype(bold_path, 74)
        body_font = ImageFont.truetype(font_path, 27)
        small_font = ImageFont.truetype(bold_path, 19)
        draw.ellipse((WIDTH // 2 - 28, 102, WIDTH // 2 + 28, 158), outline=LIME, width=3)
        draw.text((WIDTH // 2, 129), "AZ", font=small_font, fill=LIME, anchor="mm")
        draw.text((WIDTH // 2, 332), heading, font=title_font, fill=(246, 247, 240), anchor="mm")
        draw.text((WIDTH // 2, 419), subheading, font=body_font, fill=LIME, anchor="mm")
        draw.line((WIDTH // 2 - 100, 491, WIDTH // 2 + 100, 491), fill=(69, 92, 54), width=2)
        frame = cv2.cvtColor(np.array(background), cv2.COLOR_RGB2BGR)
        for _ in range(round(seconds * FPS)):
            self._write(frame.copy())

    def finish(self):
        assert self.process.stdin is not None
        self.process.stdin.close()
        if self.process.wait() != 0:
            raise RuntimeError(f"ffmpeg failed while rendering {self.path}")
        print(f"Rendered {self.path} ({self.count / FPS:.2f} seconds)")


def ready(page: Page, selector: str):
    page.locator(selector).first.wait_for(state="visible", timeout=30000)
    page.evaluate("document.documentElement.style.scrollbarWidth='none'")


def position_of(page: Page, selector: str, top_padding: int = 110) -> float:
    return page.locator(selector).first.evaluate(
        "(el, padding) => Math.max(0, el.getBoundingClientRect().top + window.scrollY - padding)",
        top_padding,
    )


def smooth_tour(browser):
    context = browser.new_context(viewport={"width": WIDTH, "height": HEIGHT}, device_scale_factor=1, reduced_motion="no-preference")
    page = context.new_page()
    video = Recorder("agentzoo-smooth-tour.mp4")
    try:
        page.goto(LIVE, wait_until="domcontentloaded", timeout=45000)
        ready(page, "#landing-title")
        video.hold(page, 2.3)
        video.scroll(page, 190, 2.2)
        video.scroll(page, position_of(page, ".landing-sequence", 110) if page.locator(".landing-sequence").count() else 730, 2.6)
        video.hold(page, 0.9)

        page.goto(f"{LIVE}/zoo", wait_until="domcontentloaded", timeout=45000)
        ready(page, ".operator-home")
        video.hold(page, 2.0)
        video.scroll(page, position_of(page, ".habitat-pulse", 115), 1.7)
        video.scroll(page, position_of(page, ".network-panel", 105), 2.4)
        video.hold(page, 1.0)

        page.goto(f"{LIVE}/agents", wait_until="domcontentloaded", timeout=45000)
        ready(page, ".agent-directory")
        video.hold(page, 1.0)
        video.scroll(page, 220, 1.3)

        page.goto(f"{LIVE}/agents/owl-1", wait_until="domcontentloaded", timeout=45000)
        ready(page, ".animal-passport-stage")
        page.locator(".animal-passport-model canvas").wait_for(state="visible", timeout=10000)
        page.wait_for_timeout(1800)
        video.hold(page, 0.6)
        video.scroll(page, 300, 0.8)
        video.hold(page, 1.8)

        page.goto(f"{LIVE}/enclosures/habitat-01", wait_until="domcontentloaded", timeout=45000)
        ready(page, ".enclosure-orchestrator")
        video.hold(page, 1.3)
        video.scroll(page, position_of(page, ".directory-panel", 115), 0.8)
        video.title_card("AI AGENT ZOO", "Explore the habitat · agentzoo.tech", 1.3)
    finally:
        video.finish()
        context.close()


def guided_tour(browser):
    account = Account.from_key(secrets.token_bytes(32))
    context = browser.new_context(viewport={"width": WIDTH, "height": HEIGHT}, device_scale_factor=1, reduced_motion="no-preference")
    context.expose_function("signZooMessage", lambda message: "0x" + Account.sign_message(encode_defunct(text=message), account.key).signature.hex())
    context.add_init_script(
        """(() => {
          const address = '__TEST_WALLET_ADDRESS__';
          window.ethereum = {
            request: async ({ method, params }) => {
              if (method === 'eth_requestAccounts' || method === 'eth_accounts') return [address];
              if (method === 'eth_chainId') return '0x1';
              if (method === 'personal_sign') return window.signZooMessage(params[0]);
              throw new Error('Unsupported test wallet method: ' + method);
            },
            on: () => {}, removeListener: () => {}
          };
        })();""".replace("__TEST_WALLET_ADDRESS__", account.address)
    )
    page = context.new_page()
    video = Recorder("agentzoo-guided-walkthrough.mp4", cursor=True)
    video.cursor = (970, 575)
    try:
        page.goto(LOCAL, wait_until="domcontentloaded", timeout=30000)
        ready(page, "#landing-title")
        video.hold(page, 0.8)
        video.click(page, 'a:has-text("ENTER THE ZOO")', travel=0.55)
        ready(page, ".operator-home")
        video.hold(page, 0.65)
        video.click(page, '.product-nav-links a[href="/enclosures"]', travel=0.5)
        ready(page, ".access-panel")
        video.hold(page, 0.6)
        video.click(page, '.access-panel .wallet-connect', travel=0.5, linger=0.2)
        page.locator(".operator-form--control-agent").wait_for(state="visible", timeout=20000)
        video.hold(page, 0.5)

        agent_form = ".operator-form--control-agent"
        video.type_text(page, f'{agent_form} input[name="name"]', "Scout Director", 0.8)
        page.locator(f'{agent_form} select[name="provider"]').select_option("grok")
        page.locator(f'{agent_form} input[name="model"]').fill("grok-4")
        page.locator(f'{agent_form} input[name="role"]').fill("Habitat conductor")
        video.type_text(page, f'{agent_form} textarea[name="description"]', "Coordinates the habitat and its pets.", 0.85)
        video.hold(page, 0.35)
        video.click(page, f'{agent_form} button[type="submit"]', travel=0.35)
        page.get_by_text("AI agent registered.", exact=True).wait_for(state="visible", timeout=20000)
        page.locator('.operator-form--enclosure select[name="headAgentId"] option', has_text="Scout Director").wait_for(state="attached", timeout=20000)

        enclosure_form = ".operator-form--enclosure"
        page.locator(enclosure_form).scroll_into_view_if_needed()
        video.hold(page, 0.45)
        video.type_text(page, f'{enclosure_form} input[name="name"]', "Signal Grove", 0.65)
        page.locator(f'{enclosure_form} input[name="territory"]').fill("Research and public signals")
        page.locator(f'{enclosure_form} textarea[name="description"]').fill("A small habitat for scouts and builders.")
        page.locator(f'{enclosure_form} select[name="headAgentId"]').select_option(label="Scout Director · Habitat conductor")
        video.hold(page, 0.5)
        video.click(page, f'{enclosure_form} button[type="submit"]', travel=0.3)
        page.get_by_text("Enclosure created.", exact=True).wait_for(state="visible", timeout=20000)
        page.locator('.operator-form--animal select[name="enclosureId"] option', has_text="Signal Grove").wait_for(state="attached", timeout=20000)

        pet_form = ".operator-form--animal"
        page.locator(pet_form).scroll_into_view_if_needed()
        video.hold(page, 0.4)
        video.type_text(page, f'{pet_form} input[name="name"]', "Raven Echo", 0.65)
        page.locator(f'{pet_form} select[name="species"]').select_option("raven")
        page.locator(f'{pet_form} select[name="enclosureId"]').select_option(label="Signal Grove")
        page.locator(f'{pet_form} select[name="controlAgentId"]').select_option(label="Scout Director · grok-4")
        page.locator(f'{pet_form} input[name="feedMax"]').fill("12")
        video.hold(page, 0.55)
        video.click(page, f'{pet_form} button[type="submit"]', travel=0.25)
        page.get_by_text("Animal created and assigned.", exact=True).wait_for(state="visible", timeout=20000)
        video.hold(page, 0.55)

        page.locator(".enclosure-directory").scroll_into_view_if_needed()
        video.hold(page, 0.45)
        video.click(page, '.enclosure-row:has-text("Signal Grove")', travel=0.4)
        ready(page, ".enclosure-orchestrator")
        video.hold(page, 1.1)
        video.scroll(page, position_of(page, ".directory-panel", 120), 0.75)
        video.hold(page, 1.15)
        video.click(page, '.agent-directory a:has-text("Raven Echo")', travel=0.45)
        ready(page, ".animal-passport-stage")
        page.locator(".animal-passport-model canvas").wait_for(state="visible", timeout=10000)
        page.wait_for_timeout(1800)
        video.scroll(page, 280, 0.55)
        video.move(page, (985, 360), 0.55)
        video.hold(page, 1.8)
        video.title_card("BUILD YOUR HABITAT", "Register agents · assign pets · agentzoo.tech", 1.2)
    finally:
        video.finish()
        context.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["smooth", "guided", "both"], default="both")
    args = parser.parse_args()
    chrome = Path("C:/Program Files/Google/Chrome/Application/chrome.exe")
    if not chrome.exists():
        raise RuntimeError(f"Chrome not found: {chrome}")
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=str(chrome), headless=True, args=["--disable-gpu-sandbox"])
        try:
            if args.mode in ("smooth", "both"):
                smooth_tour(browser)
            if args.mode in ("guided", "both"):
                guided_tour(browser)
        finally:
            browser.close()


if __name__ == "__main__":
    main()
