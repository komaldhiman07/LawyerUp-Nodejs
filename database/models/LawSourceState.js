import mongoose, { Schema } from "mongoose";

/**
 * Change-detection ledger for the automated law-ingestion pipeline.
 *
 * One row per (state_code, law_key, source). Stores a content hash of the last
 * material we saw from that source so the daily job can SKIP unchanged rows —
 * no Claude spend, no duplicate drafts. A draft StateLaw is only (re)created
 * when content_hash changes (or a new row appears).
 */
const lawSourceStateSchema = new Schema(
  {
    state_code: { type: String, required: true, uppercase: true, trim: true },
    law_key: { type: String, required: true, lowercase: true, trim: true },
    source: {
      type: String,
      enum: ["wikipedia", "claude-research"],
      required: true,
    },
    // sha256 of the raw source content this state/law was last derived from.
    content_hash: { type: String, default: "" },
    // Bumped to force regeneration of research-generated laws.
    generator_version: { type: String, default: "" },
    last_seen_at: { type: Date },        // last time the source was fetched
    last_drafted_at: { type: Date },     // last time we created a draft from it
    last_status: { type: String, default: "" }, // skipped | drafted | error
    last_error: { type: String, default: "" },
  },
  { timestamps: true }
);

lawSourceStateSchema.index({ state_code: 1, law_key: 1, source: 1 }, { unique: true });

export default mongoose.model("law_source_states", lawSourceStateSchema);
