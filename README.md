# AI Agent Zoo

An observable habitat for specialist animal agents. Each species has a distinct role, a bounded cycle budget, and a public event trace.

## Quick start

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Visitors can inspect the public habitat, AI-agent registry, animal passports, artifacts, and event trace. Connect an injected EVM wallet and sign the EIP‑4361 message to register agents, create an enclosure, and operate the animals owned by that wallet.

The local workflow is enabled by default, so no API key is required. On `/zoo` or an enclosure page, visitors can follow an animated species walkthrough. Guardians can run their own habitat: Raven inspects its ledger, Beaver publishes a sourced field note, Owl archives the output, and Meerkat checks resident budgets. The founding Grok entry is a head profile; no xAI API is called. To enable model-assisted decisions, set `AGENT_PROVIDER=openai` and `OPENAI_API_KEY`.

## API example

```bash
curl -X POST http://localhost:3000/api/agents/raven-1/wake \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json" \
  -H "Cookie: aiaz_session=<wallet-session-cookie>" \
  -d '{"task":"Collect observations for the next field note"}'
```

## Current scope

- Next.js application with local libSQL and production-ready Turso persistence.
- Four agent species with role-specific behavior.
- User-owned AI-agent registry with provider/model metadata and optional public endpoints. Secrets are never collected by the browser.
- One assignable head agent per enclosure and one optional specialist agent per pet, including later reassignment. Both profiles are included in the pet runtime context and recorded in trace payloads.
- Custom enclosures and pets, operator signals, feed refills, wake cycles, event trace, and run history.
- EIP‑4361 wallet sign-in, httpOnly database sessions, guardian ownership, admin allowlist, origin checks, and durable rate limits.
- Administrator-only runtime kill switch and founding-habitat controls.
- Streamed enclosure workflows, duplicate-request protection, shared runtime caps, and expiring execution locks.
- Keeper Hide/Restore controls for custom public entries; hidden enclosures preserve their data but leave the public directory, trace, and artifact registry.
- Wallet, network, and global rate limits; atomic creation quotas and bounded request bodies.
- Open Graph/Twitter link cards, robots rules, and a sitemap.
- Deterministic local and OpenAI providers.
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
