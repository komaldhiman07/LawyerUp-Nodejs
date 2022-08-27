import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate";

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

languageSchema.plugin(mongoosePaginate);
const Language = mongoose.model("languages", languageSchema);
export default Language;
