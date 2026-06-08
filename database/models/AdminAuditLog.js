import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";

// SEC-06: Tracks all admin authentication and sensitive action events
const adminAuditLogSchema = mongoose.Schema(
  {
    event: {
      type: String,
      enum: [
        "login_success",
        "login_failed",
        "logout",
        "password_change",
        "user_activated",
        "user_deactivated",
      ],
      required: true,
      index: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      required: false,  // null on failed login where user doesn't exist
      index: true,
    },
    email: {
      type: String,     // record the attempted email even on failure
      required: false,
    },
    ip_address: {
      type: String,
      required: false,
    },
    user_agent: {
      type: String,
      required: false,
    },
    success: {
      type: Boolean,
      required: true,
      default: true,
    },
    note: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    // SC-02: Auth audit log must never be lost on failover
    writeConcern: { w: 'majority', j: true },
  }
);

adminAuditLogSchema.index({ user_id: 1, createdAt: -1 });
adminAuditLogSchema.index({ event: 1, createdAt: -1 });

// Keep admin audit logs for 2 years
adminAuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000 });

adminAuditLogSchema.plugin(mongoosePaginate);
const AdminAuditLog = mongoose.model("admin_audit_logs", adminAuditLogSchema);
export default AdminAuditLog;
