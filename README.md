# AI Agent Zoo

Минимальный прототип наблюдаемого зоопарка AI-агентов. Животные имеют разные роли, просыпаются по задаче, оставляют события в журнале и могут передавать работу друг другу.

## Быстрый старт

```bash
pnpm install
Copy-Item .env.example .env.local
pnpm dev
```

По умолчанию используется детерминированный demo provider, поэтому API-ключ не нужен. Для настоящего вызова модели укажите `AGENT_PROVIDER=openai` и `OPENAI_API_KEY`.

## Команды

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
