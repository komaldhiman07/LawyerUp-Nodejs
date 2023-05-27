import bcrypt from "bcrypt";
import { matchedData } from "express-validator";

import UserFavouriteLawsService from "./userFavouriteLaws.service.js";
import {
  RESPONSE_CODES,
  TWO_FACTOR_AUTH_TYPE,
  DEFAULT,
} from "../../config/constants.js";
import { CUSTOM_MESSAGES } from "../../config/customMessages.js";

let _ = require("lodash");

class UserFavouriteLawsController {
  constructor() {}

  /* add favourite law */
  addFavouriteLaw = async (req) => {
    const data = matchedData(req);
    const { user } = req;
    try {
      /* check whether the city law already exists as favourite or not */
      const favouriteLaw = await UserFavouriteLawsService.getUserFavouriteLaw({ law_id: data.law_id, city: data.city });
      console.log("favouriteLaw: ", favouriteLaw);
      if (favouriteLaw) {
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          message: CUSTOM_MESSAGES.LAW_ALREADY_EXISTS,
          data: {},
        };
      }
      const payload = {
        ...data,
        user_id: user.data._id,
        /* TODO: need to discuss the name value */
        name: "dafault list"
      }
      const response = await UserFavouriteLawsService.addUserFavouriteLaw(payload);
      return {
        status: RESPONSE_CODES.POST,
        success: true,
        message: CUSTOM_MESSAGES.LAW_ADDED_SUCCESS,
        data: response,
      };
    } catch (error) {
      return {
        status: RESPONSE_CODES.SERVER_ERROR,
        success: false,
        message: error,
        data: {},
      };
    }
  };
  /* end */

}

export default UserFavouriteLawsController;
