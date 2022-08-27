import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate";

const statusSchema = mongoose.Schema({
  value: {
    type: Number,
    required: true,
  },
  expert: {
    type: String,
    required: false,
  },
  performer: {
    type: String,
    required: false,
  },
});

statusSchema.plugin(mongoosePaginate);
const Status = mongoose.model("status", statusSchema);
export default Status;
