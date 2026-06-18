import { getActiveDomain } from "@/lib/session";
import { TeacherRepoHome as RepoView } from "@/components/github/repo/views";
import { Target, Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { Badge } from "@/components/ui/badge";
import { TeamCompare } from "@/components/github/team-compare";
import { GH_PROJECTS, teamsForProject, teamAnalytics } from "@/lib/api";

/** A project may span 1..N teams. For multi-team projects, the teacher compares them head-to-head. */
export default async function TeacherProjectComparison() {
  const activeDomain = await getActiveDomain();
  if (activeDomain !== "AI") return <RepoView domain={activeDomain} />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Project Comparison" description="Projects can be assigned to one or many teams — compare progress across them" />

      {GH_PROJECTS.map((p) => {
        const teams = teamsForProject(p);
        const analytics = teams.map((t) => teamAnalytics(t.id));
        return (
          <SectionCard
            key={p.id}
            title={p.name}
            description={p.objective}
            action={<Badge tone={teams.length > 1 ? "primary" : "neutral"}>{teams.length > 1 ? `${teams.length} teams` : "1 team"}</Badge>}
            bodyClassName="flex flex-col gap-4 p-4"
          >
            <p className="flex items-start gap-2 text-sm text-muted-foreground"><Target className="mt-0.5 size-4 shrink-0" /> {p.overview}</p>
            <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Users className="size-3.5" /> {teams.map((t) => <Badge key={t.id} tone="info">{t.name}</Badge>)}
            </p>
            {teams.length > 1 ? (
              <TeamCompare teams={analytics} />
            ) : (
              <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                Single-team project — {analytics[0]?.teamName} · {analytics[0]?.commits} commits · {analytics[0]?.prMergeRate}% merge rate · {analytics[0]?.milestoneProgress}% milestone.
              </p>
            )}
          </SectionCard>
        );
      })}
    </div>
  );
}
