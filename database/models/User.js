import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import Role from "./Role";
import Language from "./Language";
import Country from "./Country";
import State from "./State";

const userSchema = mongoose.Schema(
  {
    role_id: {
      type: Schema.Types.ObjectId,
      ref: Role,
      required: true,
    },
    login_type: {
      type: String,
      enum: ["Manual", "Google", "Facebook", "Linkedin", "Apple"],
      default: "Manual",
    },
    social_key: {
      type: String,
      default: null,
    },
    first_name: {
      type: String,
      required: false,
      max: 100,
      min: 3,
    },
    last_name: {
      type: String,
      required: false,
      max: 100,
      min: 3,
    },
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: false,
    },
    phone: {
      type: String,
      required: false,
    },
    profile_pic: {
      type: String,
    },
    date_of_birth: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
    },
    is_otp_verified: {
      type: Boolean,
      default: false,
    },
    address: {
      type: String,
      required: false
    },
    country_id: {
      type: Schema.Types.ObjectId,
      ref: Country,
    },
    state_id: {
      type: Schema.Types.ObjectId,
      ref: State,
    },
    city: {
      type: String,
      required: false
    },
    zip_code: {
      type: Number,
      required: false
    },
    language: {
      type: Schema.Types.ObjectId,
      ref: Language,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Others"],
    },
    last_login: {
      type: Date,
    },
    is_enable_location: {
      type: Boolean,
      default: false
    },
    is_receive_notification: {
      type: Boolean,
      default: false
    },
    is_enable_notification: {
      type: Boolean,
      default: false
    },
    stripe_customer_id: {
      type: String
    },
    stripe_account_id: {
      type: String
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    deleted_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.plugin(mongoosePaginate);
const User = mongoose.model("users", userSchema);
export default User;
