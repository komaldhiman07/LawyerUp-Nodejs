import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import User from "./User";

const albumSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  event_name: {
    type: String,
    required: false,
  },
  place: {
    type: String,
    required: false,
  },
  date: {
    type: Date,
    required: false,
  },
  associated_club: {
    type: String,
    required: false,
  },
  event_results: {
    type: String,
    required: false,
  },
  teams: {
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: false,
  },
  experts: {
    type: [Schema.Types.ObjectId],
    ref: User,
    required: false,
  },
  estimated_price: {
    type: Number,
    required: false,
  },
  estimated_time: {
    type: String,
    required: false,
  },
  quote_description: {
    type: String,
    required: false,
  },
  review_description: {
    type: String,
    required: false,
  },
  post_status: {
    type: String,
    default: false,
    required: false,
  },
  report_count: {
    type: Number,
    default: 0,
  },
  is_deleted: {
    type: Boolean,
    default: false,
  },
  created_by: {
    type: Schema.Types.ObjectId,
    ref: User,
    required: false,
  },
  status: {
    type: Number,
    default: 1,
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

albumSchema.plugin(mongoosePaginate);
const Album = mongoose.model("album", albumSchema);
export default Album;
