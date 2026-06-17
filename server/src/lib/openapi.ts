/**
 * OpenAPI 3.0 document for the Forge API, served via Swagger UI at /api/docs.
 * Hand-authored and kept next to the routes; each module's endpoints are grouped
 * by tag. Auth is cookie-session based (log in via /api/auth/google in a browser).
 */
// Typed loosely on purpose: a deep `as const` here overflows tsc's type checker as the
// spec grows. It's only serialized to JSON / handed to swagger-ui, so the wide type is fine.
export const openapiDocument: Record<string, unknown> = {
  openapi: "3.0.3",
  info: {
    title: "Forge API",
    version: "0.1.0",
    description:
      "Backend for Forge — the Profile Building Drive platform. Auth is Google OAuth only; " +
      "sessions are server-side (cookie `forge.sid`). All authorization is enforced server-side (role × scope).",
  },
  servers: [{ url: "/api", description: "API base (behind the ALB)" }],
  tags: [
    { name: "Auth", description: "Google OAuth login & session" },
    { name: "Users", description: "User & role administration (Admin)" },
    { name: "Org", description: "Domains, teams & membership (read scoped; write = manage perms)" },
    { name: "Audit", description: "Immutable audit-log read (Admin/LCC)" },
    { name: "Analytics", description: "Scope-filtered rollups (overview / per-domain / per-team)" },
    { name: "Notifications", description: "Per-user in-app notifications (list / mark read)" },
    { name: "Email", description: "Outbound email + announcements (provider-adapter; capped & audited)" },
    { name: "GitHub", description: "GitHub webhook receiver (HMAC-verified) + activity read" },
    { name: "Discord", description: "Discord interactions receiver (Ed25519-verified) + activity read" },
    { name: "Calendar", description: "Drive calendar events (scoped) with best-effort Google sync" },
    { name: "Assistant", description: "Groq-backed AI helper (rate-limited & capped)" },
    { name: "Jobs", description: "Scheduled auto-flags / escalations (cron + manual trigger)" },
    { name: "Concerns", description: "Raise & manage concerns (scoped lifecycle)" },
    { name: "Reviews", description: "The L1–L4 review loop (mentee update → mentor status → weekly review → teacher decision)" },
    { name: "Projects", description: "Group & individual projects + faculty proposal gates" },
    { name: "Tasks", description: "Assigned work items (assign / update progress)" },
    { name: "Milestones", description: "Project milestones (create / progress / faculty sign-off)" },
    { name: "Deliverables", description: "Submit artifacts & review verdicts" },
    { name: "Feedback", description: "Confidential 360° mentor ratings" },
    { name: "Demerits", description: "Disciplinary points (issue / amend)" },
    { name: "Config", description: "Drive configuration — phases, gates, cycles, escalations, rubrics (Admin/LCC global, Teacher own-domain)" },
    { name: "System", description: "Health" },
  ],
  components: {
    securitySchemes: {
      cookieAuth: { type: "apiKey", in: "cookie", name: "forge.sid" },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
              details: {},
            },
          },
        },
      },
      RoleGrant: {
        type: "object",
        properties: {
          role: { type: "string", enum: ["ADMIN", "LCC", "TEACHER", "MENTOR", "MENTEE"] },
          scopeType: { type: "string", enum: ["GLOBAL", "DOMAIN", "TEAM", "SELF"] },
          scopeId: { type: "string", nullable: true },
        },
      },
      AuthUser: {
        type: "object",
        properties: {
          id: { type: "string" },
          email: { type: "string" },
          fullName: { type: "string" },
          roles: { type: "array", items: { $ref: "#/components/schemas/RoleGrant" } },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          email: { type: "string", format: "email" },
          fullName: { type: "string" },
          status: { type: "string", enum: ["INVITED", "ACTIVE", "SUSPENDED", "DEACTIVATED"] },
          roles: { type: "array", items: { $ref: "#/components/schemas/RoleGrant" } },
        },
      },
      CreateUser: {
        type: "object",
        required: ["email", "fullName", "role"],
        properties: {
          email: { type: "string", format: "email" },
          fullName: { type: "string" },
          role: { type: "string", enum: ["ADMIN", "LCC", "TEACHER", "MENTOR", "MENTEE"] },
          scopeType: { type: "string", enum: ["GLOBAL", "DOMAIN", "TEAM", "SELF"], default: "SELF" },
          scopeId: { type: "string", nullable: true },
          status: { type: "string", enum: ["INVITED", "ACTIVE", "SUSPENDED", "DEACTIVATED"], default: "INVITED" },
        },
      },
      Concern: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          category: { type: "string" },
          severity: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
          status: { type: "string", enum: ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "ESCALATED", "RESOLVED", "CLOSED", "REOPENED"] },
          allowedNext: { type: "array", items: { type: "string" } },
        },
      },
      CreateConcern: {
        type: "object",
        required: ["title", "description", "category"],
        properties: {
          title: { type: "string", minLength: 3 },
          description: { type: "string" },
          category: { type: "string", enum: ["MENTOR", "MENTEE", "TEACHER", "TEAM_MEMBER", "DOMAIN_ISSUE", "TECHNICAL_ISSUE", "PROCESS_ISSUE", "OTHER"] },
          severity: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], default: "MEDIUM" },
          domainId: { type: "string", nullable: true },
          teamId: { type: "string", nullable: true },
          anonymous: { type: "boolean", default: false },
        },
      },
      Transition: {
        type: "object",
        required: ["to"],
        properties: {
          to: { type: "string", enum: ["ACKNOWLEDGED", "IN_PROGRESS", "ESCALATED", "RESOLVED", "CLOSED", "REOPENED"] },
          note: { type: "string" },
        },
      },
      SubmitUpdate: {
        type: "object",
        required: ["workedOn", "learning", "nextGoal"],
        properties: {
          workedOn: { type: "string", maxLength: 500 },
          learning: { type: "string", maxLength: 500 },
          blocker: { type: "string", maxLength: 500, nullable: true },
          nextGoal: { type: "string", maxLength: 500 },
        },
      },
      MentorStatus: {
        type: "object",
        required: ["menteeId", "statusL2"],
        properties: {
          menteeId: { type: "string" },
          statusL2: { type: "string", enum: ["DOING_WELL", "NEEDS_CONSISTENCY", "NO_UPDATES_4PLUS"] },
          comment: { type: "string", maxLength: 1000 },
          actionNeeded: { type: "string", maxLength: 500 },
        },
      },
      WeeklyReview: {
        type: "object",
        required: ["menteeId", "weekNo", "mentorStatus"],
        properties: {
          menteeId: { type: "string" },
          weekNo: { type: "integer", minimum: 1, maximum: 52 },
          progressSummary: { type: "string", maxLength: 2000 },
          strength: { type: "string", maxLength: 1000 },
          improvementArea: { type: "string", maxLength: 1000 },
          mentorStatus: { type: "string", enum: ["ON_TRACK", "AT_RISK", "NEEDS_DISCUSSION"] },
        },
      },
      TeacherDecision: {
        type: "object",
        required: ["decision"],
        properties: {
          decision: { type: "string", enum: ["CONTINUE", "MONITOR", "SCHEDULE_DISCUSSION"] },
          notes: { type: "string", maxLength: 2000 },
        },
      },
      CreateProject: {
        type: "object",
        required: ["teamId", "type", "name"],
        properties: {
          teamId: { type: "string" },
          type: { type: "string", enum: ["GROUP", "INDIVIDUAL"] },
          name: { type: "string", maxLength: 200 },
          ownerId: { type: "string", description: "Required for INDIVIDUAL projects" },
          problemStatement: { type: "string", maxLength: 4000 },
        },
      },
      ProposalDecision: {
        type: "object",
        required: ["decision"],
        properties: {
          decision: { type: "string", enum: ["APPROVED", "REVISE_RESUBMIT", "REJECTED"] },
          feedback: { type: "string", maxLength: 2000 },
        },
      },
      CreateTask: {
        type: "object",
        required: ["projectId", "title"],
        properties: {
          projectId: { type: "string" },
          milestoneId: { type: "string" },
          title: { type: "string", maxLength: 200 },
          description: { type: "string", maxLength: 2000 },
          assigneeId: { type: "string" },
          dueAt: { type: "string", format: "date-time" },
        },
      },
      UpdateTask: {
        type: "object",
        properties: {
          title: { type: "string", maxLength: 200 },
          description: { type: "string", maxLength: 2000 },
          status: { type: "string", enum: ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "RELEASED", "BLOCKED"] },
          progressPct: { type: "integer", minimum: 0, maximum: 100 },
          nextAction: { type: "string", maxLength: 500 },
          dueAt: { type: "string", format: "date-time" },
        },
      },
      CreateMilestone: {
        type: "object",
        required: ["projectId", "name", "sequence"],
        properties: {
          projectId: { type: "string" },
          name: { type: "string", maxLength: 200 },
          sequence: { type: "integer", minimum: 1, maximum: 100 },
          keyOutput: { type: "string", maxLength: 1000 },
          dueAt: { type: "string", format: "date-time" },
        },
      },
      UpdateMilestone: {
        type: "object",
        description: "completionPct + signOff drive the derived status; status is not set directly.",
        properties: {
          name: { type: "string", maxLength: 200 },
          keyOutput: { type: "string", maxLength: 1000 },
          dueAt: { type: "string", format: "date-time" },
          completionPct: { type: "integer", minimum: 0, maximum: 100 },
          signOff: { type: "boolean" },
        },
      },
      SubmitDeliverable: {
        type: "object",
        required: ["projectId", "artifactUrl"],
        properties: {
          projectId: { type: "string" },
          milestoneId: { type: "string" },
          typeId: { type: "string" },
          artifactUrl: { type: "string", format: "uri", maxLength: 2000 },
        },
      },
      ReviewDeliverable: {
        type: "object",
        required: ["decision"],
        properties: {
          decision: { type: "string", enum: ["APPROVED", "REJECTED"] },
          feedback: { type: "string", maxLength: 2000 },
        },
      },
      SubmitMentorFeedback: {
        type: "object",
        required: ["mentorId", "mentorAvailable", "feedbackUseful"],
        properties: {
          mentorId: { type: "string" },
          mentorAvailable: { type: "boolean" },
          feedbackUseful: { type: "boolean" },
          comments: { type: "string", maxLength: 1000 },
        },
      },
      IssueDemerit: {
        type: "object",
        required: ["userId", "reason"],
        properties: {
          userId: { type: "string" },
          reason: { type: "string", maxLength: 1000 },
          points: { type: "integer", minimum: 1, maximum: 100, default: 1 },
          policyRef: { type: "string", maxLength: 200 },
          escalated: { type: "boolean", default: false },
        },
      },
      UpdateDemerit: {
        type: "object",
        properties: {
          reason: { type: "string", maxLength: 1000 },
          points: { type: "integer", minimum: 1, maximum: 100 },
          policyRef: { type: "string", maxLength: 200 },
          escalated: { type: "boolean" },
        },
      },
      CreateEvent: {
        type: "object",
        required: ["title", "type", "startsAt"],
        properties: {
          title: { type: "string", maxLength: 300 },
          type: { type: "string", enum: ["MENTOR_MEETING", "REVIEW", "DEADLINE", "MILESTONE", "EVENT"] },
          scopeType: { type: "string", enum: ["GLOBAL", "DOMAIN", "TEAM", "PERSONAL"], default: "PERSONAL" },
          scopeId: { type: "string", description: "domain/team id (PERSONAL is pinned to the creator)" },
          startsAt: { type: "string", format: "date-time" },
          endsAt: { type: "string", format: "date-time" },
          attendees: { type: "array", items: { type: "string", format: "email" }, maxItems: 100 },
        },
      },
      Target: {
        type: "object",
        description: "Recipient targeting; omitted fields widen the audience.",
        properties: {
          domainId: { type: "string" },
          teamId: { type: "string" },
          role: { type: "string", enum: ["MENTEE", "MENTOR", "TEACHER", "LCC", "ADMIN", "ALL"] },
        },
      },
      SendEmail: {
        type: "object",
        required: ["subject", "body", "to"],
        properties: {
          subject: { type: "string", maxLength: 300 },
          body: { type: "string", maxLength: 20000 },
          to: { type: "array", items: { type: "string", format: "email" }, maxItems: 200 },
          cc: { type: "array", items: { type: "string", format: "email" }, maxItems: 50 },
          templateId: { type: "string" },
        },
      },
      BulkSend: {
        type: "object",
        required: ["subject", "body", "target"],
        properties: {
          subject: { type: "string", maxLength: 300 },
          body: { type: "string", maxLength: 20000 },
          target: { $ref: "#/components/schemas/Target" },
          scheduledAt: { type: "string", format: "date-time" },
          templateId: { type: "string" },
        },
      },
      Announcement: {
        type: "object",
        required: ["title", "body"],
        properties: {
          title: { type: "string", maxLength: 200 },
          body: { type: "string", maxLength: 5000 },
          scopeType: { type: "string", enum: ["GLOBAL", "DOMAIN", "TEAM"], default: "GLOBAL" },
          scopeId: { type: "string" },
          channels: { type: "array", items: { type: "string", enum: ["inapp", "email"] }, default: ["inapp"] },
          target: { $ref: "#/components/schemas/Target" },
        },
      },
      CreateDomain: {
        type: "object",
        required: ["key", "name"],
        properties: { key: { type: "string", maxLength: 20 }, name: { type: "string", maxLength: 200 } },
      },
      UpdateDomain: {
        type: "object",
        properties: { key: { type: "string", maxLength: 20 }, name: { type: "string", maxLength: 200 }, active: { type: "boolean" } },
      },
      CreateTeam: {
        type: "object",
        required: ["domainId", "name"],
        properties: {
          domainId: { type: "string" },
          name: { type: "string", maxLength: 200 },
          alias: { type: "string", enum: ["POD", "GROUP", "TEAM", "SQUAD"], default: "TEAM" },
          mentorId: { type: "string" },
          githubRepoUrl: { type: "string", format: "uri" },
          discordChannelId: { type: "string" },
        },
      },
      UpdateTeam: {
        type: "object",
        properties: {
          name: { type: "string", maxLength: 200 },
          alias: { type: "string", enum: ["POD", "GROUP", "TEAM", "SQUAD"] },
          mentorId: { type: "string", nullable: true },
          githubRepoUrl: { type: "string", format: "uri", nullable: true },
          discordChannelId: { type: "string", nullable: true },
        },
      },
      AddMember: {
        type: "object",
        required: ["userId", "memberRole"],
        properties: { userId: { type: "string" }, memberRole: { type: "string", maxLength: 50 }, squadId: { type: "string" } },
      },
      CreatePhase: {
        type: "object",
        required: ["name", "sequence"],
        properties: {
          name: { type: "string", maxLength: 200 },
          sequence: { type: "integer", minimum: 1, maximum: 100 },
          startsAt: { type: "string", format: "date-time" },
          endsAt: { type: "string", format: "date-time" },
          theme: { type: "string", maxLength: 500 },
          domainId: { type: "string", nullable: true, description: "null = all domains" },
        },
      },
      CreateGate: {
        type: "object",
        required: ["phaseId", "name"],
        properties: {
          phaseId: { type: "string" },
          name: { type: "string", maxLength: 200 },
          scheduledAt: { type: "string", format: "date-time" },
          verdictOptions: { type: "array", items: { type: "string" } },
          blocksProgression: { type: "boolean", default: true },
          domainId: { type: "string", nullable: true },
        },
      },
      CreateCycle: {
        type: "object",
        required: ["level", "ownerRole", "intervalValue", "intervalUnit"],
        properties: {
          level: { type: "string", enum: ["L1", "L2", "L3", "L4"] },
          ownerRole: { type: "string", enum: ["ADMIN", "LCC", "TEACHER", "MENTOR", "MENTEE"] },
          intervalValue: { type: "integer", minimum: 1, maximum: 365 },
          intervalUnit: { type: "string", enum: ["DAY", "WEEK", "MONTH"] },
          anchorDay: { type: "string", description: "weekday for weekly cadences" },
          fieldSchema: { type: "object" },
          statusEnum: { type: "array", items: { type: "string" } },
          domainId: { type: "string", nullable: true },
        },
      },
      CreateEscalation: {
        type: "object",
        required: ["name", "thresholdValue", "thresholdUnit", "action"],
        properties: {
          name: { type: "string", maxLength: 200 },
          condition: { type: "object" },
          thresholdValue: { type: "integer", minimum: 1, maximum: 1000 },
          thresholdUnit: { type: "string", enum: ["days", "updates", "hours"] },
          action: { type: "string", enum: ["FLAG", "NOTIFY", "ESCALATE"] },
          targetRole: { type: "string", enum: ["ADMIN", "LCC", "TEACHER", "MENTOR", "MENTEE"] },
          severity: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
          domainId: { type: "string", nullable: true },
        },
      },
      CreateRubric: {
        type: "object",
        required: ["name", "kind"],
        properties: {
          name: { type: "string", maxLength: 200 },
          kind: { type: "string", enum: ["GATE", "TOP_TEAM", "MENTOR"] },
          domainId: { type: "string", nullable: true },
        },
      },
      CreateDimension: {
        type: "object",
        required: ["name", "weight", "measuredBy"],
        properties: {
          name: { type: "string", maxLength: 200 },
          weight: { type: "number", minimum: 0, maximum: 100 },
          measuredBy: { type: "string", maxLength: 500 },
        },
      },
    },
  },
  security: [{ cookieAuth: [] }],
  paths: {
    "/health": {
      get: { tags: ["System"], summary: "Liveness/health probe", security: [], responses: { "200": { description: "OK" } } },
    },
    "/auth/google": {
      get: { tags: ["Auth"], summary: "Begin Google login (redirect)", security: [], responses: { "302": { description: "Redirect to Google" } } },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"], summary: "Current authenticated user",
        responses: {
          "200": { description: "The session user", content: { "application/json": { schema: { type: "object", properties: { user: { $ref: "#/components/schemas/AuthUser" } } } } } },
          "401": { description: "Not authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/auth/logout": { post: { tags: ["Auth"], summary: "Destroy the session", responses: { "200": { description: "Logged out" } } } },
    "/auth/csrf": { get: { tags: ["Auth"], summary: "Read the CSRF token (echo as x-csrf-token on writes)", responses: { "200": { description: "Token" } } } },

    "/users": {
      get: { tags: ["Users"], summary: "List users", parameters: [{ name: "status", in: "query", schema: { type: "string" } }, { name: "take", in: "query", schema: { type: "integer" } }, { name: "skip", in: "query", schema: { type: "integer" } }], responses: { "200": { description: "Users page" }, "403": { description: "Forbidden" } } },
      post: { tags: ["Users"], summary: "Create (provision) a user", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateUser" } } } }, responses: { "201": { description: "Created", content: { "application/json": { schema: { type: "object", properties: { user: { $ref: "#/components/schemas/User" } } } } } }, "409": { description: "Email exists" } } },
    },
    "/users/{id}": {
      get: { tags: ["Users"], summary: "Get a user", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "User" }, "404": { description: "Not found" } } },
      patch: { tags: ["Users"], summary: "Update a user (name/status)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { content: { "application/json": { schema: { type: "object", properties: { fullName: { type: "string" }, status: { type: "string" } } } } } }, responses: { "200": { description: "Updated" } } },
    },
    "/users/{id}/roles": {
      post: { tags: ["Users"], summary: "Assign a role grant", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/RoleGrant" } } } }, responses: { "200": { description: "Updated user" } } },
    },

    "/org/domains": {
      get: { tags: ["Org"], summary: "Domains in scope", responses: { "200": { description: "Domains" } } },
      post: { tags: ["Org"], summary: "Create a domain (Admin)", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateDomain" } } } }, responses: { "201": { description: "Created" }, "409": { description: "Key exists" } } },
    },
    "/org/domains/{id}": { patch: { tags: ["Org"], summary: "Update a domain (Admin)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateDomain" } } } }, responses: { "200": { description: "Updated" }, "404": { description: "Not found" } } } },
    "/org/teams": {
      get: { tags: ["Org"], summary: "Teams in scope", responses: { "200": { description: "Teams" } } },
      post: { tags: ["Org"], summary: "Create a team (Admin/LCC/Teacher)", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateTeam" } } } }, responses: { "201": { description: "Created" }, "403": { description: "Domain out of scope" } } },
    },
    "/org/teams/{id}": { patch: { tags: ["Org"], summary: "Update a team", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateTeam" } } } }, responses: { "200": { description: "Updated" }, "403": { description: "Out of scope" }, "404": { description: "Not found" } } } },
    "/org/teams/{id}/members": { post: { tags: ["Org"], summary: "Add a team member", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/AddMember" } } } }, responses: { "201": { description: "Added" }, "403": { description: "Out of scope" } } } },
    "/org/teams/{id}/members/{userId}": { delete: { tags: ["Org"], summary: "Remove a team member", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }, { name: "userId", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Removed" }, "404": { description: "Membership not found" } } } },

    "/audit": { get: { tags: ["Audit"], summary: "Read the audit log (Admin/LCC)", parameters: [{ name: "entityType", in: "query", schema: { type: "string" } }, { name: "entityId", in: "query", schema: { type: "string" } }, { name: "actorId", in: "query", schema: { type: "string" } }, { name: "action", in: "query", schema: { type: "string" } }, { name: "take", in: "query", schema: { type: "integer" } }, { name: "skip", in: "query", schema: { type: "integer" } }], responses: { "200": { description: "Audit entries (newest first) + total" } } } },

    "/analytics/overview": { get: { tags: ["Analytics"], summary: "Headline KPIs + at-risk signals (scope-filtered)", responses: { "200": { description: "Totals + signals" }, "403": { description: "Forbidden" } } } },
    "/analytics/domains": { get: { tags: ["Analytics"], summary: "Per-domain rollup (teams/students/mentors)", responses: { "200": { description: "Domain rollups" }, "403": { description: "Forbidden" } } } },
    "/analytics/teams": { get: { tags: ["Analytics"], summary: "Per-team rollup (members/mentor)", responses: { "200": { description: "Team rollups" }, "403": { description: "Forbidden" } } } },

    "/notifications": { get: { tags: ["Notifications"], summary: "List your notifications (+ unread count)", parameters: [{ name: "unread", in: "query", schema: { type: "boolean" } }, { name: "take", in: "query", schema: { type: "integer" } }, { name: "skip", in: "query", schema: { type: "integer" } }], responses: { "200": { description: "Notifications + unread count" } } } },
    "/notifications/unread-count": { get: { tags: ["Notifications"], summary: "Your unread count (for the bell badge)", responses: { "200": { description: "{ unread }" } } } },
    "/notifications/read-all": { post: { tags: ["Notifications"], summary: "Mark all your notifications read", responses: { "200": { description: "{ updated }" } } } },
    "/notifications/{id}/read": { post: { tags: ["Notifications"], summary: "Mark one notification read", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "{ updated }" } } } },

    "/email/send": { post: { tags: ["Email"], summary: "Send to explicit addresses", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/SendEmail" } } } }, responses: { "201": { description: "Sent/scheduled" }, "400": { description: "Delivery failed" } } } },
    "/email/bulk": { post: { tags: ["Email"], summary: "Targeted bulk send (capped)", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/BulkSend" } } } }, responses: { "201": { description: "Sent/scheduled + count" }, "400": { description: "No recipients / delivery failed" } } } },
    "/email/templates": { get: { tags: ["Email"], summary: "List saved templates", responses: { "200": { description: "Templates" } } } },
    "/email/announcements": { post: { tags: ["Email"], summary: "Send an announcement (in-app + optional email)", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Announcement" } } } }, responses: { "201": { description: "Announced + notified count" } } } },

    "/integrations/github/webhook": { post: { tags: ["GitHub"], summary: "GitHub webhook receiver (HMAC-verified, public)", security: [], description: "Authenticated by the X-Hub-Signature-256 header — not a session cookie. Records push/PR/issue/review activity.", responses: { "200": { description: "Ingested { event, recorded }" }, "403": { description: "Invalid signature" } } } },
    "/integrations/github/activity": { get: { tags: ["GitHub"], summary: "List recorded GitHub activity in scope", parameters: [{ name: "teamId", in: "query", schema: { type: "string" } }, { name: "take", in: "query", schema: { type: "integer" } }, { name: "skip", in: "query", schema: { type: "integer" } }], responses: { "200": { description: "Activity" } } } },
    "/integrations/github/status": { get: { tags: ["GitHub"], summary: "GitHub integration status (Admin)", responses: { "200": { description: "{ webhookConfigured, apiTokenConfigured }" } } } },
    "/integrations/github/check": { get: { tags: ["GitHub"], summary: "Live connectivity probe — token can read the org (Admin)", responses: { "200": { description: "{ ok, org, repos } or { ok:false, message }" } } } },
    "/integrations/github/org": { get: { tags: ["GitHub"], summary: "AI-domain org overview (live)", responses: { "200": { description: "org login, repo/project/team counts, repo list" } } } },
    "/integrations/github/projects": { get: { tags: ["GitHub"], summary: "Projects (repos grouped by <project>_<teamN>)", responses: { "200": { description: "projects with their team-repos" } } } },
    "/integrations/github/projects/{key}": { get: { tags: ["GitHub"], summary: "Project comparison — team-repos of one project", parameters: [{ name: "key", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "per-team analytics" } } } },
    "/integrations/github/repos/{repo}": { get: { tags: ["GitHub"], summary: "Repo detail (issues, PRs, milestones, commits, contributors)", parameters: [{ name: "repo", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "normalized repo detail" } } } },
    "/integrations/github/repos/{repo}/analytics": { get: { tags: ["GitHub"], summary: "Per-repo (team) analytics", parameters: [{ name: "repo", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "issue/PR/commit/milestone rollup" } } } },
    "/integrations/github/teams": { get: { tags: ["GitHub"], summary: "Org Teams (mentor + students per repo) — needs token Members:read", responses: { "200": { description: "teams with members + repos" }, "403": { description: "token missing Organization Members read" } } } },

    "/integrations/discord/interactions": { post: { tags: ["Discord"], summary: "Discord interactions receiver (Ed25519-verified, public)", security: [], description: "Authenticated by X-Signature-Ed25519 over (timestamp + raw body). PING → PONG; other interactions are recorded as activity.", responses: { "200": { description: "Interaction response (PONG or message)" }, "403": { description: "Invalid signature" } } } },
    "/integrations/discord/activity": { get: { tags: ["Discord"], summary: "List recorded Discord activity in scope", parameters: [{ name: "teamId", in: "query", schema: { type: "string" } }, { name: "take", in: "query", schema: { type: "integer" } }, { name: "skip", in: "query", schema: { type: "integer" } }], responses: { "200": { description: "Activity" } } } },
    "/integrations/discord/status": { get: { tags: ["Discord"], summary: "Discord integration status (Admin)", responses: { "200": { description: "{ interactionsConfigured, botConfigured }" } } } },
    "/integrations/discord/check": { get: { tags: ["Discord"], summary: "Live bot connectivity probe (Admin)", responses: { "200": { description: "{ ok, bot, guilds } or { ok:false, message }" } } } },

    "/calendar/events": {
      get: { tags: ["Calendar"], summary: "List events in scope", parameters: [{ name: "from", in: "query", schema: { type: "string", format: "date-time" } }, { name: "to", in: "query", schema: { type: "string", format: "date-time" } }], responses: { "200": { description: "Events" } } },
      post: { tags: ["Calendar"], summary: "Create an event (best-effort Google sync)", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateEvent" } } } }, responses: { "201": { description: "Created" }, "403": { description: "Scope not allowed" } } },
    },
    "/calendar/status": { get: { tags: ["Calendar"], summary: "Calendar provider status (Admin)", responses: { "200": { description: "{ provider, googleConfigured }" } } } },
    "/calendar/check": { get: { tags: ["Calendar"], summary: "Live provider connectivity probe (Admin)", responses: { "200": { description: "{ ok, provider, calendarId } or { ok:false, message }" } } } },

    "/assistant/ask": { post: { tags: ["Assistant"], summary: "Ask the AI assistant (rate-limited)", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["prompt"], properties: { prompt: { type: "string", maxLength: 4000 } } } } } }, responses: { "200": { description: "{ text }" }, "400": { description: "Not configured / request failed" }, "429": { description: "Rate limited" } } } },
    "/assistant/summarize": { post: { tags: ["Assistant"], summary: "Summarize a mentee's recent updates (scoped)", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["menteeId"], properties: { menteeId: { type: "string" } } } } } }, responses: { "200": { description: "{ summary, updatesConsidered }" }, "400": { description: "No visible updates" } } } },

    "/jobs/auto-flags/run": { post: { tags: ["Jobs"], summary: "Manually run the auto-flag / escalation job (Admin)", description: "Same job the scheduler runs on JOBS_INTERVAL_MINUTES. Evaluates escalation rules against mentee update history and notifies (deduped per rule+user per 24h).", responses: { "200": { description: "{ scanned, rules, outcomes, notified }" }, "403": { description: "Forbidden" } } } },

    "/concerns": {
      get: { tags: ["Concerns"], summary: "List concerns in scope", parameters: [{ name: "status", in: "query", schema: { type: "string" } }, { name: "domain", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Concerns page" } } },
      post: { tags: ["Concerns"], summary: "Raise a concern", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateConcern" } } } }, responses: { "201": { description: "Created", content: { "application/json": { schema: { type: "object", properties: { concern: { $ref: "#/components/schemas/Concern" } } } } } } } },
    },
    "/concerns/{id}": { get: { tags: ["Concerns"], summary: "Get a concern (with timeline)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Concern" }, "403": { description: "Out of scope" }, "404": { description: "Not found" } } } },
    "/concerns/{id}/transition": { post: { tags: ["Concerns"], summary: "Advance the concern lifecycle", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Transition" } } } }, responses: { "200": { description: "Updated" }, "400": { description: "Illegal transition" } } } },

    "/reviews/updates": {
      get: { tags: ["Reviews"], summary: "L1 — list mentee updates in scope", parameters: [{ name: "menteeId", in: "query", schema: { type: "string" } }, { name: "take", in: "query", schema: { type: "integer" } }, { name: "skip", in: "query", schema: { type: "integer" } }], responses: { "200": { description: "Updates page" } } },
      post: { tags: ["Reviews"], summary: "L1 — submit a mentee update", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/SubmitUpdate" } } } }, responses: { "201": { description: "Created" } } },
    },
    "/reviews/mentees": { get: { tags: ["Reviews"], summary: "L2 — mentor dashboard (computed metrics)", responses: { "200": { description: "Mentees with metrics" }, "403": { description: "Forbidden" } } } },
    "/reviews/mentor-status": { post: { tags: ["Reviews"], summary: "L2 — set a mentee's status", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/MentorStatus" } } } }, responses: { "201": { description: "Created" }, "403": { description: "Not your mentee" } } } },
    "/reviews/weekly": {
      get: { tags: ["Reviews"], summary: "L3/L4 — list weekly reviews in scope", parameters: [{ name: "weekNo", in: "query", schema: { type: "integer" } }, { name: "take", in: "query", schema: { type: "integer" } }, { name: "skip", in: "query", schema: { type: "integer" } }], responses: { "200": { description: "Weekly reviews page" } } },
      post: { tags: ["Reviews"], summary: "L3 — upsert the mentor weekly review", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/WeeklyReview" } } } }, responses: { "201": { description: "Upserted" } } },
    },
    "/reviews/weekly/{id}/decision": { post: { tags: ["Reviews"], summary: "L4 — teacher decision (domain-scoped)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/TeacherDecision" } } } }, responses: { "200": { description: "Decided" }, "403": { description: "Outside your domain" }, "404": { description: "Not found" } } } },

    "/projects": {
      get: { tags: ["Projects"], summary: "List projects in scope", parameters: [{ name: "teamId", in: "query", schema: { type: "string" } }, { name: "type", in: "query", schema: { type: "string", enum: ["GROUP", "INDIVIDUAL"] } }], responses: { "200": { description: "Projects page" } } },
      post: { tags: ["Projects"], summary: "Create a project", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateProject" } } } }, responses: { "201": { description: "Created" }, "403": { description: "Not allowed for this team" } } },
    },
    "/projects/{id}/proposal-decision": { post: { tags: ["Projects"], summary: "Faculty gate verdict on a proposal", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ProposalDecision" } } } }, responses: { "200": { description: "Decided" }, "403": { description: "Out of scope" }, "404": { description: "Not found" } } } },

    "/tasks": {
      get: { tags: ["Tasks"], summary: "List tasks in scope", parameters: [{ name: "projectId", in: "query", schema: { type: "string" } }, { name: "assigneeId", in: "query", schema: { type: "string" } }, { name: "status", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Tasks page" } } },
      post: { tags: ["Tasks"], summary: "Assign a task", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateTask" } } } }, responses: { "201": { description: "Created" }, "400": { description: "Assignee not on team" }, "403": { description: "Not allowed for this project" } } },
    },
    "/tasks/{id}": { patch: { tags: ["Tasks"], summary: "Update progress/status (assignee or manager)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateTask" } } } }, responses: { "200": { description: "Updated" }, "403": { description: "Not allowed" }, "404": { description: "Not found" } } } },

    "/milestones": {
      get: { tags: ["Milestones"], summary: "List milestones in scope", parameters: [{ name: "projectId", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Milestones page" } } },
      post: { tags: ["Milestones"], summary: "Create a milestone", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateMilestone" } } } }, responses: { "201": { description: "Created" }, "403": { description: "Not allowed for this project" } } },
    },
    "/milestones/{id}": { patch: { tags: ["Milestones"], summary: "Update progress / faculty sign-off", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateMilestone" } } } }, responses: { "200": { description: "Updated" }, "403": { description: "Out of scope" }, "404": { description: "Not found" } } } },

    "/deliverables": {
      get: { tags: ["Deliverables"], summary: "List deliverables in scope", parameters: [{ name: "projectId", in: "query", schema: { type: "string" } }, { name: "reviewStatus", in: "query", schema: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"] } }], responses: { "200": { description: "Deliverables page" } } },
      post: { tags: ["Deliverables"], summary: "Submit a deliverable artifact", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/SubmitDeliverable" } } } }, responses: { "201": { description: "Created" }, "403": { description: "Not allowed for this project" } } },
    },
    "/deliverables/{id}/review": { post: { tags: ["Deliverables"], summary: "Approve/reject a deliverable", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ReviewDeliverable" } } } }, responses: { "200": { description: "Reviewed" }, "409": { description: "Already reviewed" }, "403": { description: "Out of scope" } } } },

    "/feedback/mentor": {
      get: { tags: ["Feedback"], summary: "List 360° mentor feedback in scope", parameters: [{ name: "mentorId", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Feedback page" } } },
      post: { tags: ["Feedback"], summary: "Submit a 360° mentor rating (mentee)", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/SubmitMentorFeedback" } } } }, responses: { "201": { description: "Created" }, "403": { description: "Not your mentor" } } },
    },

    "/demerits": {
      get: { tags: ["Demerits"], summary: "List demerits in scope", parameters: [{ name: "userId", in: "query", schema: { type: "string" } }, { name: "escalated", in: "query", schema: { type: "boolean" } }], responses: { "200": { description: "Demerits page" } } },
      post: { tags: ["Demerits"], summary: "Issue a demerit (Admin/LCC)", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/IssueDemerit" } } } }, responses: { "201": { description: "Created" }, "404": { description: "User not found" } } },
    },
    "/demerits/{id}": { patch: { tags: ["Demerits"], summary: "Amend a demerit (Admin/LCC)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateDemerit" } } } }, responses: { "200": { description: "Updated" }, "404": { description: "Not found / out of scope" } } } },

    "/config/phases": {
      get: { tags: ["Config"], summary: "List phases in scope", parameters: [{ name: "domainId", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Phases" } } },
      post: { tags: ["Config"], summary: "Create a phase", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreatePhase" } } } }, responses: { "201": { description: "Created" }, "403": { description: "Domain out of scope" } } },
    },
    "/config/phases/{id}": { patch: { tags: ["Config"], summary: "Update a phase (partial)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreatePhase" } } } }, responses: { "200": { description: "Updated" }, "403": { description: "Out of scope" }, "404": { description: "Not found" } } } },
    "/config/gates": {
      get: { tags: ["Config"], summary: "List gates in scope", parameters: [{ name: "domainId", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Gates" } } },
      post: { tags: ["Config"], summary: "Create a gate", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateGate" } } } }, responses: { "201": { description: "Created" }, "400": { description: "Phase not found" }, "403": { description: "Out of scope" } } },
    },
    "/config/gates/{id}": { patch: { tags: ["Config"], summary: "Update a gate (partial)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateGate" } } } }, responses: { "200": { description: "Updated" }, "404": { description: "Not found" } } } },
    "/config/cycles": {
      get: { tags: ["Config"], summary: "List review cycles in scope", parameters: [{ name: "domainId", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Cycles" } } },
      post: { tags: ["Config"], summary: "Create a review cycle", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateCycle" } } } }, responses: { "201": { description: "Created" }, "403": { description: "Out of scope" } } },
    },
    "/config/cycles/{id}": { patch: { tags: ["Config"], summary: "Update a review cycle (partial)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateCycle" } } } }, responses: { "200": { description: "Updated" }, "404": { description: "Not found" } } } },
    "/config/escalations": {
      get: { tags: ["Config"], summary: "List escalation rules in scope", parameters: [{ name: "domainId", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Rules" } } },
      post: { tags: ["Config"], summary: "Create an escalation rule", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateEscalation" } } } }, responses: { "201": { description: "Created" }, "403": { description: "Out of scope" } } },
    },
    "/config/escalations/{id}": { patch: { tags: ["Config"], summary: "Update an escalation rule (partial)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateEscalation" } } } }, responses: { "200": { description: "Updated" }, "404": { description: "Not found" } } } },
    "/config/rubrics": {
      get: { tags: ["Config"], summary: "List rubrics (with dimensions) in scope", parameters: [{ name: "domainId", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Rubrics" } } },
      post: { tags: ["Config"], summary: "Create a rubric", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateRubric" } } } }, responses: { "201": { description: "Created" }, "403": { description: "Out of scope" } } },
    },
    "/config/rubrics/{id}": { patch: { tags: ["Config"], summary: "Update a rubric (partial)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateRubric" } } } }, responses: { "200": { description: "Updated" }, "404": { description: "Not found" } } } },
    "/config/rubrics/{rubricId}/dimensions": { post: { tags: ["Config"], summary: "Add a dimension to a rubric", parameters: [{ name: "rubricId", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateDimension" } } } }, responses: { "201": { description: "Created" }, "404": { description: "Rubric not found" } } } },
    "/config/dimensions/{id}": { patch: { tags: ["Config"], summary: "Update a rubric dimension (partial)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateDimension" } } } }, responses: { "200": { description: "Updated" }, "404": { description: "Not found" } } } },
  },
};
