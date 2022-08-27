import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import Album from "./Album";

const postSchema = mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  attention_period: {
    type: String,
    required: false,
  },
  review_expectations: {
    type: String,
    required: false,
  },
  unique_name: {
    type: String,
    required: false,
  },
  video: {
    type: String,
    required: false,
  },
  thumbnail: {
    type: String,
    required: false,
  },
  video_hls: {
    type: String,
    required: false,
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
  album_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: Album,
  },
  video_duration: {
    type: String,
    required: false,
  },
});

postSchema.plugin(mongoosePaginate);
const Post = mongoose.model("post", postSchema);
export default Post;
