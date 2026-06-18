import { getActiveDomain } from "@/lib/session";
import { RepoDomainDashboard as RepoView } from "@/components/github/repo/views";
import { PageHeader } from "@/components/dashboard/page-header";
import { OrgOverview } from "@/components/github/org-overview";
import { GH_ORG } from "@/lib/api";

export default async function AdminAiOverview() {
  const activeDomain = await getActiveDomain();
  if (activeDomain !== "AI") return <RepoView domain={activeDomain} basePath="/admin/github" />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="AI Domain — GitHub Overview" description={`org @${GH_ORG.login} · platform-level view`} />
      <OrgOverview />
    </div>
  );
}
