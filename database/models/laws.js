import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import User from "./User";

const lawsSchema = mongoose.Schema({
  state: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  laws: [
    {
      title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      added_by: {
        type: Schema.Types.ObjectId,
        ref: User,
        required: false,
      },
      is_deleted: {
        type: Boolean,
        default: false,
      },
      created_at: {
        type: Date,
        default: Date.now(),
      },
      updated_at: {
        type: Date,
        default: Date.now(),
      },
      deleted_at: {
        type: Date,
        default: Date.now(),
      },
    },
  ],
});

lawsSchema.plugin(mongoosePaginate);
const Law = mongoose.model("laws", lawsSchema);
export default Law;
