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
            default: "pending",
        }
    },
    {
        timestamps: true,
    }
);

contactUsSchema.plugin(mongoosePaginate);
const Settings = mongoose.model("contactus", contactUsSchema);
export default Settings;
