import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";

const stateSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    max: 100,
    min: 3,
  },
  country_id: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  code: {
    type: String
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

stateSchema.plugin(mongoosePaginate);
const State = mongoose.model("states", stateSchema);
export default State;
