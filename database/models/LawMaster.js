import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";

const lawMasterSchema = mongoose.Schema(
  {
    law_key: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    short_title: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    description_global: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    domain: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    sub_domain: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    severity: {
      type: String,
      enum: ["info", "low", "medium", "high", "critical"],
      default: "info",
    },
    risk_score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    source_type: {
      type: String,
      enum: ["manual", "csv", "api", "migration"],
      default: "manual",
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
    is_deleted: {
      type: Boolean,
      default: false,
      index: true,
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
  }
);

lawMasterSchema.index({ law_key: 1 }, { unique: true });
lawMasterSchema.index({ domain: 1, sub_domain: 1, is_active: 1 });
lawMasterSchema.index({ tags: 1 });

// I-03: Text index — replaces regex scanning on title/description searches
lawMasterSchema.index(
  { title: 'text', description_global: 'text', tags: 'text' },
  { weights: { title: 10, description_global: 3, tags: 5 }, name: 'law_master_text' }
);

lawMasterSchema.plugin(mongoosePaginate);
const LawMaster = mongoose.model("laws_master", lawMasterSchema);
export default LawMaster;
