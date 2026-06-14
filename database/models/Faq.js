import mongoose, { Schema } from "mongoose";

/**
 * Help-center FAQ entry. Grouped by `category`, ordered by `order` within a
 * category. Soft-deleted; `is_active` toggles app visibility without deleting.
 */
const faqSchema = new Schema(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    category: { type: String, default: "General", trim: true },
    order: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
    is_deleted: { type: Boolean, default: false },
    created_by: { type: Schema.Types.ObjectId, required: false },
    updated_by: { type: Schema.Types.ObjectId, required: false },
  },
  { timestamps: true }
);

// Fast app-facing query: active, non-deleted, grouped + ordered.
faqSchema.index({ is_deleted: 1, is_active: 1, category: 1, order: 1 });

export default mongoose.model("faqs", faqSchema);
