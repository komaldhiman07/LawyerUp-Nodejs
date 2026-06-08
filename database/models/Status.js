import mongoose from "mongoose";

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

const Status = mongoose.model("status", statusSchema);
export default Status;
