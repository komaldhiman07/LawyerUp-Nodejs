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
      likes: {
        type: Number,
        default: 0,
      },
      dislikes: {
        type: Number,
        default: 0,
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

// I-01 / P-05: Indexes for city law lookups and the getAllCityLaws aggregation pipeline
lawsSchema.index({ state: 1, city: 1 });
lawsSchema.index({ city: 1 });

lawsSchema.plugin(mongoosePaginate);
const Law = mongoose.model("laws", lawsSchema);
export default Law;
