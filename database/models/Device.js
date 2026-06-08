import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";

const deviceSchema = mongoose.Schema({
  device_id: {
    type: String,
    required: true,
  },
  device_type: {
    type: String,
    required: true,
  },
  device_token: {
    type: String,
    required: true,
  },
  user_id: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  is_deleted: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
  },
  updated_at: {
    type: Date,
  },
});

// P-02: Index for notifyAffectedUsers() device token lookup
deviceSchema.index({ user_id: 1, is_deleted: 1 });
deviceSchema.index({ device_token: 1 }, { sparse: true });

deviceSchema.plugin(mongoosePaginate);
const Device = mongoose.model("device", deviceSchema);
export default Device;
