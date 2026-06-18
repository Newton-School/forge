import { getActiveDomain } from "@/lib/session";
import { MentorPRs as RepoView } from "@/components/github/repo/views";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { PRList } from "@/components/github/pr-list";
import { DEMO, ghTeam, prsForRepo } from "@/lib/api";

export default async function MentorPulls() {
  const activeDomain = await getActiveDomain();
  if (activeDomain !== "AI") return <RepoView domain={activeDomain} />;

  const team = ghTeam(DEMO.teamId)!;
  const prs = prsForRepo(team.repoId);
  const open = prs.filter((p) => p.state === "open");
  const decided = prs.filter((p) => p.state !== "open");
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Pull Requests" description="Review queue — approve & merge the best PR, or reject with reasons" />
      <SectionCard title="Awaiting review" description={`${open.length} open`} bodyClassName="overflow-x-auto"><PRList prs={open} action="review" /></SectionCard>
      <SectionCard title="Decided" description={`${decided.length} merged or rejected`} bodyClassName="overflow-x-auto"><PRList prs={decided} action="review" /></SectionCard>
    </div>
  );
}
