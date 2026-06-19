# Role Test Cases

Test cases per role, validated through the Testing Portal across all four domains.
Each case lists the **action**, **expected result**, and **success criteria**. (Note: "Team
Lead" is the student mentor / team lead — in the production RBAC this is the Mentor role
leading the team; for testing it's surfaced as a distinct experience.)

## Admin
| Test case | Expected result | Success criteria |
|---|---|---|
| Invite a user | Invitation created, shown as Pending | Appears in the invitations list |
| Assign role | Role saved on the user | User shows the assigned role |
| Assign domain | Domain saved on the user | User shows the assigned domain |
| Manage domains | Domains list + rollups render | Domains table renders correctly |
| Manage integrations | Integration status per team renders | Integrations page renders |
| Verify access | Created user appears with correct role/status | Access + status correct |

## LCC
| Test case | Expected result | Success criteria |
|---|---|---|
| User onboarding | Onboarding list with status renders | Invited users + status visible |
| Communications (Email Center) | Compose + target + templates render | Email center renders |
| Team management | Teams + members render | Team views render |
| Concerns queue | Concerns list + SLA render | Concerns triage works |
| Calendar (connect + event) | Connected calendar + new event visible | Event creation + visibility work |

## Teacher
| Test case | Expected result | Success criteria |
|---|---|---|
| Domain analytics | Teams/students/completion/at-risk rollups | Domain analytics render |
| Team tracking | Teams list + drill-down render | Team tracking works |
| Progress tracking | Milestones + reviews per team | Progress visible |
| GitHub (domain-specific) | AI org / ML per-student / DVA·SDSE shared views | Correct domain structure renders |
| Weekly review decisions | L4 teacher decision flow renders | Review decision works |

## Mentor
| Test case | Expected result | Success criteria |
|---|---|---|
| Repository tracking | Team repository / per-student repos render | Repo views correct per domain |
| Weekly reviews | L3 review form + history render | Review workflow clear |
| Contribution monitoring | Per-student commits/PRs/contributions | Contribution analytics render |
| Mentee performance | L2 status + updates per mentee | Mentee monitoring works |
| Pull requests | Open/merged + pending review | PR review workflow clear |

## Team Lead
| Test case | Expected result | Success criteria |
|---|---|---|
| Team management | Members + deliverables + repo render | Team management view works |
| Deliverables | Deliverables tracked with status | Deliverables visible |
| Repository monitoring | Repository activity/branches/collaborators | Repo monitoring works |

## Mentee
| Test case | Expected result | Success criteria |
|---|---|---|
| My repository | Own repository / contributions render | Repository view works |
| Tasks | Assigned tasks render | Tasks render correctly |
| Milestones | Milestone progress renders | Milestones render |
| Submissions | Bi-daily update + deliverable submit (mock) | Submission workflow clear |
| Contribution analytics | Personal commits/PRs/code changes | Analytics render |

## Domain-specific GitHub cases (summary)
| Domain | Focus |
|---|---|
| **AI** | Org → teams → shared repos → issues → PRs → reviews |
| **ML** | Team → students → individual repositories (compare students) |
| **DVA** | Team → shared repo → deliverables + analytics projects |
| **SDSE** | Team → shared repo → deliverables + engineering work |

## Presentation-mode notes
- All cases run on mock data; no real users, emails, or external connections.
- GitHub/Discord/Calendar "connect" steps show the connected state without real OAuth/sync.
- Issue reports are recorded locally (production emails `shaik.tajuddin2024@nst.rishihood.edu.in`).
