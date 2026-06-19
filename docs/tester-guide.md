# Tester Guide — Forge Testing Portal

Step-by-step instructions for authorized testers validating Forge before production.
**Presentation mode** — everything is mock data; you cannot break anything.

## Who can test
Only these accounts have access (gated by email):

| Tester | Role validated |
|---|---|
| Shaik Tajuddin (`shaik.tajuddin2024@…`) | **Testing Admin** (full control) |
| Learner Career Council (`learnercareercouncil@…`) | LCC |
| Abhinav Choudhary (`abhinav.choudhary2024@…`) | Teacher |
| Aniket Pathak (`aniket.pathak2024@…`) | Mentor |
| Anwesha Adhikari (`anwesha.adhikari2024@…`) | Team Lead |
| Khushi (`khushi.2024@…`) | Mentee |
| Nikith S (`nikith.s2024@…`) | Mentee |

> In presentation mode there's no real login, so the portal includes a **"Switch tester"**
> selector to experience it as any of the above. In production, access is gated by your
> signed-in email and the selector is removed.

## Getting started
1. Open the app and click **Testing Portal** in the sidebar (General section).
2. You'll see the four domains — **AI · ML · DVA · SDSE** — each with a status:
   **Not Started · In Progress · Completed** and a progress bar (handled / total steps).
3. (Optional) Use **Switch tester** to validate as a specific role.

## Running a domain
1. Click **Start Testing** on a domain (it becomes **Resume Testing** once you begin).
2. You enter the guided runner. For every step you'll see:
   - **Act as <role>** — which role to validate as
   - **Current step** — exactly what to do
   - **Expected result** — what you should see
   - **Success criteria** — how to know it passed
3. Use the step buttons:
   - **Start Step** — begin the step
   - **Mark as Done** — it passed; advances to the next step
   - **Skip** — skip for now (you can return via the checklist)
   - **Report Issue** — log a problem (Title · Description · Severity · screenshot placeholder)
4. The **Testing checklist** on the page shows all steps in sequence — done (✓), skipped, or
   current. Click any step to jump to it.
5. The **Domain environment** panel shows the auto-populated teachers/mentors/team leads/
   students/teams/repositories/milestones/deliverables for that domain.

## Resume & completion
- **Resume:** your progress is saved automatically (per browser). Leave and return any time —
  the domain reopens where you left off.
- **Completion:** when every step is handled (done or skipped), the domain shows
  **Domain Completed** and step actions are disabled. You can **Reset domain** to run it again.

## Reporting issues
On any step, click **Report Issue** and fill in Title, Description, and Severity
(Low/Medium/High/Critical). Reported issues appear in the **Reported issues** panel for that
domain. In production these email `shaik.tajuddin2024@nst.rishihood.edu.in`.

## What to focus on
- Does each screen render correctly for the role?
- Does the domain structure match reality (AI org / ML per-student repos / DVA·SDSE shared)?
- Are the workflows clear and complete?
- Anything confusing, broken, or missing → **Report Issue** with details.

## Limitations in presentation mode (won't work yet — by design)
- No real login, emails, or external connections (GitHub/Discord/Calendar are mocked).
- GitHub repositories and activity are sample data.
- Progress is stored in your browser only (not synced across devices).
These are implemented in Phase 2 after the testing experience is approved.
