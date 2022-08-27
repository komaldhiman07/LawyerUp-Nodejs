import User from "../../database/models/User";
import Album from '../../database/models/Album';
import Transaction from '../../database/models/Transaction';

class StripeService {
    constructor() { }

    getUser = (data) =>
        User.findOne(data)
    
    getAlbumDetail = (data) => {
        const options = {
            lean: true,
            populate: [
                {
                    path: "experts",
                    select: "first_name last_name experience profile_image averageRating price time_period stripe_account_id",
                },
                {
                    path: "created_by",
                    select: "first_name last_name profile_image",
                },
            ],
            sort: { created_at: 1 },
        };
        if (options && options.populate) {
            return Album.findOne(data).populate(options.populate);
        }
        return Album.findOne(data);
    };

    createTransaction = (data) => {
        return Transaction.create(data);
    }

    findTransactionList = (query, options) => {
        return Transaction.find(query).sort(options.sort).populate(options.populate)
    };

    updateUserStripeStatus = (query, data) => {
        return User.updateOne(query, data);
    }

    getAllUser = (query) => {
        return User.find(query)
    }
}

export default new StripeService();
