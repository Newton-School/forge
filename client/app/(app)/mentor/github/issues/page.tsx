import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { IssueList } from "@/components/github/issue-list";
import { DEMO, ghTeam, issuesForRepo } from "@/lib/api";

export default function MentorIssues() {
  const team = ghTeam(DEMO.teamId)!;
  const issues = issuesForRepo(team.repoId);
  const open = issues.filter((i) => i.state === "open");
  const closed = issues.filter((i) => i.state === "closed");
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Issues" description={`${team.name} · issues are the unit of work`} />
      <SectionCard title="Open" description={`${open.length} open`} bodyClassName="overflow-x-auto"><IssueList issues={open} /></SectionCard>
      <SectionCard title="Closed" description={`${closed.length} closed`} bodyClassName="overflow-x-auto"><IssueList issues={closed} /></SectionCard>
    </div>
  );
}
