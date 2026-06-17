// Presentation dataset — the persistent demo data for the whole app, kept in this
// file (no database). Shown when APP_MODE=presentation (see lib/config.ts).
// Realistic, drawn from the SPBD tracking sheets. Read directly by the dashboards.
// In a real (non-presentation) backend this is replaced by services + Prisma.

import type {
  AutoFlag,
  ConcernCategory,
  ConcernStatus,
  MenteeStatusL2,
  MentorStatusL3,
  Severity,
  TeacherDecisionL4,
  WorkStatus,
} from "@/lib/types";

export interface MockDomain { id: string; key: string; name: string; teacher: string; teams: number; students: number; mentors: number; completion: number; atRisk: number; }
export interface MockTeam { id: string; name: string; alias: string; domainKey: string; mentor: string; teacher: string; squad: string; members: number; completion: number; status: MentorStatusL3; repo?: string; }
export interface MockUser { id: string; name: string; email: string; role: string; domainKey?: string; team?: string; squad?: string; status: "ACTIVE" | "INVITED" | "SUSPENDED"; lastActive?: string; }
export interface MockMentee { id: string; name: string; domainKey: string; squad: string; team: string; mentor: string; updatesThisWeek: number; lastUpdate: string; blockerStreak: number; statusL2: MenteeStatusL2; daysSinceUpdate: number; comment: string; actionNeeded: string; completion: number; githubCommits: number; }
export interface MockUpdate { id: string; date: string; mentee: string; domainKey: string; squad: string; workedOn: string; learning: string; blocker: string; nextGoal: string; }
export interface MockWeeklyReview { id: string; week: number; mentee: string; domainKey: string; squad: string; mentor: string; progressSummary: string; strength: string; improvementArea: string; autoFlag: AutoFlag; mentorStatus: MentorStatusL3; teacherDecision: TeacherDecisionL4 | null; teacherNotes: string; }
export interface MockConcern { id: string; ref: string; title: string; category: ConcernCategory; severity: Severity; status: ConcernStatus; raisedBy: string; raisedByRole: string; domainKey: string; assignedTo: string; createdAt: string; slaDue: string; description: string; }
export interface MockTask { id: string; title: string; project: string; assignee: string; status: WorkStatus; progress: number; due: string; assignedBy: string; }
export interface MockMilestone { id: string; name: string; sequence: number; phase: string; status: WorkStatus; completion: number; due: string; keyOutput: string; }
export interface MockDeliverable { id: string; name: string; type: string; project: string; submittedBy: string; status: "PENDING" | "APPROVED" | "REJECTED"; submittedAt: string; }

export const DOMAINS: MockDomain[] = [
  { id: "d-ai", key: "AI", name: "Artificial Intelligence", teacher: "Bipul Kumar", teams: 18, students: 86, mentors: 18, completion: 72, atRisk: 7 },
  { id: "d-ml", key: "ML", name: "Machine Learning", teacher: "Anita Desai", teams: 12, students: 58, mentors: 12, completion: 64, atRisk: 9 },
  { id: "d-sdse", key: "SDSE", name: "Software Dev & Systems Eng", teacher: "Rahul Verma", teams: 14, students: 96, mentors: 14, completion: 68, atRisk: 11 },
];

export const TEAMS: MockTeam[] = [
  { id: "t-ai-07", name: "AI Group 07", alias: "GROUP", domainKey: "AI", mentor: "Aryan Sharma", teacher: "Bipul Kumar", squad: "Alpha", members: 5, completion: 78, status: "ON_TRACK", repo: "nst/engageiq-ai" },
  { id: "t-ai-03", name: "AI Group 03", alias: "GROUP", domainKey: "AI", mentor: "Mentor A", teacher: "Bipul Kumar", squad: "Alpha", members: 5, completion: 62, status: "AT_RISK", repo: "nst/examlens-ai" },
  { id: "t-ai-11", name: "AI Group 11", alias: "POD", domainKey: "AI", mentor: "Kabir Singh", teacher: "Bipul Kumar", squad: "Beta", members: 5, completion: 84, status: "ON_TRACK", repo: "nst/newssnap-ai" },
  { id: "t-ml-02", name: "ML Squad Beta", alias: "SQUAD", domainKey: "ML", mentor: "Mentor C", teacher: "Anita Desai", squad: "Beta", members: 6, completion: 55, status: "AT_RISK", repo: "nst/forecaster-ml" },
  { id: "t-ml-05", name: "ML Squad Gamma", alias: "SQUAD", domainKey: "ML", mentor: "Neha Gupta", teacher: "Anita Desai", squad: "Gamma", members: 5, completion: 70, status: "ON_TRACK" },
  { id: "t-sd-01", name: "Shipyard Team", alias: "TEAM", domainKey: "SDSE", mentor: "Mentor B", teacher: "Rahul Verma", squad: "Alpha", members: 9, completion: 66, status: "ON_TRACK", repo: "nst/shipyard" },
  { id: "t-sd-04", name: "StreamLine Team", alias: "TEAM", domainKey: "SDSE", mentor: "Ishaan Roy", teacher: "Rahul Verma", squad: "Gamma", members: 10, completion: 48, status: "NEEDS_DISCUSSION", repo: "nst/streamline" },
];

export const MENTEES: MockMentee[] = [
  { id: "m1", name: "Aniket Sharma", domainKey: "SDSE", squad: "Alpha", team: "Shipyard Team", mentor: "Mentor A", updatesThisWeek: 3, lastUpdate: "2026-06-12", blockerStreak: 1, statusL2: "DOING_WELL", daysSinceUpdate: 2, comment: "Sharp questions on Context API today.", actionNeeded: "—", completion: 82, githubCommits: 24 },
  { id: "m2", name: "Priya Kulkarni", domainKey: "SDSE", squad: "Beta", team: "StreamLine Team", mentor: "Mentor B", updatesThisWeek: 2, lastUpdate: "2026-06-12", blockerStreak: 1, statusL2: "NEEDS_CONSISTENCY", daysSinceUpdate: 2, comment: "Active on Discord but update quality declining.", actionNeeded: "Send check-in DM", completion: 64, githubCommits: 11 },
  { id: "m3", name: "Rajan Mehta", domainKey: "ML", squad: "Gamma", team: "ML Squad Gamma", mentor: "Mentor C", updatesThisWeek: 1, lastUpdate: "2026-06-10", blockerStreak: 2, statusL2: "NEEDS_CONSISTENCY", daysSinceUpdate: 4, comment: "Two consecutive updates mention merge confusion.", actionNeeded: "Address in next session", completion: 51, githubCommits: 7 },
  { id: "m4", name: "Sneha Iyer", domainKey: "AI", squad: "Alpha", team: "AI Group 07", mentor: "Mentor A", updatesThisWeek: 3, lastUpdate: "2026-06-12", blockerStreak: 2, statusL2: "DOING_WELL", daysSinceUpdate: 2, comment: "Model evaluation concepts solid.", actionNeeded: "—", completion: 88, githubCommits: 31 },
  { id: "m5", name: "Arjun Nair", domainKey: "AI", squad: "Beta", team: "AI Group 03", mentor: "Mentor B", updatesThisWeek: 1, lastUpdate: "2026-06-10", blockerStreak: 0, statusL2: "NO_UPDATES_4PLUS", daysSinceUpdate: 4, comment: "Reached out via DM — no response yet.", actionNeeded: "Escalate to teacher", completion: 38, githubCommits: 4 },
  { id: "m6", name: "Divya Rao", domainKey: "ML", squad: "Beta", team: "ML Squad Beta", mentor: "Mentor C", updatesThisWeek: 2, lastUpdate: "2026-06-10", blockerStreak: 0, statusL2: "DOING_WELL", daysSinceUpdate: 4, comment: "—", actionNeeded: "—", completion: 70, githubCommits: 18 },
];

export const UPDATES: MockUpdate[] = [
  { id: "u1", date: "2026-06-12", mentee: "Aniket Sharma", domainKey: "SDSE", squad: "Alpha", workedOn: "State Management", learning: "useContext hook", blocker: "—", nextGoal: "Complete Todo app with context" },
  { id: "u2", date: "2026-06-12", mentee: "Priya Kulkarni", domainKey: "SDSE", squad: "Beta", workedOn: "Competitive Analysis", learning: "Feature prioritization", blocker: "Confused on MoSCoW method", nextGoal: "Create feature matrix" },
  { id: "u3", date: "2026-06-12", mentee: "Sneha Iyer", domainKey: "AI", squad: "Alpha", workedOn: "Model Evaluation", learning: "Precision & Recall", blocker: "ROC curve interpretation", nextGoal: "Practice on Titanic dataset" },
  { id: "u4", date: "2026-06-10", mentee: "Aniket Sharma", domainKey: "SDSE", squad: "Alpha", workedOn: "React Components", learning: "Props & State", blocker: "Confused in Context API", nextGoal: "Build Navbar component" },
  { id: "u5", date: "2026-06-10", mentee: "Rajan Mehta", domainKey: "ML", squad: "Gamma", workedOn: "Pandas & EDA", learning: "Groupby & Pivot", blocker: "Merge vs Join confusion", nextGoal: "Build sales dashboard" },
  { id: "u6", date: "2026-06-10", mentee: "Sneha Iyer", domainKey: "AI", squad: "Alpha", workedOn: "Linear Regression", learning: "Gradient Descent", blocker: "—", nextGoal: "Train first model on dataset" },
];

export const WEEKLY_REVIEWS: MockWeeklyReview[] = [
  { id: "w1", week: 1, mentee: "Aniket Sharma", domainKey: "SDSE", squad: "Alpha", mentor: "Mentor A", progressSummary: "Completed React fundamentals; built static Navbar and Footer components.", strength: "Consistent bi-daily updates; proactive blocker reporting.", improvementArea: "Asks clarifying questions only after 2+ hours stuck — should ask earlier.", autoFlag: "NONE", mentorStatus: "ON_TRACK", teacherDecision: "CONTINUE", teacherNotes: "Strong week. Encourage deeper dives into hooks." },
  { id: "w2", week: 1, mentee: "Priya Kulkarni", domainKey: "SDSE", squad: "Beta", mentor: "Mentor B", progressSummary: "Completed user research framework overview; started competitive analysis.", strength: "Good instinct for user pain points in JTBD exercise.", improvementArea: "Update frequency dropped mid-week; blockers field is vague.", autoFlag: "CONSISTENCY_GAP", mentorStatus: "AT_RISK", teacherDecision: "MONITOR", teacherNotes: "Mentor to check in by Tuesday." },
  { id: "w3", week: 1, mentee: "Rajan Mehta", domainKey: "ML", squad: "Gamma", mentor: "Mentor C", progressSummary: "EDA on sample sales dataset; pivot tables and groupby explored.", strength: "Strong Python fundamentals; code is clean and commented.", improvementArea: "Merge/join confusion persisted for 3 updates — needs dedicated session.", autoFlag: "REPEATED_BLOCKER", mentorStatus: "AT_RISK", teacherDecision: "MONITOR", teacherNotes: "Mentor: address merge confusion next session." },
  { id: "w4", week: 1, mentee: "Sneha Iyer", domainKey: "AI", squad: "Alpha", mentor: "Mentor A", progressSummary: "Linear regression implemented from scratch; tested on Titanic dataset.", strength: "Fast learner — went beyond assignment to test on additional dataset.", improvementArea: "ROC curve interpretation needs reinforcement.", autoFlag: "NONE", mentorStatus: "ON_TRACK", teacherDecision: "CONTINUE", teacherNotes: "Outstanding week. Flag for internal showcase." },
  { id: "w5", week: 1, mentee: "Arjun Nair", domainKey: "AI", squad: "Beta", mentor: "Mentor B", progressSummary: "No updates submitted this week.", strength: "—", improvementArea: "Complete radio silence — unreachable via Discord and DM.", autoFlag: "NO_UPDATES", mentorStatus: "NEEDS_DISCUSSION", teacherDecision: null, teacherNotes: "" },
  { id: "w6", week: 1, mentee: "Divya Rao", domainKey: "ML", squad: "Beta", mentor: "Mentor C", progressSummary: "Arduino PWM basics; built first servo circuit with guidance.", strength: "Hands-on learner — builds first, documents after.", improvementArea: "Documentation and update frequency needs improvement.", autoFlag: "NONE", mentorStatus: "ON_TRACK", teacherDecision: "CONTINUE", teacherNotes: "Good start. Push for more detailed blockers." },
];

export const CONCERNS: MockConcern[] = [
  { id: "c1", ref: "CON-1042", title: "Unable to deploy model to Render", category: "TECHNICAL_ISSUE", severity: "HIGH", status: "IN_PROGRESS", raisedBy: "Sneha Iyer", raisedByRole: "MENTEE", domainKey: "AI", assignedTo: "Bipul Kumar", createdAt: "2026-06-13", slaDue: "2026-06-16", description: "Deployment fails with a memory error on the free Render tier. Mentor suggested the deployment guide but the build still times out." },
  { id: "c2", ref: "CON-1041", title: "Mentor unresponsive for 5 days", category: "MENTOR", severity: "CRITICAL", status: "ESCALATED", raisedBy: "Arjun Nair", raisedByRole: "MENTEE", domainKey: "AI", assignedTo: "LCC", createdAt: "2026-06-11", slaDue: "2026-06-12", description: "No response from mentor on Discord or DM across multiple days; blocked on project scope." },
  { id: "c3", ref: "CON-1039", title: "Team member not contributing to group project", category: "TEAM_MEMBER", severity: "MEDIUM", status: "ACKNOWLEDGED", raisedBy: "Aniket Sharma", raisedByRole: "MENTEE", domainKey: "SDSE", assignedTo: "Rahul Verma", createdAt: "2026-06-12", slaDue: "2026-06-17", description: "One member has not picked up any issues in two sprints; PR count is zero." },
  { id: "c4", ref: "CON-1036", title: "Proposal feedback unclear", category: "PROCESS_ISSUE", severity: "LOW", status: "RESOLVED", raisedBy: "Neha Gupta", raisedByRole: "MENTOR", domainKey: "ML", assignedTo: "Anita Desai", createdAt: "2026-06-09", slaDue: "2026-06-14", description: "Faculty gate verdict said 'Revise & Resubmit' without specifics; clarified in office hours." },
  { id: "c5", ref: "CON-1030", title: "GitHub repo access missing for two members", category: "TECHNICAL_ISSUE", severity: "MEDIUM", status: "CLOSED", raisedBy: "Priya Kulkarni", raisedByRole: "MENTEE", domainKey: "SDSE", assignedTo: "Admin", createdAt: "2026-06-07", slaDue: "2026-06-10", description: "Two contributors were not added to the org repo; resolved by admin invite." },
];

export const TASKS: MockTask[] = [
  { id: "tk1", title: "Implement resume parser module", project: "Resume Analyzer (Individual)", assignee: "Sneha Iyer", status: "IN_PROGRESS", progress: 80, due: "2026-06-17", assignedBy: "Mentor A" },
  { id: "tk2", title: "Build feature prioritization matrix", project: "Product Teardown (Individual)", assignee: "Priya Kulkarni", status: "TODO", progress: 0, due: "2026-06-18", assignedBy: "Mentor B" },
  { id: "tk3", title: "Data cleaning pipeline", project: "Sales Forecaster (Group)", assignee: "Rajan Mehta", status: "IN_REVIEW", progress: 95, due: "2026-06-15", assignedBy: "Mentor C" },
  { id: "tk4", title: "Wire engagement scorer agent", project: "EngageIQ (Group)", assignee: "Sneha Iyer", status: "BLOCKED", progress: 40, due: "2026-06-16", assignedBy: "Mentor A" },
  { id: "tk5", title: "Set up CI workflow", project: "Shipyard (Group)", assignee: "Aniket Sharma", status: "DONE", progress: 100, due: "2026-06-11", assignedBy: "Aryan Sharma" },
];

export const MILESTONES: MockMilestone[] = [
  { id: "ms1", name: "Skill Assessment Complete", sequence: 1, phase: "Phase 1", status: "DONE", completion: 100, due: "2026-06-08", keyOutput: "Career Interest Declaration submitted & reviewed" },
  { id: "ms2", name: "Proposal Approved (Gate 1)", sequence: 2, phase: "Phase 2", status: "DONE", completion: 100, due: "2026-06-11", keyOutput: "Faculty-approved group + individual proposals" },
  { id: "ms3", name: "Milestone 1 — Core Feature", sequence: 3, phase: "Phase 3", status: "IN_PROGRESS", completion: 65, due: "2026-06-22", keyOutput: "Working core feature on GitHub with README" },
  { id: "ms4", name: "Internal Hackathon #1", sequence: 4, phase: "Phase 3", status: "TODO", completion: 0, due: "2026-06-27", keyOutput: "Demo video + GitHub link + 200-word writeup" },
  { id: "ms5", name: "Milestone 2 — Full Project", sequence: 5, phase: "Phase 3", status: "TODO", completion: 0, due: "2026-07-06", keyOutput: "Full working project, documented, demo-ready" },
];

export const DELIVERABLES: MockDeliverable[] = [
  { id: "dl1", name: "Technical Report (PDF)", type: "Report", project: "Sales Forecaster", submittedBy: "Rajan Mehta", status: "PENDING", submittedAt: "2026-06-13" },
  { id: "dl2", name: "10-slide Deck", type: "Presentation", project: "Resume Analyzer", submittedBy: "Sneha Iyer", status: "APPROVED", submittedAt: "2026-06-12" },
  { id: "dl3", name: "Demo Video (3-min)", type: "Video", project: "EngageIQ", submittedBy: "AI Group 07", status: "PENDING", submittedAt: "2026-06-13" },
  { id: "dl4", name: "Source Code Repository", type: "Code", project: "StreamLine", submittedBy: "StreamLine Team", status: "REJECTED", submittedAt: "2026-06-10" },
];

export const USERS: MockUser[] = [
  { id: "us1", name: "Patrick Admin", email: "patrick@maverick.biz", role: "ADMIN", status: "ACTIVE", lastActive: "2026-06-14" },
  { id: "us2", name: "Priya LCC", email: "priya.lcc@nst.edu", role: "LCC", status: "ACTIVE", lastActive: "2026-06-14" },
  { id: "us3", name: "Bipul Kumar", email: "bipul@nst.edu", role: "TEACHER", domainKey: "AI", status: "ACTIVE", lastActive: "2026-06-13" },
  { id: "us4", name: "Anita Desai", email: "anita@nst.edu", role: "TEACHER", domainKey: "ML", status: "ACTIVE", lastActive: "2026-06-13" },
  { id: "us5", name: "Aryan Sharma", email: "aryan@nst.edu", role: "MENTOR", domainKey: "AI", team: "AI Group 07", status: "ACTIVE", lastActive: "2026-06-14" },
  { id: "us6", name: "Aniket Sharma", email: "aniket@nst.edu", role: "MENTEE", domainKey: "SDSE", team: "Shipyard Team", status: "ACTIVE", lastActive: "2026-06-14" },
  { id: "us7", name: "Sneha Iyer", email: "sneha@nst.edu", role: "MENTEE", domainKey: "AI", team: "AI Group 07", squad: "Alpha", status: "ACTIVE", lastActive: "2026-06-12" },
  { id: "us8", name: "Arjun Nair", email: "arjun@nst.edu", role: "MENTEE", domainKey: "AI", team: "AI Group 03", squad: "Beta", status: "ACTIVE", lastActive: "2026-06-10" },
  { id: "us9", name: "Kavya Reddy", email: "kavya@nst.edu", role: "MENTEE", domainKey: "ML", team: "ML Squad Beta", squad: "Beta", status: "INVITED" },
  { id: "us10", name: "Rohan Das", email: "rohan@nst.edu", role: "MENTEE", domainKey: "SDSE", team: "StreamLine Team", squad: "Gamma", status: "SUSPENDED", lastActive: "2026-06-05" },
];

// ── Onboarding invitations (invite-only lifecycle) ───────────────────────────────
export type InvitationStatus = "PENDING" | "SENT" | "OPENED" | "COMPLETED" | "EXPIRED";
export interface MockInvitation {
  id: string;
  name: string;
  email: string;
  role: string;
  domainKey?: string;
  team?: string;
  status: InvitationStatus;
  sentAt?: string;
  openedAt?: string;
  acceptedAt?: string;
  expiresAt: string;
}

export const INVITATIONS: MockInvitation[] = [
  { id: "inv1", name: "Sneha Iyer", email: "sneha@nst.edu", role: "MENTEE", domainKey: "AI", team: "AI Group 07", status: "COMPLETED", sentAt: "2026-06-08", openedAt: "2026-06-08", acceptedAt: "2026-06-09", expiresAt: "2026-06-22" },
  { id: "inv2", name: "Aryan Sharma", email: "aryan@nst.edu", role: "MENTOR", domainKey: "AI", team: "AI Group 07", status: "COMPLETED", sentAt: "2026-06-07", openedAt: "2026-06-07", acceptedAt: "2026-06-07", expiresAt: "2026-06-21" },
  { id: "inv3", name: "Kavya Reddy", email: "kavya@nst.edu", role: "MENTEE", domainKey: "ML", team: "ML Squad Beta", status: "OPENED", sentAt: "2026-06-14", openedAt: "2026-06-15", expiresAt: "2026-06-28" },
  { id: "inv4", name: "Dev Malhotra", email: "dev.malhotra@nst.edu", role: "MENTEE", domainKey: "AI", team: "AI Group 03", status: "SENT", sentAt: "2026-06-16", expiresAt: "2026-06-30" },
  { id: "inv5", name: "Ishita Bose", email: "ishita.bose@nst.edu", role: "MENTOR", domainKey: "SDSE", team: "Shipyard Team", status: "SENT", sentAt: "2026-06-16", expiresAt: "2026-06-30" },
  { id: "inv6", name: "Nikhil Verma", email: "nikhil.verma@nst.edu", role: "MENTEE", domainKey: "SDSE", team: "StreamLine Team", status: "PENDING", expiresAt: "2026-07-01" },
  { id: "inv7", name: "Tara Singh", email: "tara.singh@nst.edu", role: "MENTEE", domainKey: "ML", team: "ML Squad Beta", status: "EXPIRED", sentAt: "2026-05-20", openedAt: "2026-05-21", expiresAt: "2026-06-03" },
];

/** Preset reviewers for the email-testing module (Phase-1 validation recipients). */
export const TEST_EMAIL_RECIPIENTS: string[] = [
  "shaik.tajuddin2024@nst.rishihood.edu.in",
  "abhinav.choudhary2024@nst.rishihood.edu.in",
  "aniket.pathak2024@nst.rishihood.edu.in",
  "anwesha.adhikari2024@nst.rishihood.edu.in",
  "khushi.2024@nst.rishihood.edu.in",
  "nikith.s2024@nst.rishihood.edu.in",
  "kushagra.r@nst.rishihood.edu.in",
  "nipun.g@nst.rishihood.edu.in",
];

export interface MockGithub { id: string; type: "COMMIT" | "PR" | "ISSUE" | "REVIEW"; title: string; author: string; repo: string; state: string; when: string; }
export const GITHUB_ACTIVITY: MockGithub[] = [
  { id: "g1", type: "COMMIT", title: "feat: add engagement scorer agent", author: "Sneha Iyer", repo: "engageiq-ai", state: "main", when: "2026-06-14" },
  { id: "g2", type: "PR", title: "Add face mesh detection module", author: "Kabir Singh", repo: "engageiq-ai", state: "open", when: "2026-06-14" },
  { id: "g3", type: "REVIEW", title: "Reviewed #42 nudge delivery", author: "Aryan Sharma", repo: "engageiq-ai", state: "approved", when: "2026-06-13" },
  { id: "g4", type: "ISSUE", title: "M3: dashboard integration", author: "Aniket Sharma", repo: "shipyard", state: "open", when: "2026-06-13" },
  { id: "g5", type: "COMMIT", title: "fix: handle empty dataset edge case", author: "Rajan Mehta", repo: "forecaster-ml", state: "dev", when: "2026-06-12" },
];

export interface MockCalendar { id: string; title: string; type: string; when: string; time: string; organizer: string; scope: "DRIVE" | "TEAM" | "PERSONAL"; }
export const CALENDAR: MockCalendar[] = [
  // Drive-wide events organized by LCC — visible to EVERY user.
  { id: "ev7", title: "Drive Town Hall", type: "EVENT", when: "2026-06-17", time: "17:00", organizer: "LCC", scope: "DRIVE" },
  { id: "ev5", title: "Trivia Night", type: "EVENT", when: "2026-06-18", time: "19:00", organizer: "LCC", scope: "DRIVE" },
  { id: "ev8", title: "Peer-to-Peer Interview Round", type: "REVIEW", when: "2026-06-19", time: "14:00", organizer: "LCC", scope: "DRIVE" },
  { id: "ev6", title: "Inter-Group Presentations", type: "EVENT", when: "2026-06-20", time: "15:00", organizer: "LCC", scope: "DRIVE" },
  { id: "ev4", title: "Internal Hackathon #1", type: "EVENT", when: "2026-06-27", time: "09:00", organizer: "LCC", scope: "DRIVE" },
  // Team / personal events.
  { id: "ev1", title: "Weekly Faculty Review", type: "REVIEW", when: "2026-06-15", time: "16:00", organizer: "Teacher", scope: "TEAM" },
  { id: "ev2", title: "Mentor 1:1 — Sneha", type: "MENTOR_MEETING", when: "2026-06-16", time: "11:00", organizer: "Mentor", scope: "PERSONAL" },
  { id: "ev3", title: "Milestone 1 Due", type: "DEADLINE", when: "2026-06-22", time: "23:59", organizer: "System", scope: "TEAM" },
];

export interface MockNotification { id: string; type: string; text: string; when: string; unread: boolean; tone: "info" | "warning" | "danger" | "success"; }
export const NOTIFICATIONS: MockNotification[] = [
  { id: "n1", type: "Weekly update pending", text: "Your bi-daily update is due today.", when: "2h ago", unread: true, tone: "warning" },
  { id: "n2", type: "Mentor feedback added", text: "Mentor A left feedback on your resume parser task.", when: "5h ago", unread: true, tone: "info" },
  { id: "n3", type: "Deliverable due", text: "10-slide deck due in 24 hours.", when: "1d ago", unread: false, tone: "info" },
  { id: "n4", type: "Review scheduled", text: "Weekly Faculty Review on 15 Jun, 16:00.", when: "1d ago", unread: false, tone: "success" },
  { id: "n5", type: "Missed deadline", text: "Milestone draft was due yesterday.", when: "2d ago", unread: false, tone: "danger" },
];

export interface MockTemplate { id: string; name: string; subject: string; updatedBy: string; updatedAt: string; }
export const EMAIL_TEMPLATES: MockTemplate[] = [
  { id: "et1", name: "Concern Raised → LCC", subject: "[Concern {{ref}}] {{title}}", updatedBy: "Admin", updatedAt: "2026-06-01" },
  { id: "et2", name: "Weekly Update Reminder", subject: "Your update is due today", updatedBy: "LCC", updatedAt: "2026-06-03" },
  { id: "et3", name: "Missed Deadline Alert", subject: "Deliverable overdue: {{deliverable}}", updatedBy: "LCC", updatedAt: "2026-06-05" },
  { id: "et4", name: "Invitation", subject: "You've been invited to the Profile Building Drive", updatedBy: "Admin", updatedAt: "2026-05-28" },
];

export interface MockAudit { id: string; actor: string; action: string; entity: string; when: string; ip: string; }
export const AUDIT_LOGS: MockAudit[] = [
  { id: "a1", actor: "Patrick Admin", action: "user:create", entity: "User • Kavya Reddy", when: "2026-06-14 10:21", ip: "10.0.4.12" },
  { id: "a2", actor: "Bipul Kumar", action: "weeklyReview:l4Submit", entity: "WeeklyReview • Aniket (W1)", when: "2026-06-14 09:03", ip: "10.0.2.31" },
  { id: "a3", actor: "Priya LCC", action: "concern:resolve", entity: "Concern • CON-1036", when: "2026-06-13 18:44", ip: "10.0.1.8" },
  { id: "a4", actor: "Patrick Admin", action: "role:assign", entity: "UserRole • Aryan → MENTOR", when: "2026-06-13 14:10", ip: "10.0.4.12" },
  { id: "a5", actor: "Priya LCC", action: "email:bulkSend", entity: "Email • Weekly Reminder (142 recipients)", when: "2026-06-13 08:00", ip: "10.0.1.8" },
];

export const DEMERITS = [
  { id: "dm1", user: "Rohan Das", domainKey: "SDSE", reason: "Two consecutive missed weekly logs", points: 2, issuedBy: "LCC", escalated: false, when: "2026-06-12" },
  { id: "dm2", user: "Arjun Nair", domainKey: "AI", reason: "No updates for 5+ days", points: 3, issuedBy: "LCC", escalated: true, when: "2026-06-11" },
];

export const CONCERN_CATEGORIES: { value: ConcernCategory; label: string }[] = [
  { value: "MENTOR", label: "Mentor" },
  { value: "MENTEE", label: "Mentee" },
  { value: "TEACHER", label: "Teacher" },
  { value: "TEAM_MEMBER", label: "Team Member" },
  { value: "DOMAIN_ISSUE", label: "Domain Issue" },
  { value: "TECHNICAL_ISSUE", label: "Technical Issue" },
  { value: "PROCESS_ISSUE", label: "Process Issue" },
  { value: "OTHER", label: "Other" },
];

// Drive-health rollups for LCC.
export const DRIVE_HEALTH = {
  totalStudents: 240,
  totalMentors: 44,
  totalTeams: 44,
  totalDomains: 3,
  completionRate: 68,
  activeBlockers: 12,
  openConcerns: 9,
  escalatedConcerns: 2,
  inactiveTeams: 4,
  delayedDeliverables: 7,
  weeklyUpdateCompliance: 86,
  onboardingComplete: 93,
};
