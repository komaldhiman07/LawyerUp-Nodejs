import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import User from "./User";

const notificationSchema = mongoose.Schema({
  receiver_id: {
    type: Schema.Types.ObjectId,
    ref: User,
    required: true,
  },
  sender_id: {
    type: Schema.Types.ObjectId,
    ref: User,
    required: false,
    default: null,
  },

  // ── type (required) ──────────────────────────────────────────────────────
  type: {
    type: String,
    required: true,
    enum: ['lawUpdate', 'lawNew', 'lawRepeal', 'travelEntry'],
    default: 'lawUpdate',
  },

  // ── content ───────────────────────────────────────────────────────────────
  title: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  // Keep message as alias for backward compat with any existing records
  message: {
    type: String,
    required: false,
  },
  is_read: {
    type: Boolean,
    required: false,
    default: false,
  },

  // ── navigation context ────────────────────────────────────────────────────
  current_state: {
    type: String,
    required: false,
    default: '',
  },
  home_state: {
    type: String,
    required: false,
    default: '',
  },
  law_title: {
    type: String,
    required: false,
    default: '',
  },
  law_key: {
    type: String,
    required: false,
    default: '',
  },
  change_type: {
    type: String,
    required: false,
    enum: ['updated', 'published', 'repealed', null, ''],
    default: '',
  },

  // ── timestamps ────────────────────────────────────────────────────────────
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// P-03: Indexes for user notification list and dashboard stats range queries
notificationSchema.index({ receiver_id: 1, created_at: -1 });
notificationSchema.index({ created_at: -1 });

// I-02: TTL — auto-delete notifications older than 90 days
notificationSchema.index({ created_at: 1 }, { expireAfterSeconds: 7776000 });

notificationSchema.plugin(mongoosePaginate);
const Notification = mongoose.model("notifications", notificationSchema);
export default Notification;
