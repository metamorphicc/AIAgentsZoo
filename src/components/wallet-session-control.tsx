"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { InlineActivity } from "@/components/loading-states";
import { shortAddress } from "@/lib/auth/config";
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
  const [state, setState] = useState<"idle" | "connecting" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const provider = window.ethereum;
    if (!provider?.on) return;
    const clearStaleSession = async () => {
      if (session) await fetch("/api/auth/logout", { method: "POST" });
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

    setState("connecting");
    setMessage("Open your wallet and approve the sign-in message. No transaction will be sent.");
    try {
      const accounts = await provider.request({ method: "eth_requestAccounts" }) as string[];
      const address = accounts[0];
      if (!address) throw new Error("The wallet did not return an account.");
      const chainHex = await provider.request({ method: "eth_chainId" }) as string;
      const chainId = Number.parseInt(chainHex, 16);

      const challengeResponse = await fetch("/api/auth/challenge", {
        method: "POST",
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
      const verifyResponse = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, signature }),
      });
      const verified = await verifyResponse.json() as { error?: string };
      if (!verifyResponse.ok) throw new Error(verified.error ?? "The wallet signature was rejected.");

      setState("idle");
      setMessage("");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "The wallet could not be connected.");
    }
  }

  async function disconnect() {
    setState("connecting");
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
        <button className="wallet-identity" disabled={state === "connecting"} onClick={disconnect} type="button" title="Disconnect wallet session">
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
      <button className="wallet-connect" disabled={state === "connecting"} onClick={connect} type="button">
        {state === "connecting" ? <InlineActivity label="SIGNING IN" /> : "CONNECT WALLET"}
      </button>
      {message ? <p role={state === "error" ? "alert" : "status"}>{message}</p> : null}
    </div>
  );
}
