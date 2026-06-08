import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";

const lawIngestionErrorSchema = mongoose.Schema(
  {
    job_id: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    row_number: {
      type: Number,
      required: true,
      min: 1,
      index: true,
    },
    column_name: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    error_code: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    error_message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    severity: {
      type: String,
      enum: ["error", "warning"],
      default: "error",
    },
    raw_row: {
      type: Schema.Types.Mixed,
      required: false,
    },
    normalized_row: {
      type: Schema.Types.Mixed,
      required: false,
    },
    is_resolved: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

lawIngestionErrorSchema.index({ job_id: 1, row_number: 1 });
lawIngestionErrorSchema.index({ job_id: 1, error_code: 1 });

lawIngestionErrorSchema.plugin(mongoosePaginate);
const LawIngestionError = mongoose.model(
  "law_ingestion_errors",
  lawIngestionErrorSchema
);
export default LawIngestionError;
