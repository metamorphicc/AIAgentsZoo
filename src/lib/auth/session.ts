import { createHash, randomBytes } from "node:crypto";

import { cookies } from "next/headers";

import { createAuthSession, deleteAuthSession, getAuthSession } from "@/lib/zoo-store";
import type { AuthSession } from "@/lib/zoo/types";

import { roleForAddress, sessionCookieName, sessionDurationSeconds } from "./config";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function getSession(): Promise<AuthSession | null> {
  const token = (await cookies()).get(sessionCookieName)?.value;
  if (!token) return null;
  return getAuthSession(hashToken(token));
}

export async function issueSession(address: string): Promise<AuthSession> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionDurationSeconds * 1000).toISOString();
  const session = await createAuthSession({
    tokenHash: hashToken(token),
    address,
    role: roleForAddress(address),
    expiresAt,
  });

  (await cookies()).set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionDurationSeconds,
    priority: "high",
  });

  return session;
}

export async function revokeCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  if (token) await deleteAuthSession(hashToken(token));
  cookieStore.delete(sessionCookieName);
}

export async function requireSession(): Promise<AuthSession> {
  const session = await getSession();
  if (!session) throw new Error("AUTH_REQUIRED");
  return session;
}

export function authRequiredResponse() {
  return Response.json(
    { error: "Connect and sign with your wallet before changing the habitat." },
    { status: 401 },
  );
}

export function forbiddenResponse() {
  return Response.json(
    { error: "This wallet does not own the requested habitat resource." },
    { status: 403 },
  );
}
