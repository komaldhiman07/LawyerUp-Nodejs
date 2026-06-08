import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";

const lawIngestionJobSchema = mongoose.Schema(
  {
    job_id: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    file_name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    uploaded_by: {
      type: Schema.Types.ObjectId,
      required: false,
      index: true,
    },
    upload_source: {
      type: String,
      enum: ["admin_portal", "api", "system"],
      default: "admin_portal",
    },
    template_version: {
      type: String,
      default: "v1",
      trim: true,
    },
    status: {
      type: String,
      enum: ["queued", "processing", "completed", "partial", "failed", "cancelled"],
      default: "queued",
      index: true,
    },
    total_rows: {
      type: Number,
      default: 0,
      min: 0,
    },
    success_rows: {
      type: Number,
      default: 0,
      min: 0,
    },
    error_rows: {
      type: Number,
      default: 0,
      min: 0,
    },
    skipped_rows: {
      type: Number,
      default: 0,
      min: 0,
    },
    started_at: {
      type: Date,
      required: false,
    },
    finished_at: {
      type: Date,
      required: false,
    },
    error_report_url: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    dedupe_key: {
      type: String,
      trim: true,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

lawIngestionJobSchema.index({ job_id: 1 }, { unique: true });
lawIngestionJobSchema.index({ uploaded_by: 1, createdAt: -1 });

lawIngestionJobSchema.plugin(mongoosePaginate);
const LawIngestionJob = mongoose.model("law_ingestion_jobs", lawIngestionJobSchema);
export default LawIngestionJob;
