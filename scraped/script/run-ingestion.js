/**
 * run-ingestion.js — manually trigger the law-ingestion pipeline.
 *
 * Run from the lawyer_backend root (babel-node — imports models):
 *   INGEST_BASELINE=1 ./node_modules/.bin/babel-node scraped/script/run-ingestion.js
 *       → record current Wikipedia hashes WITHOUT drafting or calling Claude.
 *         Run this ONCE first so the next real run only drafts true changes.
 *         (babel-node eats bare --baseline flags, so use the env var.)
 *
 *   ANTHROPIC_API_KEY=sk-ant-... ./node_modules/.bin/babel-node scraped/script/run-ingestion.js
 *       → full run: draft changed Wikipedia rows + generate research categories.
 *
 * This is the same code the daily cron runs (src/jobs/lawIngestion.js) — use it
 * to seed the baseline or to force a run on demand.
 */
import "dotenv/config";
import mongoose from "mongoose";
import { runLawIngestion } from "../../src/services/lawIngestion/pipeline";

const MONGO_URI = process.env.MONGO_DB_URI || "mongodb://localhost:27017/lawyerup";
const baseline = process.argv.includes("--baseline") || process.env.INGEST_BASELINE === "1";

(async () => {
  await mongoose.connect(MONGO_URI);
  try {
    const result = await runLawIngestion({ baseline });
    console.log("\n" + "─".repeat(60));
    console.log(`  ${baseline ? "BASELINE" : "RUN"} ${result.status}`);
    console.log(`  total ${result.total} · drafted ${result.success} · skipped ${result.skipped} · errors ${result.error}`);
    console.log("─".repeat(60));
    if (!baseline) console.log("\nReview drafts in the admin portal → State Laws (status = draft).\n");
  } finally {
    await mongoose.disconnect();
  }
})().catch((e) => {
  console.error("\n[x] Failed:", e.message);
  process.exit(1);
});
