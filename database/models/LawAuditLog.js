import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";

const lawAuditLogSchema = mongoose.Schema(
  {
    entity_type: {
      type: String,
      enum: ["laws_master", "state_laws"],
      required: true,
      index: true,
    },
    entity_id: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ["create", "update", "delete", "publish", "repeal", "import"],
      required: true,
      index: true,
    },
    changed_fields: [
      {
        type: String,
        trim: true,
      },
    ],
    before_data: {
      type: Schema.Types.Mixed,
      required: false,
    },
    after_data: {
      type: Schema.Types.Mixed,
      required: false,
    },
    changed_by: {
      type: Schema.Types.ObjectId,
      required: false,
      index: true,
    },
    source: {
      type: String,
      enum: ["admin_portal", "csv", "api", "system"],
      default: "admin_portal",
      index: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
    // SC-02: Audit log writes must survive failover — majority w + journal
    writeConcern: { w: 'majority', j: true },
  }
);

lawAuditLogSchema.index({ entity_type: 1, entity_id: 1, createdAt: -1 });
lawAuditLogSchema.index({ changed_by: 1, createdAt: -1 });

// I-02: TTL — auto-delete audit logs older than 1 year
lawAuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

lawAuditLogSchema.plugin(mongoosePaginate);
const LawAuditLog = mongoose.model("law_audit_logs", lawAuditLogSchema);
export default LawAuditLog;
