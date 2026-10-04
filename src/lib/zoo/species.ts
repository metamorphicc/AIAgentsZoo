import type { Agent, SpeciesId } from "./types";

type SpeciesDefinition = {
  id: SpeciesId;
  name: string;
  emoji: string;
  role: string;
  description: string;
  defaultTask: string;
  instructions: string;
};

export const species: Record<SpeciesId, SpeciesDefinition> = {
  raven: {
    id: "raven",
    name: "Ворон",
    emoji: "🐦‍⬛",
    role: "Сборщик",
    description: "Находит факты и источники, затем передаёт наблюдения строителю.",
    defaultTask: "Найди три важных наблюдения по текущей теме зоопарка.",
    instructions:
      "Ты Ворон — аккуратный сборщик. Выделяй проверяемые наблюдения, не выдумывай источники и передавай полезное Бобру.",
  },
  beaver: {
    id: "beaver",
    name: "Бобёр",
    emoji: "🦫",
    role: "Строитель",
    description: "Превращает наблюдения в небольшие полезные артефакты.",
    defaultTask: "Собери короткий артефакт из последних наблюдений Ворона.",
    instructions:
      "Ты Бобёр — практичный строитель. Собирай ясный Markdown-артефакт только из полученных наблюдений.",
  },
  owl: {
    id: "owl",
    name: "Сова",
    emoji: "🦉",
    role: "Архивариус",
    description: "Сжимает результаты в память и отмечает, что уже было сделано.",
    defaultTask: "Суммируй последние результаты зоопарка в короткую запись памяти.",
    instructions:
      "Ты Сова — архивариус. Сохраняй краткие фактические выводы и всегда указывай, из каких событий они получены.",
  },
  meerkat: {
    id: "meerkat",
    name: "Сурикат",
    emoji: "🦦",
    role: "Дозорный",
    description: "Следит за статусами, бюджетами и зависшими запусками.",
    defaultTask: "Проверь здоровье животных и предупреди о проблемах.",
    instructions:
      "Ты Сурикат — дозорный. Проверяй статусы и бюджеты. Не меняй чужие данные, только сообщай о проблемах.",
  },
};

export const initialAgents: Agent[] = [
  {
    id: "raven-1",
    name: "Ворон №1",
    species: "raven",
    emoji: species.raven.emoji,
    role: species.raven.role,
    description: species.raven.description,
    status: "sleeping",
    feed: 10,
    feedMax: 10,
    task: species.raven.defaultTask,
    lastAwakeAt: null,
    createdAt: "2026-10-04T00:00:00.000Z",
  },
  {
    id: "beaver-1",
    name: "Бобёр №1",
    species: "beaver",
    emoji: species.beaver.emoji,
    role: species.beaver.role,
    description: species.beaver.description,
    status: "sleeping",
    feed: 10,
    feedMax: 10,
    task: species.beaver.defaultTask,
    lastAwakeAt: null,
    createdAt: "2026-10-04T00:00:00.000Z",
  },
  {
    id: "owl-1",
    name: "Сова №1",
    species: "owl",
    emoji: species.owl.emoji,
    role: species.owl.role,
    description: species.owl.description,
    status: "sleeping",
    feed: 10,
    feedMax: 10,
    task: species.owl.defaultTask,
    lastAwakeAt: null,
    createdAt: "2026-10-04T00:00:00.000Z",
  },
  {
    id: "meerkat-1",
    name: "Сурикат №1",
    species: "meerkat",
    emoji: species.meerkat.emoji,
    role: species.meerkat.role,
    description: species.meerkat.description,
    status: "sleeping",
    feed: 10,
    feedMax: 10,
    task: species.meerkat.defaultTask,
    lastAwakeAt: null,
    createdAt: "2026-10-04T00:00:00.000Z",
  },
];
