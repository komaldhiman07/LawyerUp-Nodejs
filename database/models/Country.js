import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate";

const countrySchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    max: 100,
    min: 3,
  },
  phone_code: {
    type: String,
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

countrySchema.plugin(mongoosePaginate);
const Country = mongoose.model("country", countrySchema);
export default Country;
