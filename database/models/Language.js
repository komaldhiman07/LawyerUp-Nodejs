import mongoose from "mongoose";

const languageSchema = mongoose.Schema({
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
  deleted_at: {
    type: Date,
  },
});

const Language = mongoose.model("languages", languageSchema);
export default Language;
