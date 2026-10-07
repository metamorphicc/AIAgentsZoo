"""Check management button contrast and alignment on a local test server.

Requires Playwright, eth-account, and Chrome. The server must use an isolated
local database; this script creates a temporary enclosure and two animals.
"""

import os
import secrets
import tempfile
from pathlib import Path
from urllib.parse import urlparse

from eth_account import Account
from eth_account.messages import encode_defunct
from playwright.sync_api import sync_playwright


base_url = os.environ.get("ZOO_TEST_URL", "http://localhost:3036")
if urlparse(base_url).hostname not in {"localhost", "127.0.0.1"}:
    raise SystemExit("Layout checks must run against a local test server only.")

account = Account.from_key(secrets.token_bytes(32))

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="chrome", headless=True)
    context = browser.new_context(viewport={"width": 1309, "height": 850})
    context.expose_function(
        "signZooMessage",
        lambda message: "0x" + Account.sign_message(encode_defunct(text=message), account.key).signature.hex(),
    )
    context.add_init_script(
        """(() => {
          const address = '__ADDRESS__';
          window.ethereum = {
            request: async ({ method, params }) => {
              if (method === 'eth_requestAccounts' || method === 'eth_accounts') return [address];
              if (method === 'eth_chainId') return '0x1';
              if (method === 'personal_sign') return window.signZooMessage(params[0]);
              throw Error(method);
            },
            on: () => {}, removeListener: () => {},
          };
        })();""".replace("__ADDRESS__", account.address)
    )
    page = context.new_page()
    page.goto(f"{base_url}/enclosures", wait_until="domcontentloaded")
    page.locator(".access-panel .wallet-connect").click()
    page.locator(".product-nav-actions .wallet-identity").wait_for(timeout=20000)

    def create(path, data):
        result = page.evaluate(
            """async ([path, data]) => {
              const response = await fetch(path, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data),
              });
              return { status: response.status, body: await response.json() };
            }""",
            [path, data],
        )
        assert result["status"] == 201, result
        return result["body"]

    enclosure = create(
        "/api/enclosures",
        {"name": "Layout QA", "description": "Isolated visual layout check", "territory": "Local test data"},
    )["enclosure"]
    for name, species in (("Raven North", "raven"), ("Owl North", "owl")):
        create(
            "/api/agents",
            {"name": name, "species": species, "feedMax": 20, "enclosureId": enclosure["id"]},
        )

    page.goto(f"{base_url}/manage", wait_until="domcontentloaded")
    page.locator(".manage-row").first.wait_for()
    for width in (1309, 1024, 768, 414, 375, 320):
        page.set_viewport_size({"width": width, "height": 850})
        metrics = page.evaluate(
            """() => {
              const rows = [...document.querySelectorAll('.manage-row')];
              const buttons = rows.map(row => [...row.querySelectorAll('.manage-actions button')].map(button => {
                const rect = button.getBoundingClientRect();
                const style = getComputedStyle(button);
                return {x: rect.x, right: rect.right, width: rect.width,
                  height: rect.height, color: style.color, background: style.backgroundColor};
              }));
              const canvas = document.createElement('canvas');
              canvas.width = canvas.height = 1;
              const ctx = canvas.getContext('2d');
              const rgb = color => {
                ctx.fillStyle = color;
                ctx.fillRect(0, 0, 1, 1);
                return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
              };
              const luminance = color => rgb(color).map(value => {
                const s = value / 255;
                return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
              }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
              const contrast = ({color, background}) => {
                const a = luminance(color), b = luminance(background);
                return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
              };
              return {buttons, ratios: buttons[0].map(contrast),
                overflow: document.documentElement.scrollWidth - innerWidth};
            }"""
        )
        assert metrics["overflow"] <= 1, (width, "page overflows", metrics)
        assert len(metrics["buttons"]) == 2, (width, metrics)
        for pair in metrics["buttons"]:
            assert len(pair) == 2, (width, pair)
            assert abs(pair[0]["width"] - pair[1]["width"]) < 1, (width, pair)
            assert all(button["height"] >= 44 for button in pair), (width, pair)
            assert all(button["x"] >= 0 and button["right"] <= width for button in pair), (width, pair)
        assert abs(metrics["buttons"][0][0]["x"] - metrics["buttons"][1][0]["x"]) < 1, (width, metrics)
        assert abs(metrics["buttons"][0][0]["width"] - metrics["buttons"][1][0]["width"]) < 1, (width, metrics)
        assert min(metrics["ratios"]) >= 4.5, (width, metrics["ratios"])
        print(f"PASS {width}px: aligned buttons; minimum contrast {min(metrics['ratios']):.1f}:1")
        if os.environ.get("ZOO_CAPTURE_LAYOUT") == "1" and width in (1309, 375):
            page.locator(".manage-list").scroll_into_view_if_needed()
            page.wait_for_timeout(1200)
            page.locator(".manage-list").screenshot(
                path=str(Path(tempfile.gettempdir()) / f"agentzoo-manage-{width}.png")
            )

    context.close()
    browser.close()
