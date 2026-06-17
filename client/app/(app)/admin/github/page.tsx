import { PageHeader } from "@/components/dashboard/page-header";
import { OrgOverview } from "@/components/github/org-overview";
import { GH_ORG } from "@/lib/api";

export default function AdminAiOverview() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="AI Domain — GitHub Overview" description={`org @${GH_ORG.login} · platform-level view`} />
      <OrgOverview />
    </div>
  );
}
