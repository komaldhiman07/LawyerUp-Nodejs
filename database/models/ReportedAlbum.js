import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";

import User from "./User";
import Album from "./Album";

const reportedAlbumSchema = mongoose.Schema({
  album_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: Album,
  },
  reviewer_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: User,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  created_at: {
    type: Date,
  },
});

reportedAlbumSchema.plugin(mongoosePaginate);
const ReportedAlbum = mongoose.model("reportedalbum", reportedAlbumSchema);
export default ReportedAlbum;
