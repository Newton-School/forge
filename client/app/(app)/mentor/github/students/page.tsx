import { getActiveDomain } from "@/lib/session";
import { MentorTeamStudents as RepoView } from "@/components/github/repo/views";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StudentTable } from "@/components/github/student-table";
import { DEMO, ghTeam, studentsOfTeam } from "@/lib/api";

export default async function MentorStudents() {
  const activeDomain = await getActiveDomain();
  if (activeDomain !== "AI") return <RepoView domain={activeDomain} basePath="/mentor/github" />;

  const team = ghTeam(DEMO.teamId)!;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Student Performance" description={`${team.name} contributors — throughput and learning evaluation`} />
      <SectionCard title="My students" description={`${team.studentIds.length} on the team`} bodyClassName="overflow-x-auto">
        <StudentTable students={studentsOfTeam(team.id)} showTeam={false} />
      </SectionCard>
    </div>
  );
}
