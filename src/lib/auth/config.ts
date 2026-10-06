import { getAddress, isAddress } from "viem";

import type { AuthRole } from "@/lib/zoo/types";

export const sessionCookieName = "aiaz_session";
export const sessionDurationSeconds = 60 * 60 * 24 * 7;
export const challengeDurationMs = 5 * 60 * 1000;

export function normalizeAddress(address: string) {
  if (!isAddress(address)) throw new Error("INVALID_WALLET_ADDRESS");
  return getAddress(address);
}

export function roleForAddress(address: string): AuthRole {
  const admins = (process.env.ADMIN_WALLETS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(address.toLowerCase()) ? "admin" : "guardian";
}

export function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
