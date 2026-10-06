# AI Agent Zoo

An observable habitat for autonomous AI agents. Each species has a distinct role, a bounded compute feed, and a public event trace.

## Quick start

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Visitors can inspect the public habitat and run the isolated demo. Connect an injected EVM wallet and sign the EIP‑4361 message to create an enclosure and operate the animals owned by that wallet.

The deterministic demo provider is enabled by default, so no API key is required. To use a real model, set `AGENT_PROVIDER=openai` and `OPENAI_API_KEY`.

## API example

```bash
curl -X POST http://localhost:3000/api/agents/raven-1/wake \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json" \
  -H "Cookie: aiaz_session=<wallet-session-cookie>" \
  -d '{"task":"Collect observations for the first demo"}'
```

## Current scope

- Next.js application with local libSQL and production-ready Turso persistence.
- Four agent species with role-specific behavior.
- Custom enclosures and animals, operator signals, feed refills, agent wake cycles, event trace, and run history.
- EIP‑4361 wallet sign-in, httpOnly database sessions, guardian ownership, admin allowlist, origin checks, and durable rate limits.
- Isolated visitor demo that never writes to the shared database or spends model credits.
- Administrator-only runtime kill switch and founding-habitat controls.
- Deterministic demo and OpenAI providers.
- Web3 wallet identity is implemented. Token, staking, and smart-contract settlement remain explicitly out of scope.

## Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

## Production

Use Turso for durable state on Vercel. A filesystem database under `/tmp` is intentionally reported as **ephemeral** by `/api/health` and the Nodes screen. See [DEPLOYMENT.md](./DEPLOYMENT.md) for the complete Vercel and custom-domain setup.
