import { redirect } from "next/navigation";

type AgentPageProps = { params: Promise<{ id: string }> };

export default async function AgentPage({ params }: AgentPageProps) {
  const { id } = await params;
  redirect(`/agents/${id}`);
}
