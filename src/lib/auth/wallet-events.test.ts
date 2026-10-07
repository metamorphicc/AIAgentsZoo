import { describe, expect, it } from "vitest";

import { shouldRevokeForAccountsChange } from "./wallet-events";

describe("wallet account events", () => {
  const current = "0x00000000000000000000000000000000000000Aa";

  it("keeps a session when a wallet re-announces the same account", () => {
    expect(shouldRevokeForAccountsChange(current, [current.toLowerCase()])).toBe(false);
    expect(shouldRevokeForAccountsChange(current, undefined)).toBe(false);
    expect(shouldRevokeForAccountsChange(null, [])).toBe(false);
    expect(shouldRevokeForAccountsChange(current, [])).toBe(false);
  });

  it("revokes only when the wallet switches to a different account", () => {
    expect(shouldRevokeForAccountsChange(current, ["0x00000000000000000000000000000000000000Bb"])).toBe(true);
  });
});
