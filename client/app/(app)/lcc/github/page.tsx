import { PageHeader } from "@/components/dashboard/page-header";
import { OrgOverview } from "@/components/github/org-overview";
import { GH_ORG } from "@/lib/api";

export default function LccAiOverview() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="AI Domain — GitHub Overview" description={`org @${GH_ORG.login} · cross-team analytics for the LCC`} />
      <OrgOverview />
    </div>
  );
}
