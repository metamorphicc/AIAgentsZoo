export function shouldRevokeForAccountsChange(sessionAddress: string | null, accounts: unknown): boolean {
  if (!sessionAddress || !Array.isArray(accounts)) return false;
  // Some providers emit an empty list while reinitializing; only a different
  // explicit account should end a signed-in guardian session.
  const nextAddress = accounts[0];
  return typeof nextAddress === "string" && nextAddress.toLowerCase() !== sessionAddress.toLowerCase();
}
