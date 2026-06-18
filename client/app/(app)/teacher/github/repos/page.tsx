import { getActiveDomain } from "@/lib/session";
import { RepoTeamsList as RepoView } from "@/components/github/repo/views";
import { PageHeader } from "@/components/dashboard/page-header";
import { RepoCard } from "@/components/github/repo-card";
import { GH_REPOS } from "@/lib/api";

export default async function TeacherRepos() {
  const activeDomain = await getActiveDomain();
  if (activeDomain !== "AI") return <RepoView domain={activeDomain} basePath="/teacher/github" />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Repositories" description="Every team repo in the AI org — the portal surfaces, it doesn't duplicate" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {GH_REPOS.map((r) => <RepoCard key={r.id} repo={r} />)}
      </div>
    </div>
  );
}
