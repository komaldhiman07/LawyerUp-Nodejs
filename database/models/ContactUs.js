import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import User from "./User";

const contactUsSchema = mongoose.Schema(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            ref: User,
            required: true,
        },
        subject: {
            type: String,
            default: "",
        },
        message: {
            type: String,
            default: "",
        },
        reference_number: {
            type: String,
            default: "",
        },
        status: {
            type: String,
            enum: ["pending", "read", "resolved"],
            default: "pending",
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

contactUsSchema.index({ status: 1, createdAt: -1 });
contactUsSchema.plugin(mongoosePaginate);
const Settings = mongoose.model("contactus", contactUsSchema);
export default Settings;
