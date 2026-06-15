import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { runAutoFlagJob } from "./jobs.service.js";

let timer: NodeJS.Timeout | null = null;
let running = false;

/** Run the job once, guarding against overlapping executions and swallowing errors. */
async function tick(): Promise<void> {
  if (running) {
    logger.warn("auto-flag job still running — skipping this tick");
    return;
  }
  running = true;
  try {
    await runAutoFlagJob(new Date());
  } catch (err) {
    logger.error({ err }, "auto-flag job failed");
  } finally {
    running = false;
  }
}

/**
 * Start the periodic auto-flag scheduler. No-op unless JOBS_ENABLED is set, so dev and
 * test runs stay quiet. Returns a stop handle for graceful shutdown.
 */
export function startSchedulers(): () => void {
  if (!env.JOBS_ENABLED) {
    logger.info("schedulers disabled (JOBS_ENABLED=false)");
    return () => {};
  }
  const intervalMs = env.JOBS_INTERVAL_MINUTES * 60_000;
  logger.info({ intervalMinutes: env.JOBS_INTERVAL_MINUTES }, "auto-flag scheduler started");
  timer = setInterval(() => void tick(), intervalMs);
  timer.unref?.(); // don't keep the process alive solely for the timer
  return () => {
    if (timer) clearInterval(timer);
    timer = null;
  };
}
