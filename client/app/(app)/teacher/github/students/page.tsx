import { getActiveDomain } from "@/lib/session";
import { TeacherStudents as RepoView } from "@/components/github/repo/views";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StudentTable } from "@/components/github/student-table";
import { GH_TEAMS, studentAnalytics } from "@/lib/api";

export default async function TeacherStudentContributions() {
  const activeDomain = await getActiveDomain();
  if (activeDomain !== "AI") return <RepoView domain={activeDomain} />;

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
