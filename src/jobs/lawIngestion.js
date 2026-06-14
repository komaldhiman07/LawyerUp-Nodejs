/**
 * Daily law-ingestion job. Re-scrapes mapped Wikipedia categories and (once)
 * researches no-table categories via Claude, creating DRAFT StateLaws only for
 * content that actually changed — surfaced to admins for review.
 *
 * GATED: runs only when LAW_INGEST_ENABLED=1 (and ANTHROPIC_API_KEY is set),
 * so it never silently spends tokens. No boot catch-up — it's not time-critical
 * and we don't want it firing on every dev restart.
 *
 * Schedule override: LAW_INGEST_CRON (default "0 4 * * *" — 04:00 daily).
 */
import cron from "node-cron";
import { runLawIngestion } from "../services/lawIngestion/pipeline";

export function startLawIngestionJob() {
  if (process.env.LAW_INGEST_ENABLED !== "1") {
    console.log("[lawIngestion] disabled (set LAW_INGEST_ENABLED=1 to enable)");
    return;
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("[lawIngestion] enabled but ANTHROPIC_API_KEY missing — not scheduling");
    return;
  }
  const schedule = process.env.LAW_INGEST_CRON || "0 4 * * *";
  if (!cron.validate(schedule)) {
    console.error(`[lawIngestion] invalid LAW_INGEST_CRON "${schedule}" — not scheduling`);
    return;
  }
  cron.schedule(schedule, () => {
    runLawIngestion().catch((e) => console.error("[lawIngestion] run:", e && e.message));
  });
  console.log(`[lawIngestion] daily ingestion scheduled (${schedule})`);
}
