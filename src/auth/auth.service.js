import User from "../../database/models/User";
import Role from "../../database/models/Role";
import Device from "../../database/models/Device";
import Country from "../../database/models/Country";
import State from "../../database/models/State";
import Language from "../../database/models/Language";

class AuthService {
  constructor() {}

  getUser = (data) =>
    User.findOne(data).populate([
      { path: "role_id", model: Role, select: "name" },
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

  createUser = (data) => User.create(data);

  createDevice = (data) => Device.create(data);

  updateDevice = (query, data) => Device.updateOne(query, data);

  deleteUser = (data) => User.deleteOne(data);

  deleteDevice = (data) => Device.deleteOne(data);

  getRole = (data) => Role.findOne(data);

  getDevice = (data) => Device.findOne(data);

  updateUser = (query, data) => User.updateOne(query, data);
}

export default new AuthService();
