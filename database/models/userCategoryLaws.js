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
    laws: {
      type: [
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
      // S-02: Cap at 50 laws per category to prevent unbounded document growth
      validate: {
        validator: function (v) { return v.length <= 50; },
        message: 'A category cannot track more than 50 laws.',
      },
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

// P-01: Indexes for notifyAffectedUsers() — state+active lookup and user_id lookup
userCategoryLawsSchema.index({ user_id: 1 });
userCategoryLawsSchema.index({ state: 1, active: 1 });
userCategoryLawsSchema.index({ state: 1, active: 1, user_id: 1 });

userCategoryLawsSchema.plugin(mongoosePaginate);
const UserCategoryLaws = mongoose.model(
  "userCategoryLaws",
  userCategoryLawsSchema
);
export default UserCategoryLaws;
