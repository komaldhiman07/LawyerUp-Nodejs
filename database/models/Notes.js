import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import User from "./User";
import Album from "./Album";
import Post from "./Post";

const notesSchema = mongoose.Schema({
  album_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: Album,
  },
  post_id: {
    type: Schema.Types.ObjectId,
    required: false,
    ref: Post,
  },
  time: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  created_by: {
    type: Schema.Types.ObjectId,
    ref: User,
    required: false,
  },
  created_at: {
    type: Date,
  },
  updated_at: {
    type: Date,
  },
});

notesSchema.plugin(mongoosePaginate);
const Notes = mongoose.model("notes", notesSchema);
export default Notes;
