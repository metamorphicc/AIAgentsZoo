import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

// This suite deliberately refuses public hosts: it creates records in an isolated test server.
const base = "http://localhost:3038";
const modulePath = process.env.ZOO_TEST_PLAYWRIGHT_MODULE;
const { chromium } = await import(modulePath ? pathToFileURL(modulePath).href : "playwright");
const browserOptions = { channel: "chrome", headless: true, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] };

async function verifyModels(page) {
  for (const species of ["raven", "beaver", "owl", "meerkat"]) {
    await page.goto(`${base}/agents/${species}-1`, { waitUntil: "networkidle" });
    await page.locator("canvas").waitFor();
    await page.waitForTimeout(1600);
    assert.equal(await page.locator(".animal-model-overlay").count(), 0, species);
    const canvas = page.locator("canvas");
    await page.locator(".animal-model-actions button").nth(1).click();
    const beforeMotion = await canvas.screenshot();
    await page.waitForTimeout(750);
    assert.equal(beforeMotion.equals(await canvas.screenshot()), false, `${species} animation must change the rendered model`);
    await page.waitForFunction(() => document.querySelector(".animal-model-controls strong")?.textContent === "Idle", null, { timeout: 6000 });
    await page.waitForFunction(() => document.querySelector(".animal-model-controls strong")?.textContent !== "Idle", null, { timeout: 8000 });
    await page.screenshot({ path: join(tmpdir(), `agentzoo-launch-${species}.png`) });
  }
}

if (process.argv.includes("--models-only")) {
  const browser = await chromium.launch(browserOptions);
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
    page.on("pageerror", (error) => errors.push(error.message));
    await verifyModels(page);
    assert.deepEqual(errors, []);
    console.log("Four models: rendered movement, return to idle, automatic behavior without clicks, no browser errors passed.");
  } finally { await browser.close(); }
  process.exit(0);
}
const admin = privateKeyToAccount(`0x${"0".repeat(63)}1`); // Public test fixture; never use this account for funds.
const guardian = privateKeyToAccount(generatePrivateKey());
const outsider = privateKeyToAccount(generatePrivateKey());

async function api(path, { body, cookie, origin = base, method = body === undefined ? "GET" : "POST" } = {}) {
  return fetch(`${base}${path}`, { method, headers: { Origin: origin, ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...(cookie ? { Cookie: cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
}
async function signIn(account) {
  const challenge = await api("/api/auth/challenge", { body: { address: account.address, chainId: 1 } });
  assert.equal(challenge.status, 200);
  const { message } = await challenge.json();
  const signature = await account.signMessage({ message });
  const verified = await api("/api/auth/verify", { body: { address: account.address, signature } });
  assert.equal(verified.status, 200);
  const cookie = verified.headers.get("set-cookie").split(";")[0];
  return { cookie, session: (await verified.json()).session };
}

const health = await (await api("/api/health")).json();
assert.equal(health.provider, "local");
assert.equal((await api("/api/enclosures/habitat-01/run", { body: { requestId: randomUUID(), task: "Inspect" } })).status, 401);
const keeper = await signIn(admin);
assert.equal(keeper.session.role, "admin", "The isolated server must use the public admin fixture configured in DEPLOYMENT.md.");
const member = await signIn(guardian);
const stranger = await signIn(outsider);
assert.equal((await api("/api/agents/raven-1/wake", { cookie: member.cookie, body: {} })).status, 403);
assert.equal((await api("/api/enclosures", { cookie: member.cookie, origin: "https://outside.test", body: {} })).status, 403);
assert.equal((await api("/api/admin/visibility", { cookie: member.cookie, body: { kind: "enclosure", id: "habitat-01", hidden: true } })).status, 403);

const profiles = await api("/api/control-agents", { cookie: member.cookie, body: { name: "Research head", provider: "custom", model: "Local", role: "Coordinator", description: "Coordinates a shared research ledger." } });
assert.equal(profiles.status, 201);
const operator = (await profiles.json()).agent;
assert.equal((await api("/api/control-agents", { cookie: member.cookie, body: { name: "Unsafe endpoint", provider: "custom", model: "Local", role: "Coordinator", description: "Coordinates research", endpointUrl: "https://agent.example?api_key=secret" } })).status, 400);
let enclosure;
for (let index = 0; index < 3; index++) {
  const response = await api("/api/enclosures", { cookie: member.cookie, body: { name: `Research ${index}`, description: "A shared research habitat.", territory: "Public ledger", headAgentId: operator.id } });
  assert.equal(response.status, 201);
  if (!enclosure) enclosure = (await response.json()).enclosure;
}
assert.equal((await api("/api/enclosures", { cookie: member.cookie, body: { name: "Overflow", description: "A fourth habitat", territory: "Public ledger" } })).status, 409);
const pets = [];
for (const species of ["raven", "beaver", "owl", "meerkat"]) {
  const response = await api("/api/agents", { cookie: member.cookie, body: { name: `Research ${species}`, species, feedMax: 5, enclosureId: enclosure.id } });
  assert.equal(response.status, 201);
  pets.push((await response.json()).agent);
}
assert.equal((await api(`/api/enclosures/${enclosure.id}/run`, { cookie: stranger.cookie, body: { requestId: randomUUID(), task: "Inspect" } })).status, 403);
const requestId = randomUUID();
const run = await api(`/api/enclosures/${enclosure.id}/run`, { cookie: member.cookie, body: { requestId, task: "Inspect our shared research habitat." } });
assert.equal(run.status, 200);
const messages = (await run.text()).trim().split("\n").map((line) => JSON.parse(line));
assert.deepEqual(messages.filter((message) => message.type === "completed").map((message) => message.species), ["raven", "beaver", "owl", "meerkat"]);
assert.equal(messages.at(-1).type, "finished");
assert.equal(messages.at(-1).artifacts.length, 2);
assert.equal((await api(`/api/enclosures/${enclosure.id}/run`, { cookie: member.cookie, body: { requestId, task: "Replay" } })).status, 409);
assert.equal((await api(`/api/agents/${pets[0].id}/refill`, { cookie: stranger.cookie, body: {} })).status, 403);

await api("/api/admin/runtime", { cookie: keeper.cookie, body: { paused: true } });
assert.equal((await api(`/api/enclosures/${enclosure.id}/run`, { cookie: member.cookie, body: { requestId: randomUUID(), task: "Inspect" } })).status, 409);
await api("/api/admin/runtime", { cookie: keeper.cookie, body: { paused: false } });
await api("/api/admin/visibility", { cookie: keeper.cookie, body: { kind: "enclosure", id: enclosure.id, hidden: true } });
assert.equal((await api(`/api/enclosures/${enclosure.id}`)).status, 404);
assert.equal((await api(`/api/agents/${pets[0].id}`)).status, 404);
await api("/api/admin/visibility", { cookie: keeper.cookie, body: { kind: "enclosure", id: enclosure.id, hidden: false } });
assert.equal((await api(`/api/agents/${pets[0].id}`)).status, 200);
console.log("API: sign-in, ownership, quotas, streamed pipeline, replay protection, pause, moderation passed.");

const browser = await chromium.launch(browserOptions);
try {
  const context = await browser.newContext({ viewport: { width: 1365, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const route of ["/", "/zoo", "/agents", "/enclosures", "/trace", "/artifacts", "/tasks", "/operators", "/manage", "/nodes", "/protocol"]) {
    const response = await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
    assert.equal(response.status(), 200, route);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, route);
  }
  await page.goto(`${base}/zoo`, { waitUntil: "networkidle" });
  await page.locator(".habitat-workflow").scrollIntoViewIfNeeded();
  const activeBefore = await page.locator('.workflow-node[data-active="true"] strong').textContent();
  await page.waitForTimeout(3400);
  assert.notEqual(await page.locator('.workflow-node[data-active="true"] strong').textContent(), activeBefore);
  await page.getByRole("button", { name: "Pause flow", exact: true }).click();
  const pausedNode = await page.locator('.workflow-node[data-active="true"] strong').textContent();
  await page.waitForTimeout(3400);
  assert.equal(await page.locator('.workflow-node[data-active="true"] strong').textContent(), pausedNode);
  await page.screenshot({ path: join(tmpdir(), "agentzoo-launch-dashboard.png"), fullPage: true });

  const [cookieName, cookieValue] = keeper.cookie.split("=");
  await context.addCookies([{ name: cookieName, value: cookieValue, url: base, httpOnly: true, sameSite: "Lax" }]);
  await page.goto(`${base}/zoo`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "RUN HABITAT →", exact: true }).click();
  await page.locator(".workflow-result").waitFor({ timeout: 30_000 });
  assert.match(await page.locator(".workflow-result").textContent(), /4 steps recorded · 2 outputs published/);
  await page.getByRole("link", { name: "Animals", exact: true }).first().click();
  await page.waitForLoadState("networkidle");
  assert.equal((await (await api("/api/auth/session", { cookie: keeper.cookie })).json()).session.role, "admin");
  assert.equal(await page.locator(".product-nav-actions .wallet-identity").count(), 1);
  await page.goto(`${base}/manage`, { waitUntil: "networkidle" });
  const refill = await page.locator(".refill-control button").first().evaluate((button) => ({ color: getComputedStyle(button).color, background: getComputedStyle(button).backgroundColor }));
  assert.equal(refill.color, "rgb(0, 0, 0)");
  await page.screenshot({ path: join(tmpdir(), "agentzoo-launch-manage.png"), fullPage: true });

  await verifyModels(page);
  const mobile = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const phone = await mobile.newPage();
  phone.on("pageerror", (error) => errors.push(error.message));
  for (const route of ["/", "/zoo", "/enclosures", "/agents"]) {
    await phone.goto(`${base}${route}`, { waitUntil: "networkidle" });
    assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `mobile ${route}`);
  }
  await phone.goto(`${base}/zoo`, { waitUntil: "networkidle" });
  await phone.screenshot({ path: join(tmpdir(), "agentzoo-launch-mobile.png"), fullPage: true });
  await phone.emulateMedia({ reducedMotion: "reduce" });
  await phone.locator(".habitat-workflow").scrollIntoViewIfNeeded();
  const reducedNode = await phone.locator('.workflow-node[data-active="true"] strong').textContent();
  await phone.waitForTimeout(3400);
  assert.equal(await phone.locator('.workflow-node[data-active="true"] strong').textContent(), reducedNode);
  assert.deepEqual(errors, [], "Browser errors");
  const landing = await (await api("/")).text();
  assert.match(landing, /twitter:card/);
  assert.match(landing, /og:image/);
  for (const route of ["/opengraph-image", "/robots.txt", "/sitemap.xml"]) assert.equal((await api(route)).status, 200, route);
  console.log("Browser: desktop/mobile routes, active motion/pause/reduced motion, recorded workflow, wallet navigation, button contrast, four 3D views, share metadata passed.");
} finally {
  await browser.close();
}
