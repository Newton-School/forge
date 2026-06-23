import { getActiveDomain, getOrgContributors } from "@/lib/session";
import { RepoDomainStudents as RepoView } from "@/components/github/repo/views";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StudentTable } from "@/components/github/student-table";
import { OrgStudentsLive } from "@/components/github/org-students-live";
import { GH_TEAMS, studentAnalytics } from "@/lib/api";

export default async function TeacherStudentContributions() {
  const activeDomain = await getActiveDomain();
  if (activeDomain !== "AI") return <RepoView domain={activeDomain} basePath="/teacher/github" />;

  // Production: real per-contributor leaderboard. Presentation/offline/empty: mock below.
  const live = await getOrgContributors();
  if (live && live.length > 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Student Contributions" description="Every contributor across the AI org — live commits, PRs and issues" />
        <SectionCard title="Contributors" description={`${live.length} contributors`} bodyClassName="p-0">
          <OrgStudentsLive rows={live} />
        </SectionCard>
      </div>
    );
  }

  const students = GH_TEAMS.flatMap((t) => t.studentIds).map(studentAnalytics);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Student Contributions" description="Every contributor across the AI domain — throughput and learning evaluation" />
      <SectionCard title="Students" description={`${students.length} contributors`} bodyClassName="overflow-x-auto">
        <StudentTable students={students} />
      </SectionCard>
    </div>
  );
}
