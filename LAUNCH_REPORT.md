# Launch readiness — 8 October 2026

Security decision: **Pass after fixes** for the locally verified release. The fixes below are implemented; production deployment and its environment still require verification.

Risk level: **Medium**. Wallet-authenticated public publishing remains an abuse surface, but ownership checks, persistent quotas, moderation, and runtime ceilings now bound it. This is not a penetration-test certification.

## Product scope

Next.js on Vercel, durable Turso storage, off-chain wallet sessions. No payments, token transfers, or user-uploaded executable code. The release requires no Grok API key: Grok is a head profile, while local species perform ledger-based work. Visitor animation explains the workflow; it does not insert fabricated activity into the public trace.

## Threat model and completed fixes

The assets are guardian-owned habitats, session identity, public records, storage capacity, and execution budget. The principal risks are cross-wallet mutations, repeated requests, publication spam, and unbounded runtime costs. All mutation permissions and allowances are enforced on the server.

- **Authorization / OWASP A01:** enclosure, animal, and operator ownership is checked server-side. Keepers alone moderate public directories and operate the global runtime switch. Hidden habitats and their outputs are excluded from public reads.
- **Resource exhaustion / OWASP A04:** persistent wallet/network/global rate limits, atomic creation quotas, bounded JSON bodies, and hourly/daily execution caps. Refill does not reset a runtime allowance. Paid model calls are optional and separately time/output bounded.
- **Integrity / OWASP A04:** enclosure run locks and unique request IDs prevent overlapping/replayed pipelines. Cycles use their own enclosure context and actual source-event references. Stale locks recover without deleting user records.
- **Input/privacy hardening:** registered endpoint URLs reject embedded credentials, query strings, fragments, and non-HTTP protocols; legacy unsafe values are not published. Public errors omit internal exception details.
- **Session hardening:** global sign-in throttling supplements network limits; expired wallet challenges are pruned. Signature verification and ownership remain independent of browser state.
- **Availability and presentation:** working procedural animal animations replace static imported clips; reduced motion is honored; failed/unavailable WebGL displays a still specimen rather than an endless loader.

## Verification

- 24 automated tests passed; lint and production build passed.
- Production dependency audit reported zero vulnerabilities at verification time.
- Isolated production-server browser/API checks passed: signature sign-in, cross-wallet rejection, quotas, streamed runs, replay rejection, pause/resume, hide/restore, wallet navigation, desktop/mobile layouts, button contrast, and social metadata.
- Rendered frames changed for all four animals, returned to Idle, and started another action without a click. No browser page errors occurred in those checks.
- Tests used local/in-memory databases, not the production Turso database.

## Release order and coverage gaps

1. **Before announcement:** back up production Turso; publish this branch through the intended Vercel Production branch; confirm durable storage and keeper access; hide test entries and run the founding habitat once. Follow `DEPLOYMENT.md`.
2. **First week:** review public-directory abuse and runtime caps, inspect Vercel/Turso usage, and verify backup recovery.
3. **Later:** stricter CSP nonce handling, stronger anti-Sybil enrollment, and real model scheduling if autonomous external inference becomes part of the product promise.

Production secrets, Vercel account settings, backup configuration, traffic/load behavior, and physical mobile-wallet deep links were not verified by the isolated test suite. Existing production data was not modified. No release commit was pushed or deployed by this task.
