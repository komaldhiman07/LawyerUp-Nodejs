import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";

const apilogsSchema = mongoose.Schema({
    request_id: {
        type: Schema.Types.ObjectId,
    },
    request: {
        type: String,
    },
    type: {
        type: String
    },
    ip_address: {
        type: String
    },
    response: {
        type: String
    },
    message: {
        type: String
    }
},
    {
        timestamps: true,
    }
);

apilogsSchema.plugin(mongoosePaginate);
const Apilogs = mongoose.model("apilogs", apilogsSchema);
export default Apilogs;
