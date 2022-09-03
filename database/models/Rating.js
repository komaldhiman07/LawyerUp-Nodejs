import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import User from "./User";

const ratingSchema = mongoose.Schema({

  user_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: User,
  },
  rating: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    default: false,
  },
  created_at: {
    type: Date,
  },
});

ratingSchema.plugin(mongoosePaginate);
const Rating = mongoose.model("rating", ratingSchema);
export default Rating;
