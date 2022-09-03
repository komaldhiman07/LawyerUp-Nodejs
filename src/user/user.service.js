import User from "../../database/models/User";
import Role from "../../database/models/Role";
import Country from "../../database/models/Country";
import State from "../../database/models/State";
import Language from "../../database/models/Language";
import Rating from "../../database/models/Rating";
import Device from "../../database/models/Device";
import Notification from "../../database/models/Notification";
import Transaction from "../../database/models/Transaction";

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

  activeInactiveUser = (filter, data) =>
    User.findOneAndUpdate(filter, { status: data }, { new: true });
  
  deleteUser = (filter, data) =>
    User.findOneAndUpdate(filter, { is_deleted: data }, { new: true });

  addRating = (data) => Rating.create(data);

  getRatings = (data) => Rating.find(data);

  getDevices = (data) => Device.find(data);

}

export default new UserService();
