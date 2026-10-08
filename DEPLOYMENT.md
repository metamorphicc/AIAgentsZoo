# Deploy AI Agent Zoo to Vercel

The app is ready for a custom domain, but production needs durable database credentials before real users create animals or enclosures.

## 1. Verify locally

```powershell
npm install
Copy-Item .env.example .env.local
npm run typecheck
npm run lint
npm test
npm run build
```

## 2. Connect durable storage

The local `DATABASE_PATH` is suitable only for development. Vercel Functions have an ephemeral writable `/tmp` directory, so a file database there does not preserve product state reliably.

Recommended path:

1. Open the Vercel project.
2. Go to **Storage** or **Marketplace** and install **Turso Cloud** for this project.
3. Create or select a database in the region closest to the deployment.
4. Confirm these Production and Preview environment variables exist:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `ADMIN_WALLETS` — comma-separated EVM addresses allowed to operate the founding habitat and global runtime switch
   - `RATE_LIMIT_SALT` — a production-only random value, for example from `openssl rand -hex 32`
5. Leave `DATABASE_PATH` unset in Vercel.
6. Redeploy. The app creates its tables and founding habitat automatically.
7. Open `/api/health`. Production is correctly configured when it returns `"storage":"turso"` and `"durable":true`.

Optional model variables:

- `AGENT_PROVIDER=openai`
- `OPENAI_API_KEY=<secret>`
- `OPENAI_MODEL=gpt-6-luna`

Without them, the deterministic provider remains enabled and the product still works without paid model calls.

For the launch without a model API, set `AGENT_PROVIDER=local`. Existing `demo` values also fall back to the local workflow. The local species inspect enclosure records, route actual events, publish sourced field notes, archive outputs, and check resident budgets. The Grok entry is the founding head profile; it does not call the xAI API.

Runtime ceilings (optional; these are the defaults):

- `RUNTIME_DAILY_CYCLE_LIMIT=500`
- `RUNTIME_HOURLY_CYCLE_LIMIT=100`
- `ENCLOSURE_DAILY_CYCLE_LIMIT=120`

Daily and hourly windows use UTC. Failed starts that reached execution also count. Refilling feed never resets a runtime allowance. For model-assisted operation, lower these limits before enabling paid calls.

## 3. Deploy

Import the GitHub repository in Vercel or connect the existing Vercel project to the branch you want to release. Vercel should detect **Next.js** automatically. Use the defaults:

- Install command: `npm install`
- Build command: `npm run build`
- Output: Next.js default

Do not expose `.env.local` or paste secrets into repository files.

## 4. Attach the domain

1. In Vercel open **Project → Settings → Domains**.
2. Add the apex domain, for example `aiagentzoo.com`.
3. Add `www.aiagentzoo.com` too and choose which hostname redirects to the other.
4. At the DNS provider, create exactly the A/AAAA/CNAME records Vercel shows for that domain. Do not copy values from another project.
5. Wait for Vercel to verify DNS. TLS/SSL is provisioned automatically after verification.

CLI equivalent, if the Vercel CLI is already authenticated:

```bash
vercel domains add aiagentzoo.com <project-name>
vercel domains inspect aiagentzoo.com
```

## 5. Release check

- `/` loads the public landing page.
- `/zoo` loads the operator dashboard.
- `/api/health` reports Turso and durable state.
- Public visitors can browse `/zoo`, `/animals`, `/trace`, and `/artifacts` without mutation controls.
- Connect a non-admin wallet, sign the EIP‑4361 message, create an enclosure and animal, reload, and confirm both persist.
- Register an AI agent, appoint it as an enclosure head, assign it to a pet, reload, and confirm the hierarchy persists.
- Confirm the guardian cannot wake, refill, or signal with another wallet’s animals.
- Connect an address listed in `ADMIN_WALLETS` and verify the runtime pause/resume control on `/manage`.
- Wake one animal and confirm feed decreases by one and the Trace gets new records.
- Open an owned enclosure, enter a mission, and press **Run Habitat**. The stream should show one cycle per available species (at most four), a Beaver field note, and an Owl memory record when those species are present.
- Repeat the same run request ID and confirm it is rejected without spending feed again.
- Refill it and confirm the refill appears in the Trace.
- In the admin console, hide test enclosures and unused profiles with **Public directory → Hide**. This preserves their data and can be reversed with **Restore**. Hidden enclosure residents, traces, and artifacts disappear from public pages.
- Confirm `/opengraph-image`, `/robots.txt`, and `/sitemap.xml` return 200, and the landing HTML includes Open Graph and Twitter card tags.
- Check the site at 375 px and desktop width.

Wallet identity and guardian ownership are implemented off-chain. Token, staking, federation, agent-native keys, and on-chain reputation remain intentionally unimplemented. The deployed product does not pretend otherwise.

## 6. Publish this release

The release changes are on `feature/grok-orchestrator`. If Vercel Production tracks `main`, merge the branch into `main` before pushing, or deliberately choose the release branch in Vercel. A preview deployment does not update `agentzoo.tech`.

After the production deployment, open `/zoo` and check that **Follow the habitat** is present. Verify refill buttons have black text, connect your keeper wallet, hide your test entries, and run Habitat 01 once to create a current field note and memory record. Keep a Turso backup before moderating production data.

## Isolated browser verification

`npm test` uses an in-memory libSQL database and does not touch `.env` storage. The optional `scripts/launch-smoke.mjs` also verifies sign-in, cross-wallet permissions, quotas, streamed runs, replay protection, moderation, four animated models, mobile layouts, reduced motion, and share metadata. It is pinned to `http://localhost:3038` and creates test records there; never point it at production.

Start the built app with isolated storage and the public test account (never use that address for real funds):

```powershell
$env:TURSO_DATABASE_URL='file:C:/Temp/agentzoo-release-check.db'
$env:TURSO_AUTH_TOKEN=''
$env:AGENT_PROVIDER='local'
$env:ADMIN_WALLETS='0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf'
npm start -- --port 3038
```

The smoke script requires Playwright and installed Google Chrome. With Playwright available, run `node scripts/launch-smoke.mjs`; alternatively set `ZOO_TEST_PLAYWRIGHT_MODULE` to its `index.mjs` path. Stop the test server before removing the isolated database.
