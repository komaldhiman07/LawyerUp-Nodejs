import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import User from "./User";
import Laws from "./laws";


const userFavouriteLawsSchema = mongoose.Schema(
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
        color: {
            type: String,
            default: "",
        },
        city: {
            type: String,
            required: false
        },
        law_id: {
            type: Schema.Types.ObjectId,
            // ref: Laws,
            required: true,
        },
        active: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

userFavouriteLawsSchema.plugin(mongoosePaginate);
const UserFavouriteLaws = mongoose.model("userFavouriteLaws", userFavouriteLawsSchema);
export default UserFavouriteLaws;
