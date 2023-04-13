import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import User from "./User";

const settingSchema = mongoose.Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: User,
      required: true,
    },
    notifications: {
      push: {
        type: Boolean,
        required: false,
      },
      email: {
        type: Boolean,
        required: false,
      },
      sound: {
        type: Boolean,
        required: false,
      },
    },
    theme: {
      type: String,
      enum: ["light", "dark"],
      default: "light",
    },
    is_enabled_2fa: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

settingSchema.plugin(mongoosePaginate);
const Settings = mongoose.model("settings", settingSchema);
export default Settings;
