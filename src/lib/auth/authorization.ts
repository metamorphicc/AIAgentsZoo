import type { AuthSession } from "@/lib/zoo/types";

export function canManageResource(session: AuthSession | null, ownerAddress: string | null) {
  if (!session) return false;
  if (session.role === "admin") return true;
  return Boolean(ownerAddress && ownerAddress.toLowerCase() === session.address.toLowerCase());
}
