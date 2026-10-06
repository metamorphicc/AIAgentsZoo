import { createSiweMessage, generateSiweNonce, parseSiweMessage } from "viem/siwe";
import { verifyMessage, type Hex } from "viem";

import { consumeAuthNonce, getAuthNonce, saveAuthNonce } from "@/lib/zoo-store";

import { challengeDurationMs, normalizeAddress } from "./config";

export async function createWalletChallenge(input: {
  address: string;
  chainId: number;
  origin: string;
}) {
  const address = normalizeAddress(input.address);
  const url = new URL(input.origin);
  const nonce = generateSiweNonce();
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + challengeDurationMs);
  const message = createSiweMessage({
    address,
    chainId: input.chainId,
    domain: url.host,
    uri: url.origin,
    version: "1",
    nonce,
    issuedAt,
    expirationTime: expiresAt,
    statement: "Sign in to manage your own AI Agent Zoo enclosures. This request costs no gas.",
  });
  await saveAuthNonce({ address, nonce, message, expiresAt: expiresAt.toISOString() });
  return { address, message, expiresAt: expiresAt.toISOString() };
}

export async function verifyWalletChallenge(input: {
  address: string;
  signature: string;
  origin: string;
}) {
  const address = normalizeAddress(input.address);
  const challenge = await getAuthNonce(address);
  if (!challenge || new Date(challenge.expiresAt).getTime() <= Date.now()) {
    throw new Error("CHALLENGE_EXPIRED");
  }

  const parsed = parseSiweMessage(challenge.message);
  const url = new URL(input.origin);
  if (
    parsed.address?.toLowerCase() !== address.toLowerCase()
    || parsed.domain !== url.host
    || parsed.uri !== url.origin
    || parsed.nonce !== challenge.nonce
  ) {
    throw new Error("CHALLENGE_MISMATCH");
  }

  const valid = await verifyMessage({
    address,
    message: challenge.message,
    signature: input.signature as Hex,
  });
  if (!valid) throw new Error("INVALID_SIGNATURE");

  const consumed = await consumeAuthNonce(address, challenge.nonce);
  if (!consumed) throw new Error("CHALLENGE_REPLAYED");
  return address;
}
