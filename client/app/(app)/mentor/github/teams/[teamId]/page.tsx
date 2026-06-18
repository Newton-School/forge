import { RepoTeamOverview } from "@/components/github/repo/views";

export default async function Page({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  return <RepoTeamOverview teamId={teamId} basePath="/mentor/github" />;
}
