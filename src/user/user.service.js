import User from "../../database/models/User";
import Role from "../../database/models/Role";
import Country from "../../database/models/Country";
import State from "../../database/models/State";
import Language from "../../database/models/Language";
import Rating from "../../database/models/Rating";
import categorySubcategory from "../../database/models/CategorySubcategory";
import Device from "../../database/models/Device";
import Notification from "../../database/models/Notification";
import Transaction from "../../database/models/Transaction";
import AndroidLead from '../../database/models/AndroidLeads';

class UserService {
  constructor() {}

  getNotification = (data, populate) =>
    Notification.find(data).sort({ created_at: -1 }).populate(populate);

  getTransaction = (data, populate) =>
    Transaction.find(data).sort({ created_at: -1 }).populate(populate);

  addNotification = (data) => {
    Notification.insertMany(data);
  };

  getUser = (data) =>
    User.findOne(data).populate([
      {
        path: "role_id",
        model: Role,
        select: "name",
      },
      {
        path: "country_id",
        model: Country,
        select: "name",
      },
      {
        path: "state_id",
        model: State,
        select: "name",
      },
      {
        path: "language",
        model: Language,
        select: "name",
      },
    ]);

  updateUser = (data, id) => User.findOneAndUpdate({ _id: { $eq: id } }, data);

  getRoles = (data) => Role.find(data);

  getUsers = (data) =>
    User.find(data)
      .populate({
        path: "role_id",
        model: Role,
        select: "name",
      })
      .populate({
        path: "country_id",
        model: Country,
        select: "name",
      })
      .populate({
        path: "state_id",
        model: State,
        select: "name",
      })
      .populate({
        path: "language",
        model: Language,
        select: "name",
      })
      .populate({
        path: "talent",
        model: categorySubcategory,
        select: "name",
      })
      .populate({
        path: "club",
        model: User,
        select: "club_name",
      });

  getUserList = (filter, options) =>
    User.find(filter)
      .populate({
        path: "role_id",
        model: Role,
        select: "name",
      })
      .populate({
        path: "country_id",
        model: Country,
        select: "name",
      })
      .populate({
        path: "state_id",
        model: State,
        select: "name",
      })
      .populate({
        path: "language",
        model: Language,
        select: "name",
      })
      .populate({
        path: "talent",
        model: categorySubcategory,
        populate: [
          {
            path: "parent_id",
            model: categorySubcategory,
            select: "name _id",
          },
        ],
        select: "name parent_id",
      })
      .populate({
        path: "club",
        model: User,
        select: "club_name",
      })
      .sort({ createdAt: "desc" })
      .skip(options.skip)
      .limit(options.limit);

  getTotalUserNumber = (query) => User.countDocuments(query);

  getUserById = (data) =>
    User.find({ _id: data, is_deleted: false })
      .populate({
        path: "role_id",
        model: Role,
        select: "name",
      })
      .populate({
        path: "country_id",
        model: Country,
        select: "name",
      })
      .populate({
        path: "state_id",
        model: State,
        select: "name",
      })
      .populate({
        path: "language",
        model: Language,
        select: "name",
      })
      .populate({
        path: "talent",
        model: categorySubcategory,
        populate: [
          {
            path: "parent_id",
            model: categorySubcategory,
            select: "name _id",
          },
        ],
        select: "name parent_id",
      })
      .populate({
        path: "club",
        model: User,
        select: "club_name",
      });

  activeInactiveUser = (filter, data) =>
    User.findOneAndUpdate(filter, { status: data }, { new: true });

  getperformerDetails = (data) =>
    User.find({ _id: data, is_deleted: false }, { _id: 0, talent: 1 }).populate(
      {
        path: "talent",
        model: categorySubcategory,
        select: "name",
      }
    );

  getExpertList = (data, options) =>
    User.find(data)
      .populate({
        path: "role_id",
        model: Role,
        select: "name",
      })
      .populate({
        path: "country_id",
        model: Country,
        select: "name",
      })
      .populate({
        path: "state_id",
        model: State,
        select: "name",
      })
      .populate({
        path: "language",
        model: Language,
        select: "name",
      })
      .populate({
        path: "talent",
        model: categorySubcategory,
        select: "name",
      })
      .populate({
        path: "club",
        model: User,
        select: "club_name",
      })
      .sort({ createdAt: "desc" })
      .skip(options.skip)
      .limit(options.limit);
  
  getPerformerList = (data, options) =>
    User.find(data)
      .populate({
        path: "role_id",
        model: Role,
        select: "name",
      })
      .populate({
        path: "country_id",
        model: Country,
        select: "name",
      })
      .populate({
        path: "state_id",
        model: State,
        select: "name",
      })
      .populate({
        path: "language",
        model: Language,
        select: "name",
      })
      .populate({
        path: "talent",
        model: categorySubcategory,
        select: "name",
      })
      .populate({
        path: "club",
        model: User,
        select: "club_name",
      })
      .sort({ createdAt: "desc" })
      .skip(options.skip)
      .limit(options.limit);

  getTotalExpertNumber = (query) => User.countDocuments(query);

  getTotalPerformerNumber = (query) => User.countDocuments(query);

  deleteUser = (filter, data) =>
    User.findOneAndUpdate(filter, { is_deleted: data }, { new: true });

  addRating = (data) => Rating.create(data);

  getRatings = (data) => Rating.find(data);

  getDevices = (data) => Device.find(data);

  getAndroidLeadByEmail = (email) => AndroidLead.findOne({ email });

  createAndroidLead = (data) => AndroidLead.create(data);

  androidLeadList = (data) => AndroidLead.find({}).sort({ created_at: "desc" })
    .skip(data.skip ? data.skip : 0)
    .limit(data.limit ? data.limit : 10);
  androidLeadTotalCount = () => AndroidLead.count()
}

export default new UserService();
