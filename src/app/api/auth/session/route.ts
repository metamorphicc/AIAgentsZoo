import { getSession } from "@/lib/auth/session";

export async function GET() {
  return Response.json({ session: await getSession() }, {
    headers: { "Cache-Control": "no-store" },
  });
}
