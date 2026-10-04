import { agentDecisionSchema, type AgentDecision } from "../decision";
import type { Agent, ZooEvent } from "../types";

type DemoContext = {
  agent: Agent;
  task: string;
  recentEvents: ZooEvent[];
};

export function createDemoDecision({ agent, task, recentEvents }: DemoContext): AgentDecision {
  const recentCount = recentEvents.length;

  const decisions: Record<Agent["species"], AgentDecision> = {
    raven: {
      summary: "Собрал наблюдения и передал полезный сигнал Бобру.",
      events: [
        {
          type: "observation",
          summary: `Зафиксирована задача Ворона: ${task}`,
          targetAgentId: null,
          details: ["Это демонстрационное наблюдение без внешнего поиска."],
        },
        {
          type: "sighting",
          summary: "Для MVP достаточно публичного журнала, ограниченного корма и одного рабочего цикла.",
          targetAgentId: "beaver-1",
          details: ["Сигнал отправлен Бобру как вход для будущего артефакта."],
        },
      ],
    },
    beaver: {
      summary: "Проверил входящие события и подготовил план небольшого артефакта.",
      events: [
        {
          type: "observation",
          summary: `Бобёр видит ${recentCount} последних событий в общем журнале.`,
          targetAgentId: null,
          details: ["Создание артефакта будет следующим расширением цикла."],
        },
      ],
    },
    owl: {
      summary: "Сжал текущее состояние зоопарка в короткую запись памяти.",
      events: [
        {
          type: "observation",
          summary: `В памяти учтено ${recentCount} последних событий; текущая задача: ${task}`,
          targetAgentId: null,
          details: ["Запись построена только из локального журнала."],
        },
      ],
    },
    meerkat: {
      summary: "Проверил состояние зоопарка и завершил дозор.",
      events: [
        {
          type: "observation",
          summary: `Сурикат проверил журнал из ${recentCount} событий.`,
          targetAgentId: null,
          details: ["Критических проблем в демонстрационном цикле не обнаружено."],
        },
      ],
    },
  };

  return agentDecisionSchema.parse(decisions[agent.species]);
}
