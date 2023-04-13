import User from "../../database/models/User";
import Role from "../../database/models/Role";
import Country from "../../database/models/Country";
import State from "../../database/models/State";
import Language from "../../database/models/Language";
import Rating from "../../database/models/Rating";
import Device from "../../database/models/Device";
import Notification from "../../database/models/Notification";
import Transaction from "../../database/models/Transaction";
import ContactUs from "../../database/models/ContactUs";

class ContactUsService {
  constructor() {}

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

  addContactUs = (data) => ContactUs.create(data);

}

export default new ContactUsService();
