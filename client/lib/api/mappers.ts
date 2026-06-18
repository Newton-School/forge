/**
 * DTO → UI-type mappers. The backend returns Prisma-shaped DTOs; the UI renders the
 * `Mock*` shapes the components were built against. These pure functions are the seam
 * between the two, so production data renders through the exact same components as the
 * presentation fixtures. One mapper per entity; keep them total and lossless-where-possible.
 */
import type {
  MockUser, MockAudit, MockInvitation, InvitationStatus, MockDomain, MockTeam, MockTask, MockUpdate,
  MockWeeklyReview, MockDeliverable, MockMilestone, MockConcern, MockMentee, MockNotification, MockCalendar,
  MockGithub, MockTemplate,
} from "@/lib/mock/data";
import { timeAgo } from "@/lib/utils";
import type {
  WorkStatus, AutoFlag, MentorStatusL3, TeacherDecisionL4, ConcernCategory, Severity, ConcernStatus,
  MenteeStatusL2,
} from "@/lib/types";

const ROLE_RANK: Record<string, number> = { ADMIN: 5, LCC: 4, TEACHER: 3, MENTOR: 2, MENTEE: 1 };

/** The server's user DTO (see server `toUserDto`). */
export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  status: "INVITED" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
  avatarUrl: string | null;
  githubUsername: string | null;
  discordUsername: string | null;
  roles: { role: string; scopeType: string; scopeId: string | null }[];
  domainKey: string | null;
  teamName: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

/** Highest-privilege role wins for the single-role UI badge. */
function primaryRole(roles: { role: string }[]): string {
  if (!roles.length) return "MENTEE";
  return [...roles].sort((a, b) => (ROLE_RANK[b.role] ?? 0) - (ROLE_RANK[a.role] ?? 0))[0]!.role;
}

/** UI status union has no DEACTIVATED — fold it into SUSPENDED. */
function userStatus(s: UserDto["status"]): MockUser["status"] {
  return s === "DEACTIVATED" ? "SUSPENDED" : s;
}

export function userDtoToMock(u: UserDto): MockUser {
  return {
    id: u.id,
    name: u.fullName,
    email: u.email,
    role: primaryRole(u.roles),
    domainKey: u.domainKey ?? undefined,
    team: u.teamName ?? undefined,
    status: userStatus(u.status),
    lastActive: u.lastLoginAt ?? undefined,
  };
}

/** The server's audit DTO (see server audit read repo). */
export interface AuditDto {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  ip: string | null;
  at: string;
  actor: { id: string; fullName: string; email: string } | null;
}

/** "2026-06-14T10:21:00Z" → "2026-06-14 10:21" (local, table-friendly). */
function auditWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** The server's invitation DTO (see server `listInvitations`). Dates arrive as ISO strings. */
export interface InvitationDto {
  id: string;
  email: string;
  name: string | null;
  role: string | null;
  domainKey: string | null;
  team: string | null;
  status: InvitationStatus;
  sentAt: string | null;
  openedAt: string | null;
  acceptedAt: string | null;
  expiresAt: string;
  createdAt: string;
}

export function invitationDtoToMock(i: InvitationDto): MockInvitation {
  return {
    id: i.id,
    name: i.name ?? i.email,
    email: i.email,
    role: i.role ?? "MENTEE",
    domainKey: i.domainKey ?? undefined,
    team: i.team ?? undefined,
    status: i.status,
    sentAt: i.sentAt ?? undefined,
    openedAt: i.openedAt ?? undefined,
    acceptedAt: i.acceptedAt ?? undefined,
    expiresAt: i.expiresAt,
  };
}

/** The server's per-domain analytics rollup (see server `byDomain`). */
export interface DomainDto {
  id: string;
  key: string;
  name: string;
  teacher: string;
  teams: number;
  students: number;
  mentors: number;
  completion: number;
  atRisk: number;
}

export function domainDtoToMock(d: DomainDto): MockDomain {
  return {
    id: d.id,
    key: d.key,
    name: d.name,
    teacher: d.teacher,
    teams: d.teams,
    students: d.students,
    mentors: d.mentors,
    completion: d.completion,
    atRisk: d.atRisk,
  };
}

/** The server's per-team analytics rollup (see server `byTeam`). */
export interface TeamDto {
  id: string;
  name: string;
  alias: string;
  domainId: string;
  domainKey: string | null;
  mentor: string | null;
  teacher: string;
  members: number;
  hasMentor: boolean;
  repo: string | null;
  completion: number;
  status: MentorStatusL3;
}

export function teamDtoToMock(t: TeamDto): MockTeam {
  return {
    id: t.id,
    name: t.name,
    alias: t.alias,
    domainKey: t.domainKey ?? "",
    mentor: t.mentor ?? "—",
    teacher: t.teacher,
    squad: "—", // squad-per-team rollup not modelled yet
    members: t.members,
    completion: t.completion,
    status: t.status,
    ...(t.repo ? { repo: t.repo } : {}),
  };
}

/** The server's task DTO (see server `toTaskDto`). `due` is an ISO string or null. */
export interface TaskDto {
  id: string;
  title: string;
  project: string;
  assignee: string;
  assignedBy: string;
  status: WorkStatus;
  progress: number;
  due: string | null;
  milestoneId: string | null;
}

export function taskDtoToMock(t: TaskDto): MockTask {
  return {
    id: t.id,
    title: t.title,
    project: t.project,
    assignee: t.assignee,
    status: t.status,
    progress: t.progress,
    due: t.due ?? "",
    assignedBy: t.assignedBy,
  };
}

/** The server's mentee-update DTO (see server `listUpdates`). `date` is an ISO string. */
export interface UpdateDto {
  id: string;
  date: string;
  mentee: string;
  domainKey: string | null;
  squad: string | null;
  workedOn: string;
  learning: string;
  blocker: string | null;
  nextGoal: string;
}

export function updateDtoToMock(u: UpdateDto): MockUpdate {
  return {
    id: u.id,
    date: u.date,
    mentee: u.mentee,
    domainKey: u.domainKey ?? "",
    squad: u.squad ?? "—",
    workedOn: u.workedOn,
    learning: u.learning,
    blocker: u.blocker ?? "—",
    nextGoal: u.nextGoal,
  };
}

/** The server's weekly-review DTO (see server `listWeekly`). */
export interface WeeklyReviewDto {
  id: string;
  week: number;
  mentee: string;
  mentor: string;
  domainKey: string | null;
  squad: string | null;
  progressSummary: string | null;
  strength: string | null;
  improvementArea: string | null;
  autoFlag: AutoFlag;
  mentorStatus: MentorStatusL3 | null;
  teacherDecision: TeacherDecisionL4 | null;
  teacherNotes: string | null;
}

export function weeklyReviewDtoToMock(w: WeeklyReviewDto): MockWeeklyReview {
  return {
    id: w.id,
    week: w.week,
    mentee: w.mentee,
    domainKey: w.domainKey ?? "",
    squad: w.squad ?? "—",
    mentor: w.mentor,
    progressSummary: w.progressSummary ?? "",
    strength: w.strength ?? "",
    improvementArea: w.improvementArea ?? "",
    autoFlag: w.autoFlag,
    // An L3-incomplete review has no mentor status yet; surface it as needs-discussion.
    mentorStatus: w.mentorStatus ?? "NEEDS_DISCUSSION",
    teacherDecision: w.teacherDecision,
    teacherNotes: w.teacherNotes ?? "",
  };
}

/** The server's deliverable DTO (see server `listDeliverables`). `submittedAt` is ISO|null. */
export interface DeliverableDto {
  id: string;
  name: string;
  type: string;
  project: string;
  submittedBy: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string | null;
}

export function deliverableDtoToMock(d: DeliverableDto): MockDeliverable {
  return {
    id: d.id,
    name: d.name,
    type: d.type,
    project: d.project,
    submittedBy: d.submittedBy,
    status: d.status,
    submittedAt: d.submittedAt ?? "",
  };
}

/** The server's milestone DTO (see server `listMilestones`). `due` is an ISO string or null. */
export interface MilestoneDto {
  id: string;
  name: string;
  sequence: number;
  phase: string;
  status: WorkStatus;
  completion: number;
  due: string | null;
  keyOutput: string | null;
}

export function milestoneDtoToMock(m: MilestoneDto): MockMilestone {
  return {
    id: m.id,
    name: m.name,
    sequence: m.sequence,
    phase: m.phase,
    status: m.status,
    completion: m.completion,
    due: m.due ?? "",
    keyOutput: m.keyOutput ?? "",
  };
}

/** The server's concern list DTO (see server `listConcerns`). Dates are ISO strings|null. */
export interface ConcernDto {
  id: string;
  ref: string;
  title: string;
  category: ConcernCategory;
  severity: Severity;
  status: ConcernStatus;
  raisedBy: string;
  raisedByRole: string | null;
  assignedTo: string | null;
  domainKey: string | null;
  description: string;
  slaDue: string | null;
  createdAt: string;
}

export function concernDtoToMock(c: ConcernDto): MockConcern {
  return {
    id: c.id,
    ref: c.ref,
    title: c.title,
    category: c.category,
    severity: c.severity,
    status: c.status,
    raisedBy: c.raisedBy,
    raisedByRole: c.raisedByRole ?? "",
    domainKey: c.domainKey ?? "",
    assignedTo: c.assignedTo ?? "Unassigned",
    createdAt: c.createdAt,
    slaDue: c.slaDue ?? "",
    description: c.description,
  };
}

/** The server's mentee (mentor-dashboard) DTO. `lastUpdateAt` is ISO|null. */
export interface MenteeDto {
  menteeId: string;
  name: string;
  teamName: string;
  mentor: string | null;
  domainKey: string | null;
  squad: string | null;
  updatesThisWeek: number;
  lastUpdateAt: string | null;
  blockerStreak: number;
  daysSinceUpdate: number;
  statusL2: MenteeStatusL2;
  comment: string | null;
  actionNeeded: string | null;
  completion: number;
  githubCommits: number;
}

export function menteeDtoToMock(m: MenteeDto): MockMentee {
  return {
    id: m.menteeId,
    name: m.name,
    domainKey: m.domainKey ?? "",
    squad: m.squad ?? "—",
    team: m.teamName,
    mentor: m.mentor ?? "",
    updatesThisWeek: m.updatesThisWeek,
    lastUpdate: m.lastUpdateAt ?? "",
    blockerStreak: m.blockerStreak,
    statusL2: m.statusL2,
    daysSinceUpdate: m.daysSinceUpdate,
    comment: m.comment ?? "",
    actionNeeded: m.actionNeeded ?? "",
    completion: m.completion,
    githubCommits: m.githubCommits,
  };
}

/** The server's notification DTO (see server `listNotifications`). Shaped server-side. */
export interface NotificationDto {
  id: string;
  type: string;
  text: string;
  tone: "info" | "warning" | "danger" | "success";
  unread: boolean;
  createdAt: string;
}

export function notificationDtoToMock(n: NotificationDto): MockNotification {
  return {
    id: n.id,
    type: n.type,
    text: n.text,
    tone: n.tone,
    unread: n.unread,
    when: timeAgo(n.createdAt),
  };
}

/** The server's calendar-event DTO (see server `listEvents`). */
export interface CalendarEventDto {
  id: string;
  title: string;
  type: string;
  scopeType: string;
  startsAt: string;
  endsAt: string | null;
}

const CAL_SCOPES = new Set(["DRIVE", "TEAM", "PERSONAL"]);

export function calendarEventDtoToMock(e: CalendarEventDto): MockCalendar {
  const d = new Date(e.startsAt);
  const pad = (n: number) => String(n).padStart(2, "0");
  const when = Number.isNaN(d.getTime())
    ? e.startsAt
    : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = Number.isNaN(d.getTime()) ? "" : `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return {
    id: e.id,
    title: e.title,
    type: e.type, // raw CalendarEventType — the page maps it to a badge
    when,
    time,
    organizer: "—", // not modelled on the event yet
    scope: (CAL_SCOPES.has(e.scopeType) ? e.scopeType : "DRIVE") as MockCalendar["scope"],
  };
}

/** The server's email-template DTO (see server `listTemplates`). */
export interface EmailTemplateDto {
  id: string;
  name: string;
  subject: string;
  updatedBy: string;
  updatedAt: string;
}

export function emailTemplateDtoToMock(t: EmailTemplateDto): MockTemplate {
  return { id: t.id, name: t.name, subject: t.subject, updatedBy: t.updatedBy, updatedAt: t.updatedAt };
}

/** A demerit row as rendered by the LCC demerits table (the mock array has no named type). */
export interface MockDemerit {
  id: string;
  user: string;
  domainKey: string;
  reason: string;
  points: number;
  issuedBy: string;
  escalated: boolean;
  when: string;
}

/** The server's demerit DTO (see server `listDemerits`). */
export interface DemeritDto {
  id: string;
  user: string;
  domainKey: string | null;
  reason: string;
  points: number;
  issuedBy: string;
  escalated: boolean;
  createdAt: string;
}

export function demeritDtoToMock(d: DemeritDto): MockDemerit {
  return {
    id: d.id,
    user: d.user,
    domainKey: d.domainKey ?? "",
    reason: d.reason,
    points: d.points,
    issuedBy: d.issuedBy,
    escalated: d.escalated,
    when: d.createdAt,
  };
}

/** The server's GitHub-activity DTO (see server `listActivity`). */
export interface GithubActivityDto {
  id: string;
  type: string;
  title: string;
  author: string;
  repo: string;
  state: string;
  occurredAt: string;
}

const GH_TYPES = new Set(["COMMIT", "PR", "ISSUE", "REVIEW"]);

export function githubActivityDtoToMock(a: GithubActivityDto): MockGithub {
  return {
    id: a.id,
    type: (GH_TYPES.has(a.type) ? a.type : "COMMIT") as MockGithub["type"],
    title: a.title,
    author: a.author,
    repo: a.repo,
    state: a.state,
    when: timeAgo(a.occurredAt),
  };
}

export function auditDtoToMock(a: AuditDto): MockAudit {
  return {
    id: a.id,
    actor: a.actor?.fullName ?? a.actor?.email ?? "System",
    action: a.action,
    entity: a.entityId ? `${a.entityType} • ${a.entityId}` : a.entityType,
    when: auditWhen(a.at),
    ip: a.ip ?? "—",
  };
}
