import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import User from "./User";

const raisedLawsSchema = mongoose.Schema(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            ref: User,
            required: true,
        },
        title: {
            type: String,
            default: "",
        },
        description: {
            type: String,
            default: "",
        },
        is_all_states: {
            type: Boolean,
            default: false,
        },
        states: [
            {
                name:{
                type: String,
                default: "",
            },
        }
        ],
        // ── Structured suggestion fields ─────────────────────────────────────
        type: {
            type: String,
            enum: ["missing", "error", "update"],
            default: "missing",
        },
        state_code: {            // primary relevant state (2-letter)
            type: String,
            uppercase: true,
            trim: true,
            default: "",
        },
        law_key: {               // category, e.g. "marijuana"
            type: String,
            lowercase: true,
            trim: true,
            default: "",
        },
        source_url: {
            type: String,
            trim: true,
            default: "",
        },
        // Reference to an existing StateLaw being reported (type=error/update)
        linked_law_id: {
            type: String,
            default: "",
        },
        // ── Moderation ───────────────────────────────────────────────────────
        status: {
            type: String,
            enum: ["submitted", "reviewing", "accepted", "rejected", "duplicate", "published"],
            default: "submitted",
            index: true,
        },
        admin_note: {
            type: String,
            default: "",
        },
        resolved_by: {
            type: Schema.Types.ObjectId,
            required: false,
        },
        resolved_at: {
            type: Date,
            required: false,
        },
    },
    {
        timestamps: true,
    }
);

// I-01: Index for fetching a user's raised laws
raisedLawsSchema.index({ user_id: 1, createdAt: -1 });

raisedLawsSchema.plugin(mongoosePaginate);
const Settings = mongoose.model("raisedLaws", raisedLawsSchema);
export default Settings;
