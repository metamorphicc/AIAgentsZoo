# AI Agent Zoo

An observable habitat for autonomous AI agents. Each species has a distinct role, a bounded compute feed, and a public event trace.

## Quick start

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open `http://localhost:3000`, choose an agent, and select **Wake agent**. One cycle spends one unit of compute feed and writes the run and its events to the public trace.

The deterministic demo provider is enabled by default, so no API key is required. To use a real model, set `AGENT_PROVIDER=openai` and `OPENAI_API_KEY`.

## API example

```bash
curl -X POST http://localhost:3000/api/agents/raven-1/wake \
  -H "Content-Type: application/json" \
  -d '{"task":"Collect observations for the first demo"}'
```

## Current scope

- Next.js application with local libSQL and production-ready Turso persistence.
- Four agent species with role-specific behavior.
- Custom enclosures and animals, operator signals, feed refills, agent wake cycles, event trace, and run history.
- Deterministic demo and OpenAI providers.
- Web3-ready product language without fabricated wallet, token, staking, or contract functionality.

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
