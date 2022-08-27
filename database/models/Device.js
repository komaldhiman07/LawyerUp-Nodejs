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

deviceSchema.plugin(mongoosePaginate);
const Device = mongoose.model("device", deviceSchema);
export default Device;
