import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import Album from "./Album";

const reviewAttachmentSchema = mongoose.Schema({
  album_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: Album,
  },
  type: {
    type: String,
    required: false,
  },
  name: {
    type: String,
    required: false,
  },
  duration: {
    type: String,
    required: false,
  },
  url: {
    type: String,
    required: false,
  },
  key: {
    type: String,
    required: false,
  },
  created_at: {
    type: Date,
  },
});

reviewAttachmentSchema.plugin(mongoosePaginate);
const ReviewAttachment = mongoose.model(
  "review_attachments",
  reviewAttachmentSchema
);
export default ReviewAttachment;
