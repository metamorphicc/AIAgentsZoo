import { afterEach, describe, expect, it } from "vitest";

import { canManageResource } from "./authorization";
import { normalizeAddress, roleForAddress } from "./config";
import { isSameOrigin, requestFingerprint } from "./request";

const guardian = {
  address: "0x0000000000000000000000000000000000000001",
  role: "guardian" as const,
  expiresAt: "2099-01-01T00:00:00.000Z",
};

afterEach(() => {
  delete process.env.ADMIN_WALLETS;
  delete process.env.RATE_LIMIT_SALT;
});

describe("wallet authorization", () => {
  it("allows guardians to manage only matching resources", () => {
    expect(canManageResource(guardian, guardian.address.toUpperCase())).toBe(true);
    expect(canManageResource(guardian, "0x0000000000000000000000000000000000000002")).toBe(false);
    expect(canManageResource(guardian, null)).toBe(false);
    expect(canManageResource(null, guardian.address)).toBe(false);
  });

  it("allows administrators to manage system resources", () => {
    expect(canManageResource({ ...guardian, role: "admin" }, null)).toBe(true);
  });

  it("normalizes valid EVM addresses and reads the admin allowlist", () => {
    process.env.ADMIN_WALLETS = guardian.address.toUpperCase();
    expect(normalizeAddress(guardian.address)).toBe(guardian.address);
    expect(roleForAddress(guardian.address)).toBe("admin");
    expect(() => normalizeAddress("not-a-wallet")).toThrow("INVALID_WALLET_ADDRESS");
  });
});

describe("request boundary", () => {
  it("accepts the exact request origin and rejects missing or foreign origins", () => {
    expect(isSameOrigin(new Request("https://zoo.test/api/action", { headers: { origin: "https://zoo.test" } }))).toBe(true);
    expect(isSameOrigin(new Request("https://zoo.test/api/action", { headers: { origin: "https://attacker.test" } }))).toBe(false);
    expect(isSameOrigin(new Request("https://zoo.test/api/action"))).toBe(false);
  });

  it("hashes the client address before using it as a rate key", () => {
    process.env.RATE_LIMIT_SALT = "test-salt";
    const request = new Request("https://zoo.test", { headers: { "x-forwarded-for": "203.0.113.2" } });
    const fingerprint = requestFingerprint(request);
    expect(fingerprint).toHaveLength(32);
    expect(fingerprint).not.toContain("203.0.113.2");
    expect(requestFingerprint(request)).toBe(fingerprint);
  });
});
