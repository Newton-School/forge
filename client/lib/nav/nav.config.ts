import type { RoleKey } from "@/lib/types";

export interface NavItem {
  label: string;
  href: string;
  icon: string; // lucide icon name
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}

/** Role → sidebar nav tree. Mirrors docs/ui-ux.md §5. */
export const NAV: Record<RoleKey, NavSection[]> = {
  MENTEE: [
    {
      items: [
        { label: "Dashboard", href: "/mentee", icon: "LayoutDashboard" },
        { label: "Tasks", href: "/mentee/tasks", icon: "CircleCheckBig" },
        { label: "Deliverables", href: "/mentee/deliverables", icon: "Package" },
        { label: "Milestones", href: "/mentee/milestones", icon: "Flag" },
        { label: "Reviews", href: "/mentee/reviews", icon: "ClipboardList" },
        { label: "Feedback", href: "/mentee/feedback", icon: "MessageSquare" },
        { label: "Team", href: "/mentee/team", icon: "Users" },
      ],
    },
  ],
  // The Student Mentor leads the team: mentee management + team delivery tools.
  MENTOR: [
    {
      label: "Mentorship",
      items: [
        { label: "Dashboard", href: "/mentor", icon: "LayoutDashboard" },
        { label: "My Mentees", href: "/mentor/mentees", icon: "Users" },
        { label: "Reviews", href: "/mentor/reviews", icon: "ClipboardCheck" },
      ],
    },
    {
      label: "Team Delivery",
      items: [
        { label: "Team", href: "/mentor/team", icon: "Users" },
        { label: "Issues & PRs", href: "/mentor/board", icon: "GitPullRequest" },
        { label: "Blockers", href: "/mentor/blockers", icon: "OctagonAlert" },
        { label: "Tasks", href: "/mentor/tasks", icon: "CircleCheckBig" },
        { label: "Deliverables", href: "/mentor/deliverables", icon: "Package" },
      ],
    },
  ],
  TEACHER: [
    {
      items: [
        { label: "Domain Overview", href: "/teacher", icon: "LayoutDashboard" },
        { label: "Teams", href: "/teacher/teams", icon: "Users" },
        { label: "Students", href: "/teacher/students", icon: "GraduationCap" },
        { label: "Reviews & Gates", href: "/teacher/reviews", icon: "ClipboardCheck" },
        { label: "Mentor Performance", href: "/teacher/mentors", icon: "UserCheck" },
        { label: "Analytics", href: "/teacher/analytics", icon: "ChartBar" },
      ],
    },
  ],
  LCC: [
    {
      label: "Monitor",
      items: [
        { label: "Global Dashboard", href: "/lcc", icon: "LayoutDashboard" },
        { label: "Drive Health", href: "/lcc/drive-health", icon: "Activity" },
        { label: "Domains", href: "/lcc/domains", icon: "Boxes" },
        { label: "Teams", href: "/lcc/teams", icon: "Users" },
        { label: "Analytics", href: "/lcc/analytics", icon: "ChartBar" },
      ],
    },
    {
      label: "Operate",
      items: [
        { label: "Concerns", href: "/lcc/concerns", icon: "OctagonAlert" },
        { label: "Email Center", href: "/lcc/email", icon: "Mail" },
        { label: "Onboarding", href: "/lcc/onboarding", icon: "UserPlus" },
        { label: "Invitations", href: "/lcc/invitations", icon: "UserCheck" },
        { label: "Demerits", href: "/lcc/demerits", icon: "ShieldAlert" },
      ],
    },
  ],
  ADMIN: [
    {
      label: "Overview",
      items: [{ label: "Dashboard", href: "/admin", icon: "LayoutDashboard" }],
    },
    {
      label: "People & Org",
      items: [
        { label: "Users", href: "/admin/users", icon: "Users" },
        { label: "Invitations", href: "/admin/invitations", icon: "UserCheck" },
        { label: "Domains", href: "/admin/domains", icon: "Boxes" },
        { label: "Teams", href: "/admin/teams", icon: "Network" },
        { label: "Roles", href: "/admin/roles", icon: "ShieldCheck" },
      ],
    },
    {
      label: "System",
      items: [
        { label: "Configuration", href: "/admin/configuration", icon: "Settings" },
        { label: "Integrations", href: "/admin/integrations", icon: "Plug" },
        { label: "Email Templates", href: "/admin/email-templates", icon: "Mail" },
        { label: "Email Testing", href: "/admin/email-testing", icon: "ClipboardCheck" },
        { label: "Audit Logs", href: "/admin/audit-logs", icon: "ScrollText" },
      ],
    },
  ],
};

/** Shared secondary nav shown for every role (below the role tree). */
export const SHARED_NAV: NavSection = {
  label: "General",
  items: [
    { label: "Calendar", href: "/calendar", icon: "Calendar" },
    { label: "Connections", href: "/connections", icon: "Plug" },
    { label: "Notifications", href: "/notifications", icon: "Bell" },
    { label: "Profile", href: "/profile", icon: "User" },
  ],
};

/**
 * AI-Domain GitHub navigation. Injected by the sidebar **only when the active domain
 * is AI** (GitHub is the source of truth there). ML/SDSE keep just the drive nav above.
 * These sit alongside the drive nav — additive, nothing is removed.
 */
export const GITHUB_NAV: Partial<Record<RoleKey, NavSection[]>> = {
  TEACHER: [
    {
      label: "GitHub · AI",
      items: [
        { label: "Org Dashboard", href: "/teacher/github", icon: "Boxes" },
        { label: "Team Comparison", href: "/teacher/github/teams", icon: "GitCompare" },
        { label: "Project Comparison", href: "/teacher/github/projects", icon: "FolderGit2" },
        { label: "Repositories", href: "/teacher/github/repos", icon: "GitBranch" },
        { label: "Mentor Performance", href: "/teacher/github/mentors", icon: "UserCheck" },
        { label: "Student Contributions", href: "/teacher/github/students", icon: "GraduationCap" },
      ],
    },
  ],
  MENTOR: [
    {
      label: "GitHub · AI",
      items: [
        { label: "Team Dashboard", href: "/mentor/github", icon: "LayoutDashboard" },
        { label: "Repository", href: "/mentor/github/repo", icon: "GitBranch" },
        { label: "Issues", href: "/mentor/github/issues", icon: "CircleDot" },
        { label: "Pull Requests", href: "/mentor/github/pulls", icon: "GitPullRequest" },
        { label: "Student Performance", href: "/mentor/github/students", icon: "Users" },
      ],
    },
  ],
  MENTEE: [
    {
      label: "GitHub · AI",
      items: [
        { label: "My Repository", href: "/mentee/github", icon: "GitBranch" },
        { label: "Issues", href: "/mentee/github/issues", icon: "CircleDot" },
        { label: "My Pull Requests", href: "/mentee/github/pulls", icon: "GitPullRequest" },
        { label: "Contribution Analytics", href: "/mentee/github/analytics", icon: "ChartBar" },
        { label: "Milestones", href: "/mentee/github/milestones", icon: "Flag" },
      ],
    },
  ],
  LCC: [
    {
      label: "GitHub · AI",
      items: [{ label: "AI Domain Overview", href: "/lcc/github", icon: "Boxes" }],
    },
  ],
  ADMIN: [
    {
      label: "GitHub · AI",
      items: [{ label: "AI Domain Overview", href: "/admin/github", icon: "Boxes" }],
    },
  ],
};

/**
 * Repository-mode GitHub navigation for ML/DVA/SDSE (no org). Injected by the sidebar when
 * the active domain is NOT AI. Reuses the same `/{role}/github/**` routes — the pages branch
 * on the active domain to render the repo-based views. Issues stay visible but optional.
 */
export const GITHUB_NAV_REPO: Partial<Record<RoleKey, NavSection[]>> = {
  TEACHER: [
    {
      label: "GitHub",
      items: [
        { label: "Repository Analytics", href: "/teacher/github", icon: "GitBranch" },
        { label: "Repositories", href: "/teacher/github/repos", icon: "FolderGit" },
        { label: "Student Contributions", href: "/teacher/github/students", icon: "GraduationCap" },
      ],
    },
  ],
  MENTOR: [
    {
      label: "GitHub",
      items: [
        { label: "Team Dashboard", href: "/mentor/github", icon: "LayoutDashboard" },
        { label: "Repository", href: "/mentor/github/repo", icon: "GitBranch" },
        { label: "Issues", href: "/mentor/github/issues", icon: "CircleDot" },
        { label: "Pull Requests", href: "/mentor/github/pulls", icon: "GitPullRequest" },
        { label: "Student Performance", href: "/mentor/github/students", icon: "Users" },
      ],
    },
  ],
  MENTEE: [
    {
      label: "GitHub",
      items: [
        { label: "My Repository", href: "/mentee/github", icon: "GitBranch" },
        { label: "Issues", href: "/mentee/github/issues", icon: "CircleDot" },
        { label: "My Pull Requests", href: "/mentee/github/pulls", icon: "GitPullRequest" },
        { label: "Contribution Analytics", href: "/mentee/github/analytics", icon: "ChartBar" },
        { label: "Milestones", href: "/mentee/github/milestones", icon: "Flag" },
      ],
    },
  ],
  LCC: [{ label: "GitHub", items: [{ label: "Domain Overview", href: "/lcc/github", icon: "GitBranch" }] }],
  ADMIN: [{ label: "GitHub", items: [{ label: "Domain Overview", href: "/admin/github", icon: "GitBranch" }] }],
};

/** Landing route per role. */
export const ROLE_HOME: Record<RoleKey, string> = {
  ADMIN: "/admin",
  LCC: "/lcc",
  TEACHER: "/teacher",
  MENTOR: "/mentor",
  MENTEE: "/mentee",
};
