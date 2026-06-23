import { getActiveDomain, getOrgAnalytics } from "@/lib/session";
import { RepoDomainDashboard as RepoView } from "@/components/github/repo/views";
import { PageHeader } from "@/components/dashboard/page-header";
import { OrgOverview } from "@/components/github/org-overview";
import { OrgOverviewLive } from "@/components/github/org-overview-live";
import { GH_ORG } from "@/lib/api";

export default async function AdminAiOverview() {
  const activeDomain = await getActiveDomain();
  if (activeDomain !== "AI") return <RepoView domain={activeDomain} basePath="/admin/github" />;

  // Production: real org analytics from the configured GitHub org. Presentation/offline: mock.
  const org = await getOrgAnalytics();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="AI Domain — GitHub Overview"
        description={`org @${org?.login ?? GH_ORG.login} · platform-level view`}
      />
      {org && org.repos > 0 ? <OrgOverviewLive data={org} /> : <OrgOverview />}
    </div>
  );
}
