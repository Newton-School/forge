import { describe, it, expect } from "vitest";
import { toOverview, toCollaborator, toPull, eventsToActivity } from "./repo.read.js";
import type { GhRepoDetail, GhCollaborator, GhPullItem, GhEvent } from "./repo.api.js";

describe("toOverview", () => {
  it("maps a repo detail to the dashboard overview", () => {
    const d = {
      name: "viz", full_name: "ananya/viz", private: false, description: "charts",
      default_branch: "main", topics: ["d3"], owner: { login: "ananya", type: "User" },
      open_issues_count: 3, has_issues: true, pushed_at: "2026-06-16", created_at: "2026-05-01",
    } as GhRepoDetail;
    const o = toOverview(d, "ananya", "viz");
    expect(o).toMatchObject({ fullName: "ananya/viz", visibility: "public", defaultBranch: "main", hasIssues: true, openIssues: 3 });
  });
  it("flags private repos", () => {
    const d = { private: true, topics: undefined, owner: { login: "x", type: "User" } } as unknown as GhRepoDetail;
    expect(toOverview(d, "x", "r").visibility).toBe("private");
    expect(toOverview(d, "x", "r").topics).toEqual([]);
  });
});

describe("toCollaborator", () => {
  const mk = (login: string, perms: Partial<NonNullable<GhCollaborator["permissions"]>>): GhCollaborator =>
    ({ login, permissions: { admin: false, push: false, pull: true, ...perms } });
  it("marks the repo owner as owner", () => {
    expect(toCollaborator(mk("ana", { admin: true }), "ana")).toMatchObject({ repoRole: "owner", permission: "admin" });
  });
  it("maps push → write/maintainer and pull → read/collaborator", () => {
    expect(toCollaborator(mk("stu", { push: true }), "ana")).toMatchObject({ permission: "write", repoRole: "collaborator" });
    expect(toCollaborator(mk("ro", { pull: true }), "ana")).toMatchObject({ permission: "read", repoRole: "collaborator" });
    expect(toCollaborator(mk("mtr", { admin: true }), "ana")).toMatchObject({ permission: "admin", repoRole: "maintainer" });
  });
});

describe("toPull", () => {
  const base = { number: 7, title: "x", state: "closed" as const, user: { login: "a" }, created_at: "2026-06-01" };
  it("derives merged from merged_at", () => {
    expect(toPull({ ...base, merged_at: "2026-06-02" } as GhPullItem).state).toBe("merged");
    expect(toPull({ ...base, merged_at: null } as GhPullItem).state).toBe("closed");
    expect(toPull({ ...base, state: "open", merged_at: null } as GhPullItem).state).toBe("open");
  });
  it("extracts requested reviewers", () => {
    expect(toPull({ ...base, merged_at: null, requested_reviewers: [{ login: "m" }] } as GhPullItem).reviewers).toEqual(["m"]);
  });
});

describe("eventsToActivity", () => {
  it("maps push / merged PR / release / branch events and drops the rest", () => {
    const events: GhEvent[] = [
      { type: "PushEvent", actor: { login: "a" }, created_at: "t1", payload: { commits: [1, 2] } },
      { type: "PullRequestEvent", actor: { login: "b" }, created_at: "t2", payload: { action: "closed", pull_request: { number: 5, title: "feat", merged: true } } },
      { type: "PullRequestEvent", actor: { login: "b" }, created_at: "t3", payload: { action: "opened", pull_request: { number: 6, title: "wip", merged: false } } },
      { type: "ReleaseEvent", actor: { login: "c" }, created_at: "t4", payload: { release: { tag_name: "v1" } } },
      { type: "CreateEvent", actor: { login: "d" }, created_at: "t5", payload: { ref: "feat/x", ref_type: "branch" } },
      { type: "WatchEvent", actor: { login: "e" }, created_at: "t6", payload: {} },
    ];
    const out = eventsToActivity(events);
    expect(out.map((a) => a.kind)).toEqual(["commit", "pr_merged", "pr_opened", "release", "branch"]);
    expect(out[0]).toMatchObject({ who: "a", what: "pushed 2 commits" });
    expect(out[1].what).toContain("#5");
  });
});
