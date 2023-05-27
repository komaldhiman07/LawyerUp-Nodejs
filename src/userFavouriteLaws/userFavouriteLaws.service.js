import User from "../../database/models/User";
import Role from "../../database/models/Role";
import Country from "../../database/models/Country";
import State from "../../database/models/State";
import Language from "../../database/models/Language";
import UserFavouriteLaws from "../../database/models/UserFavouriteLaws";

class UserFavouriteLawsService {
  constructor() {}

/* add favourite law */
addUserFavouriteLaw = (data) => UserFavouriteLaws.create(data);
/* end */

/* get favourite law by city and law id */
getUserFavouriteLaw = (data) => UserFavouriteLaws.findOne(data);
/* end */

getDevices = (data) => Device.find(data);

}

export default new UserFavouriteLawsService();
