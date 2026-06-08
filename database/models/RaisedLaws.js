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
