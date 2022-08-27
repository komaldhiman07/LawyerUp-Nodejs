import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import User from "./User";
import Album from "./Album";

const transactionSchema = mongoose.Schema({
  amount: {
    type: Number,
    required: false,
  },
  album_id: {
    type: Schema.Types.ObjectId,
    ref: Album,
    required: false,
  },
  expert_id: {
    type: Schema.Types.ObjectId,
    ref: User,
    required: false,
  },
  performer_id: {
    type: Schema.Types.ObjectId,
    ref: User,
    required: false,
  },
  charge_id: {
    type: String,
    required: false
  },
  transfer_id: {
    type: String,
    required: false
  },
  transaction_id: {
    type: String,
    required: false
  },
  card_id: {
    type: String,
    required: false
  },
  transfer_group: {
    type: String,
    required: false
  },
  transaction_status: {
    type: String,
    required: false
  },
  created_at: {
    type: Date,
    default: new Date()
  },
  updated_at: {
    type: Date,
    default: new Date()
  },
  deleted_at: {
    type: Date,
  },
});

transactionSchema.plugin(mongoosePaginate);
const Transaction = mongoose.model("transactions", transactionSchema);
export default Transaction;
