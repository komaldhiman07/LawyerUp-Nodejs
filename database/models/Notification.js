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
    enum: [
      // law changes
      'lawUpdate', 'lawNew', 'lawRepeal', 'penaltyChange', 'effectiveSoon', 'pendingChange',
      // location & travel
      'travelEntry', 'travelRisk', 'reciprocityChange', 'tripReminder',
      // watchlist / awareness / digest / account
      'categoryAlert', 'knowYourRights', 'deadlineReminder', 'seasonalAlert',
      'weeklyDigest', 'securityAlert',
      // user contributions (raise-a-law moderation outcome)
      'suggestionUpdate',
      // support (contact-us request resolved)
      'contactReply',
    ],
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

  // ── extensible fields (Phase 1: notification expansion) ────────────────────
  // Visual + push urgency. Drives accent styling and sound.
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },
  // The single relevant state (generalises current/home_state for non-travel types).
  state_code: {
    type: String,
    default: '',
  },
  // For effectiveSoon / deadlineReminder — when the change takes effect.
  effective_date: {
    type: Date,
    required: false,
  },
  // Auto-hide time-sensitive notifications after this moment.
  expires_at: {
    type: Date,
    required: false,
  },
  // Where tapping the notification should navigate in the app.
  deep_link: {
    route: { type: String, default: '' },
    args:  { type: Schema.Types.Mixed, default: {} },
  },
  // Optional call-to-action button label, e.g. "Compare states", "View law".
  cta_label: {
    type: String,
    default: '',
  },
  // Batches notifications together (e.g. into a weekly digest).
  group_key: {
    type: String,
    default: '',
  },
  // Flexible per-type payload, e.g. { from: "misdemeanor", to: "felony" }.
  data: {
    type: Schema.Types.Mixed,
    default: {},
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
