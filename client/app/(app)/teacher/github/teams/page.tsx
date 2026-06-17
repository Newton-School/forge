import { PageHeader } from "@/components/dashboard/page-header";
import { TeamCompare } from "@/components/github/team-compare";
import { allTeamAnalytics } from "@/lib/api";

export default function TeacherTeamComparison() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Team Comparison" description="Team A vs B vs C — activity, throughput and milestone progress" />
      <TeamCompare teams={allTeamAnalytics()} />
    </div>
  );
}
