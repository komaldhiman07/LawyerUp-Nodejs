// @ts-nocheck
import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";

const userCategoryLawsSchema = mongoose.Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      // ref: User,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: false,
    },
    state: {
        type: String,
        required: false,
      },
    laws: [
      {
        law_id: {
          type: String,
          required: true,
        },
        color: {
          type: String,
          required: false,
        },
      },
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
const UserCategoryLaws = mongoose.model(
  "userCategoryLaws",
  userCategoryLawsSchema
);
export default UserCategoryLaws;
