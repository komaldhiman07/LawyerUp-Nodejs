import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";

/**
 * A saved trip the user plans. The reminder cron watches upcoming trips and
 * fires law-awareness notifications at 5 / 3 / 1 / 0 days before travel.
 */
const tripSchema = mongoose.Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    destination_state: {
      type: String,         // 2-letter code, e.g. "TX"
      required: true,
      uppercase: true,
      trim: true,
    },
    destination_city: {
      type: String,
      trim: true,
      default: "",
    },
    label: {
      type: String,         // e.g. "Summer in Texas"
      trim: true,
      maxlength: 80,
      default: "",
    },
    travel_date: {
      type: Date,
      required: true,
    },
    return_date: {
      type: Date,
      required: false,
    },
    // Snapshot of the user's home state at creation (2-letter code).
    home_state: {
      type: String,
      uppercase: true,
      trim: true,
      default: "",
    },
    // Which day-marks (5,3,1,0) have already been notified — prevents dupes.
    reminders_sent: {
      type: [Number],
      default: [],
    },
    status: {
      type: String,
      enum: ["upcoming", "completed", "cancelled"],
      default: "upcoming",
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  }
);

// Cron query: active upcoming trips by travel date.
tripSchema.index({ status: 1, travel_date: 1 });
tripSchema.index({ user_id: 1, travel_date: 1 });

tripSchema.plugin(mongoosePaginate);
const Trip = mongoose.model("trips", tripSchema);
export default Trip;
