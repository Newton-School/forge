import { getActiveDomain } from "@/lib/session";
import { RepoDomainDashboard as RepoView } from "@/components/github/repo/views";
import { PageHeader } from "@/components/dashboard/page-header";
import { OrgOverview } from "@/components/github/org-overview";
import { GH_ORG } from "@/lib/api";

export default async function LccAiOverview() {
  const activeDomain = await getActiveDomain();
  if (activeDomain !== "AI") return <RepoView domain={activeDomain} basePath="/lcc/github" />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="AI Domain — GitHub Overview" description={`org @${GH_ORG.login} · cross-team analytics for the LCC`} />
      <OrgOverview />
    </div>
  );
}
