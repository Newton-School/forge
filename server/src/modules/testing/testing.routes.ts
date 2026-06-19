import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../../lib/errors.js";
import * as svc from "./testing.service.js";
import { saveProgressSchema, reportIssueSchema, domainSchema } from "./testing.schema.js";

/** Testing Portal API — gated by the tester email allowlist (see testing.service.assertTester). */
export const testingRouter = Router();

/** Is the caller an authorized tester (and the Testing Admin)? */
testingRouter.get("/whoami", asyncHandler(async (req: Request, res: Response) => {
  res.json(await svc.whoami(req.auth!));
}));

/** The caller's progress across all domains (Resume). */
testingRouter.get("/progress", asyncHandler(async (req: Request, res: Response) => {
  res.json(await svc.getProgress(req.auth!));
}));

/** Upsert the caller's progress for one domain. */
testingRouter.put("/progress/:domain", asyncHandler(async (req: Request, res: Response) => {
  const domain = domainSchema.parse(req.params.domain);
  const data = saveProgressSchema.parse(req.body);
  res.json(await svc.saveProgress(req.auth!, domain, data));
}));

/** Provision a domain's real testing environment (Testing Admin only — creates accounts + sends invites). */
testingRouter.post("/provision/:domain", asyncHandler(async (req: Request, res: Response) => {
  const domain = domainSchema.parse(req.params.domain);
  res.json(await svc.provisionDomain(req.auth!, domain, req.ip));
}));

/** End Testing — tear down the active domain's environment (Testing Admin only). */
testingRouter.post("/teardown", asyncHandler(async (req: Request, res: Response) => {
  res.json(await svc.endTesting(req.auth!, req.ip));
}));

/** Persistent testing report — per-domain status + reported issues (survives teardown). */
testingRouter.get("/report", asyncHandler(async (req: Request, res: Response) => {
  res.json(await svc.getReport(req.auth!));
}));

/** The DB-backed guided test plans (the test script — editable in the DB without a redeploy). */
testingRouter.get("/plans", asyncHandler(async (req: Request, res: Response) => {
  res.json(await svc.getPlans(req.auth!));
}));

/** The real provisioned environment for a domain (production — no mock data). */
testingRouter.get("/environment/:domain", asyncHandler(async (req: Request, res: Response) => {
  const domain = domainSchema.parse(req.params.domain);
  res.json(await svc.getEnvironment(req.auth!, domain));
}));

/** Report an issue (recorded + emailed to the Testing Admin). */
testingRouter.post("/issues", asyncHandler(async (req: Request, res: Response) => {
  const input = reportIssueSchema.parse(req.body);
  res.status(201).json(await svc.reportIssue(req.auth!, input));
}));

/** List issues (Testing Admin → all; other testers → their own). */
testingRouter.get("/issues", asyncHandler(async (req: Request, res: Response) => {
  res.json(await svc.listIssues(req.auth!));
}));
