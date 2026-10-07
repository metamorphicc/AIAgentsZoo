"""Browser regression check against a local server with durable test storage.

Requires Playwright, eth-account, and Chrome. Set ZOO_TEST_URL if needed.
"""

import os
import secrets

from eth_account import Account
from eth_account.messages import encode_defunct
from playwright.sync_api import sync_playwright


base_url = os.environ.get("ZOO_TEST_URL", "http://localhost:3034")
account = Account.from_key(secrets.token_bytes(32))


def context_with_wallet(browser):
    context = browser.new_context()
    context.expose_function(
        "signZooMessage",
        lambda message: "0x" + Account.sign_message(encode_defunct(text=message), account.key).signature.hex(),
    )
    context.add_init_script(
        """(() => {
          const address = '__ADDRESS__';
          const listeners = new Map();
          window.ethereum = {
            request: async ({ method, params }) => {
              if (method === 'eth_requestAccounts' || method === 'eth_accounts') return [address];
              if (method === 'eth_chainId') return '0x1';
              if (method === 'personal_sign') return window.signZooMessage(params[0]);
              throw Error(method);
            },
            on: (event, callback) => {
              const callbacks = listeners.get(event) || new Set();
              callbacks.add(callback);
              listeners.set(event, callbacks);
            },
            removeListener: (event, callback) => listeners.get(event)?.delete(callback),
          };
          window.testWalletEmit = (event, value) => {
            for (const callback of listeners.get(event) || []) callback(value);
          };
        })();""".replace("__ADDRESS__", account.address)
    )
    return context


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="chrome", headless=True)
    first_context = context_with_wallet(browser)
    page = first_context.new_page()
    page.goto(f"{base_url}/enclosures", wait_until="domcontentloaded")
    page.locator(".access-panel .wallet-connect").click()
    page.locator(".product-nav-actions .wallet-identity").wait_for(timeout=20000)
    assert page.locator(".product-nav-actions .wallet-control > p").count() == 0, "Success banner remained visible"

    for href in ("/zoo", "/agents", "/enclosures", "/operators", "/manage"):
        selector = f'.product-nav-links a[href="{href}"]' if href != "/manage" else '.product-nav-actions a[href="/manage"]'
        page.locator(selector).click()
        page.wait_for_url(f"**{href}")
        page.locator(".product-nav-actions .wallet-identity").wait_for(timeout=15000)
        current = page.evaluate('fetch("/api/auth/session", {cache:"no-store"}).then(r=>r.json()).then(x=>x.session?.address?.toLowerCase())')
        assert current == account.address.lower(), f"Session lost on {href}"

    page.evaluate("address => window.testWalletEmit('accountsChanged', [address])", account.address.lower())
    page.wait_for_timeout(300)
    current = page.evaluate('fetch("/api/auth/session").then(r=>r.json()).then(x=>x.session?.address?.toLowerCase())')
    assert current == account.address.lower(), "Same-address event revoked session"
    page.evaluate("window.testWalletEmit('accountsChanged', [])")
    page.wait_for_timeout(300)
    current = page.evaluate('fetch("/api/auth/session").then(r=>r.json()).then(x=>x.session?.address?.toLowerCase())')
    assert current == account.address.lower(), "Transient empty accounts event revoked session"

    second_context = context_with_wallet(browser)
    second_page = second_context.new_page()
    second_page.goto(f"{base_url}/enclosures", wait_until="domcontentloaded")
    second_page.locator(".access-panel .wallet-connect").click()
    second_page.locator(".product-nav-actions .wallet-identity").wait_for(timeout=20000)
    page.reload(wait_until="domcontentloaded")
    page.locator(".product-nav-actions .wallet-identity").wait_for(timeout=15000)
    print("PASS: session survives route changes, same-account events, and a second browser sign-in")

    page.evaluate("window.testWalletEmit('accountsChanged', ['0x0000000000000000000000000000000000000001'])")
    page.locator(".product-nav-actions .wallet-connect").wait_for(timeout=15000)
    assert page.evaluate('fetch("/api/auth/session").then(r=>r.json()).then(x=>x.session)') is None
    print("PASS: switching to a different wallet revokes this session")

    second_context.close()
    first_context.close()
    browser.close()
