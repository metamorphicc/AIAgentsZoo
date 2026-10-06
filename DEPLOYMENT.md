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
- Confirm the guardian cannot wake, refill, or signal with another wallet’s animals.
- Connect an address listed in `ADMIN_WALLETS` and verify the runtime pause/resume control on `/manage`.
- Wake one animal and confirm feed decreases by one and the Trace gets new records.
- Refill it and confirm the refill appears in the Trace.
- Check the site at 375 px and desktop width.

Wallet identity and guardian ownership are implemented off-chain. Token, staking, federation, agent-native keys, and on-chain reputation remain intentionally unimplemented. The deployed product does not pretend otherwise.
