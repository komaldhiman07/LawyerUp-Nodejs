import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import Role from "./Role";
import Language from "./Language";
import Country from "./Country";
import UserCategoryLaws from "./userCategoryLaws";
import Laws from "./laws";
// import State from "./State";

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
    profile_image: {
      type: String,
    },
    date_of_birth: {
      type: String,
      required: false
    },
    password: {
      type: String,
      required: true,
    },
    // SEC-07: otp kept for backwards compatibility with existing flow;
    // new fields hash it and enforce a 10-minute expiry via TTL
    otp: {
      type: String,
    },
    otp_hash: {
      type: String,
      select: false,       // never returned in queries by default
    },
    otp_expires_at: {
      type: Date,
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
    state: {
      type: String,
      required: false
    },
    // state_id: {
    //   type: Schema.Types.ObjectId,
    //   ref: State,
    // },
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
      enum: ["male", "female", ""],
    },
    last_login: {
      type: Date,
    },
    is_enable_location: {
      type: Boolean,
      default: false
    },
    current_location: {
      lat: {
        type: Number,
        required: false,
      },
      lng: {
        type: Number,
        required: false,
      },
      state: {
        type: String,
        required: false,
      },
      city: {
        type: String,
        required: false,
      },
      updated_at: {
        type: Date,
        required: false,
      },
    },
    previous_location: {
      state: {
        type: String,
        required: false,
      },
      city: {
        type: String,
        required: false,
      },
      changed_at: {
        type: Date,
        required: false,
      },
    },
    location_meta: {
      last_processed_at: {
        type: Date,
        required: false,
      },
      last_state_change_at: {
        type: Date,
        required: false,
      },
      last_notified_state: {
        type: String,
        required: false,
      },
      last_notified_at: {
        type: Date,
        required: false,
      },
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
      enum: ["active", "inactive"],
      default: "active",
    },
    enabled_2fa: {
      type: Boolean,
      default: false,
    },
    secret_2fa: {
      type: String,
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
    // SC-02: User writes (account creation, status changes) must survive failover
    writeConcern: { w: 'majority', j: true },
  }
);

// P-07 / I-01: Indexes for admin user list, dashboard stats, login, and filters
userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ username: 1 }, { unique: true, sparse: true });
userSchema.index({ role_id: 1, is_deleted: 1, status: 1 });
userSchema.index({ state: 1, status: 1 });

userSchema.plugin(mongoosePaginate);
/* post hook to add user's favourite laws as per the city selection */
userSchema.post('save', async function (doc) {
  // S-03: Only run when city was actually changed — prevents duplicate
  // UserCategoryLaws records on every unrelated save (password change, status, etc.)
  if (!this.isModified('city') || !doc.city) return;
  {
    /* get all the laws of the selected city */
    const lawsData = await Laws.findOne({ city: doc.city })
    if (lawsData && lawsData.laws && lawsData.laws.length) {
      let lawArr = [];
      for (const law of lawsData.laws) {
        lawArr.push(law._id.toString())
      }
      const payload = {
        user_id: doc._id,
        name: "default list",
        city: doc.city,
        laws: lawArr,
      }
      await UserCategoryLaws.create(payload)
    }
  }
});
/* end */
const User = mongoose.model("users", userSchema);
export default User;
