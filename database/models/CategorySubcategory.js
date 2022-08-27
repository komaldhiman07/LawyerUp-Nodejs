import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";

const categorySubcategorySchema = mongoose.Schema(
  {
    parent_id: {
      type: Schema.Types.ObjectId,
      ref: "categorySubcategory",
    },
    name: {
      type: String,
      required: true,
      max: 50,
      min: 3,
    },
    image: {
      type: String,
    },
    level: {
      type: Number,
    },
    is_active: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    deleted_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

categorySubcategorySchema.plugin(mongoosePaginate);
const categorySubcategory = mongoose.model(
  "categorySubcategory",
  categorySubcategorySchema
);
export default categorySubcategory;
