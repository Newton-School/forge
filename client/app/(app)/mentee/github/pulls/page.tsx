import { getActiveDomain } from "@/lib/session";
import { MenteePRs as RepoView } from "@/components/github/repo/views";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { PRList } from "@/components/github/pr-list";
import { DEMO, GH_PRS, personName } from "@/lib/api";

export default async function MenteePulls() {
  const activeDomain = await getActiveDomain();
  if (activeDomain !== "AI") return <RepoView domain={activeDomain} />;

  const mine = GH_PRS.filter((p) => p.authorId === DEMO.menteeId);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="My Pull Requests" description={`${personName(DEMO.menteeId)} · merged, open and rejected — with mentor reasons`} />
      <SectionCard title="Pull requests" description={`${mine.length} total`} bodyClassName="overflow-x-auto">
        <PRList prs={mine} />
      </SectionCard>
    </div>
  );
}
