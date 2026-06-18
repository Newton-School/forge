import { getActiveDomain } from "@/lib/session";
import { MenteeMilestones as RepoView } from "@/components/github/repo/views";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { MilestoneBar } from "@/components/github/milestone-bar";
import { DEMO, ghTeam, ghRepo, milestonesForRepo } from "@/lib/api";

export default async function MenteeMilestones() {
  const activeDomain = await getActiveDomain();
  if (activeDomain !== "AI") return <RepoView domain={activeDomain} />;

  const team = ghTeam(DEMO.teamId)!;
  const repo = ghRepo(team.repoId)!;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Milestones" description={`${repo.name} — milestones advance as PRs merge`} />
      <SectionCard title="Project milestones" bodyClassName="divide-y divide-border">
        {milestonesForRepo(repo.id).map((m) => <MilestoneBar key={m.id} milestone={m} />)}
      </SectionCard>
    </div>
  );
}
