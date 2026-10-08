export const launchLimits = {
  enclosuresPerWallet: 3,
  animalsPerWallet: 12,
  animalsPerEnclosure: 8,
  controlAgentsPerWallet: 5,
  enclosuresTotal: 100,
  animalsTotal: 500,
  controlAgentsTotal: 200,
} as const;

export function cycleLimit(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isSafeInteger(value) && value > 0 ? Math.min(value, 10_000) : fallback;
}

export const quotaError = "The habitat limit has been reached. Manage your existing residents before adding more.";
