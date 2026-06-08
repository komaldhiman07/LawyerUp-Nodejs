import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import User from "./User";
import Law from "./laws";

const userLikedLawsSchema = mongoose.Schema({
  law_id: {
    type: Schema.Types.ObjectId,
    ref: Law,
    required: true,
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: User,
    required: true,
  },
  is_like: {
    type: Boolean,
    required: false,
  },
  is_dislike: {
    type: Boolean,
    required: false,
  }
});

// I-01: Compound unique index — prevents duplicate like entries and speeds up lookups
userLikedLawsSchema.index({ user_id: 1, law_id: 1 }, { unique: true });

userLikedLawsSchema.plugin(mongoosePaginate);
const UserLikedLaws = mongoose.model("userLikedLaws", userLikedLawsSchema);
export default UserLikedLaws;
