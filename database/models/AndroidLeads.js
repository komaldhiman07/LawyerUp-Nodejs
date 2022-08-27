import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";

const androidLeadSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    phone_no: {
        type: String,
        required: false,
    },
    message: {
        type: String,
        required: false,
    },
    created_at: {
        type: Date,
    },
    updated_at: {
        type: Date,
    }
});

androidLeadSchema.plugin(mongoosePaginate);
const androidLead = mongoose.model("androidLeads", androidLeadSchema);
export default androidLead;
