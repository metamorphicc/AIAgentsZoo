"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { InlineActivity } from "@/components/loading-states";
import { shortAddress } from "@/lib/auth/config";
import { shouldRevokeForAccountsChange } from "@/lib/auth/wallet-events";
import type { AuthSession } from "@/lib/zoo/types";

type EthereumProvider = {
  request(input: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: "accountsChanged" | "chainChanged", listener: (...args: unknown[]) => void): void;
  removeListener?(event: "accountsChanged" | "chainChanged", listener: (...args: unknown[]) => void): void;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export function WalletSessionControl({ session, compact = false }: {
  session: AuthSession | null;
  compact?: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "requesting" | "signing" | "verifying" | "connected" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const provider = window.ethereum;
    if (!provider?.on) return;
    const clearStaleSession = async (accounts: unknown) => {
      if (!shouldRevokeForAccountsChange(session?.address ?? null, accounts)) return;
      await fetch("/api/auth/logout", { method: "POST" });
      router.refresh();
    };
    const refresh = () => router.refresh();
    provider.on("accountsChanged", clearStaleSession);
    provider.on("chainChanged", refresh);
    return () => {
      provider.removeListener?.("accountsChanged", clearStaleSession);
      provider.removeListener?.("chainChanged", refresh);
    };
  }, [router, session]);

  async function connect() {
    const provider = window.ethereum;
    if (!provider) {
      setState("error");
      setMessage("No EVM wallet was detected. Install a browser wallet, then try again.");
      return;
    }

    setState("requesting");
    setMessage("Checking habitat storage…");
    try {
      const healthResponse = await fetch("/api/health", { cache: "no-store" });
      const health = await healthResponse.json() as { durable?: boolean; error?: string };
      if (!healthResponse.ok || !health.durable) {
        throw new Error(health.error ?? "Wallet sign-in is temporarily unavailable: this deployment has no durable database. Configure TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Vercel, then redeploy.");
      }

      setMessage("Waiting for wallet access…");
      const accounts = await provider.request({ method: "eth_requestAccounts" }) as string[];
      const address = accounts[0];
      if (!address) throw new Error("The wallet did not return an account.");
      const chainHex = await provider.request({ method: "eth_chainId" }) as string;
      const chainId = Number.parseInt(chainHex, 16);

      setState("signing");
      setMessage("Approve the sign-in message in your wallet. No transaction or gas is required.");
      const challengeResponse = await fetch("/api/auth/challenge", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, chainId }),
      });
      const challenge = await challengeResponse.json() as { message?: string; error?: string };
      if (!challengeResponse.ok || !challenge.message) {
        throw new Error(challenge.error ?? "The sign-in request could not be created.");
      }

      const signature = await provider.request({
        method: "personal_sign",
        params: [challenge.message, address],
      }) as string;
      setState("verifying");
      setMessage("Verifying the signature and opening your guardian session…");
      const verifyResponse = await fetch("/api/auth/verify", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, signature }),
      });
      const verified = await verifyResponse.json() as { error?: string; session?: AuthSession };
      if (!verifyResponse.ok) throw new Error(verified.error ?? "The wallet signature was rejected.");

      const sessionResponse = await fetch("/api/auth/session", {
        cache: "no-store",
        credentials: "same-origin",
        headers: { "Cache-Control": "no-cache" },
      });
      const confirmed = await sessionResponse.json() as { session?: AuthSession | null };
      if (!sessionResponse.ok || !confirmed.session || confirmed.session.address.toLowerCase() !== address.toLowerCase()) {
        throw new Error("The signature was accepted, but the session was not persisted. Check the production database connection and try again.");
      }

      setState("connected");
      setMessage(`Connected as ${shortAddress(confirmed.session.address)}.`);
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "The wallet could not be connected.");
    }
  }

  async function disconnect() {
    setState("verifying");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("The local session could not be closed.");
      setState("idle");
      setMessage("");
      router.refresh();
    } catch {
      setState("error");
      setMessage("The local session could not be closed. Reload the page and try again.");
    }
  }

  if (session) {
    return (
      <div className={`wallet-control${compact ? " wallet-control--compact" : ""}`} data-state={state}>
        <button className="wallet-identity" disabled={state === "verifying"} onClick={disconnect} type="button" title="Disconnect wallet session">
          <i aria-hidden="true" />
          <span>{shortAddress(session.address)}</span>
          <small>{session.role}</small>
        </button>
        {message ? <p role="alert">{message}</p> : null}
      </div>
    );
  }

  return (
    <div className={`wallet-control${compact ? " wallet-control--compact" : ""}`} data-state={state}>
      <button className="wallet-connect" disabled={["requesting", "signing", "verifying"].includes(state)} onClick={connect} type="button">
        {state === "requesting" ? <InlineActivity label="OPENING WALLET" /> : state === "signing" ? <InlineActivity label="AWAITING SIGNATURE" /> : state === "verifying" ? <InlineActivity label="VERIFYING" /> : state === "connected" ? "CONNECTED" : "CONNECT WALLET"}
      </button>
      {message ? <p role={state === "error" ? "alert" : "status"}>{message}</p> : null}
    </div>
  );
}
