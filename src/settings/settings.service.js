import User from "../../database/models/User";
import Role from "../../database/models/Role";
import Country from "../../database/models/Country";
import State from "../../database/models/State";
import Language from "../../database/models/Language";
import Rating from "../../database/models/Rating";
import Device from "../../database/models/Device";
import Notification from "../../database/models/Notification";
import Transaction from "../../database/models/Transaction";
import Settings from "../../database/models/Settings";

class SettingsController {
  constructor() {}

  updateSettings = (data, id) => Settings.findOneAndUpdate({ user_id: { $eq: id } }, data);

  getSettings = (data) => Settings.findOne(data);

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
    // {
    //   path: "state_id",
    //   model: State,
    //   select: "name",
    // },
    {
      path: "language",
      model: Language,
      select: "name",
    },
  ]);

  updateUser = (data, id) => User.findOneAndUpdate({ _id: { $eq: id } }, data);

  createSettings = (data) => Settings.create(data);

}

export default new SettingsController();
