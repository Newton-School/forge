import { RepoRepositoryDetail } from "@/components/github/repo/views";

export default async function Page({ params }: { params: Promise<{ teamId: string; repo: string }> }) {
  const { teamId, repo } = await params;
  return <RepoRepositoryDetail teamId={teamId} repoName={repo} basePath="/admin/github" />;
}
