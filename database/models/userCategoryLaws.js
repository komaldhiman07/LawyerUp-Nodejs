// @ts-nocheck
import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import User from "./User";
import Laws from "./laws";


const userCategoryLawsSchema = mongoose.Schema(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            // ref: User,
            required: true,
        },
        name: {
            type: String,
            default: "",
        },
        city: {
            type: String,
            required: false
        },
        laws: [
        ],
        active: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

userCategoryLawsSchema.plugin(mongoosePaginate);
const UserCategoryLaws = mongoose.model("userCategoryLaws", userCategoryLawsSchema);
export default UserCategoryLaws;

