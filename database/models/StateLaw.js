import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";

const stateLawSchema = mongoose.Schema(
  {
    state_code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      // P-09: Covered as leading field in compound indexes — no standalone index needed
    },
    country_code: {
      type: String,
      trim: true,
      uppercase: true,
      default: "US",
      // P-09: Covered as leading field in { country_code, jurisdiction_type, city, county }
    },
    law_key: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      // P-09: Covered by { state_code, law_key, version } unique compound
    },
    jurisdiction_type: {
      type: String,
      enum: ["state", "city", "county", "federal"],
      default: "state",
      // P-09: Covered by { state_code, status, jurisdiction_type } and country_code compound
    },
    jurisdiction_code: {
      type: String,
      trim: true,
      index: true,
    },
    city: {
      type: String,
      trim: true,
      index: true,
    },
    county: {
      type: String,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    details: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000,
    },
    penalty_text: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    // ── Tier 1: structured verdict, trust & risk ──────────────────────────────
    // Scannable legality verdict (authoritative; auto-derived from summary on
    // save when not explicitly set). Powers the app's verdict badge + compare.
    legality: {
      type: String,
      enum: ["permitted", "restricted", "prohibited", "info"],
      default: "info",
      index: true,
    },
    // Short human label, e.g. "Recreational + Medical", "Permitless Carry".
    legality_label: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    // Quick risk signal for penalties.
    penalty_severity: {
      type: String,
      enum: ["none", "low", "medium", "high"],
      default: "none",
    },
    // Sourcing & trust.
    statute_reference: {
      type: String,
      trim: true,
      maxlength: 200, // e.g. "Cal. Health & Safety Code § 11357"
    },
    official_url: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    sources: {
      type: [
        {
          label: { type: String, trim: true, maxlength: 120 },
          url: { type: String, trim: true, maxlength: 500 },
        },
      ],
      default: [],
    },
    verified: {
      type: Boolean,
      default: false,
    },
    last_reviewed_at: {
      type: Date,
      required: false,
    },
    reviewed_by: {
      type: Schema.Types.ObjectId,
      required: false,
    },
    // ── Tier 2: richer, structured content ────────────────────────────────────
    // Plain-language takeaways for progressive disclosure.
    key_points: {
      type: [String],
      default: [],
    },
    // Specific guidance for travellers/visitors (powers travel/compare).
    traveler_note: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    // Structured value for sortable/numeric laws (min wage, possession limit…).
    numeric_value: {
      type: Number,
      required: false,
    },
    unit: {
      type: String,
      trim: true,
      maxlength: 20, // "$/hr", "oz", "years"
    },
    // Category-specific structured facts, e.g. { recreational: true, age_min: 21 }.
    attributes: {
      type: Map,
      of: Schema.Types.Mixed,
      default: undefined,
    },
    // Reciprocity (e.g. concealed-carry permit) — list of state codes.
    reciprocity: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["draft", "active", "repealed"],
      default: "draft",
      // P-09: Covered by { state_code, status, jurisdiction_type } compound
    },
    effective_from: {
      type: Date,
      required: false,
    },
    effective_to: {
      type: Date,
      required: false,
    },
    version: {
      type: Number,
      default: 1,
      min: 1,
      index: true,
    },
    content_hash: {
      type: String,
      trim: true,
      index: true,
    },
    change_source: {
      type: String,
      enum: ["manual", "csv", "api", "migration"],
      default: "manual",
    },
    admin_note: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    published_at: {
      type: Date,
      required: false,
    },
    is_active: {
      type: Boolean,
      default: true,
      // P-09: Covered by { state_code, law_key, is_active, is_deleted } compound
    },
    is_deleted: {
      type: Boolean,
      default: false,
      // P-09: Covered by { state_code, law_key, is_active, is_deleted } compound
    },
    created_by: {
      type: Schema.Types.ObjectId,
      required: false,
    },
    updated_by: {
      type: Schema.Types.ObjectId,
      required: false,
    },
  },
  {
    timestamps: true,
    // SC-02: Majority write concern on this collection — law content must survive failover
    writeConcern: { w: 'majority', j: true },
  }
);

stateLawSchema.path("effective_to").validate(function validateEffectiveTo(value) {
  if (!value || !this.effective_from) {
    return true;
  }
  return value >= this.effective_from;
}, "effective_to must be greater than or equal to effective_from");

stateLawSchema.index({ state_code: 1, law_key: 1, version: 1 }, { unique: true });
stateLawSchema.index({ state_code: 1, law_key: 1, is_active: 1, is_deleted: 1 });
stateLawSchema.index({ state_code: 1, status: 1, jurisdiction_type: 1 });
stateLawSchema.index({ country_code: 1, jurisdiction_type: 1, city: 1, county: 1 });

// I-03: Text index — replaces regex scanning on title/summary/details searches
stateLawSchema.index(
  { title: 'text', summary: 'text', details: 'text' },
  { weights: { title: 10, summary: 5, details: 1 }, name: 'state_law_text' }
);

stateLawSchema.plugin(mongoosePaginate);
const StateLaw = mongoose.model("state_laws", stateLawSchema);
export default StateLaw;
