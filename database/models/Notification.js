import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import User from "./User";

const notificationSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  sender_id: {
    type: Schema.Types.ObjectId,
    ref: User,
    required: true,
  },
  receiver_id: {
    type: Schema.Types.ObjectId,
    ref: User,
    required: true,
  },
  is_read: {
    type: Boolean,
    required: false,
    default: false,
  },
  created_at: {
    type: Date,
  },
});

notificationSchema.plugin(mongoosePaginate);
const Notification = mongoose.model("notifications", notificationSchema);
export default Notification;
