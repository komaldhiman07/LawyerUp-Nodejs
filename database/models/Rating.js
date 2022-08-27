import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import Album from "./Album";
import User from "./User";

const ratingSchema = mongoose.Schema({
  album_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: Album,
  },
  performer_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: User,
  },
  expert_id: {
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
