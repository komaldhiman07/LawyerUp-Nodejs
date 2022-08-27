import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate";

const roleSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    max: 100,
    min: 3,
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

roleSchema.plugin(mongoosePaginate);
const Role = mongoose.model("roles", roleSchema);
export default Role;
