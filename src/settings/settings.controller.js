import bcrypt from "bcrypt";
import { matchedData } from "express-validator";
import jwt from "jsonwebtoken";

import settingsService from "./settings.service.js";
import {
  RESPONSE_CODES,
} from "../../config/constants.js";
import { CUSTOM_MESSAGES } from "../../config/customMessages.js";

let _ = require("lodash");

class settingsController {
  constructor() {}

  /* get user settings */
  getSettings = async (req) => {
    const { user } = req;
    try {
      const response = await settingsService.getSettings({ user_id: user.data._id });
      if (!response) {
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          message: CUSTOM_MESSAGES.SETTINGS_NOT_FOUND,
          data: {},
        };
      }
      return {
        status: RESPONSE_CODES.GET,
        success: true,
        message: CUSTOM_MESSAGES.DATA_LOADED_SUCCESS,
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

  /* update user settings */
  updateSettings = async (req) => {
    const data = matchedData(req);
      const { user } = req;
      try {
        data.user_id =  user.data._id 
        await settingsService.updateSettings(data,  user.data._id);
        const setting = await settingsService.getSettings({ user_id: user.data._id });
        return {
          status: RESPONSE_CODES.POST,
          success: true,
          message: CUSTOM_MESSAGES.SETTINGS_UPDATED_SUCCESS,
          data: {...setting.toObject()},
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

    /* change user password */
  changePassword = async (req) => {
    const data = matchedData(req);
      const { user } = req;
      try {
        const getUser = await settingsService.getUser({ _id: user.data._id });
        console.log("getUser: ", getUser);
      if (!getUser) {
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          message: CUSTOM_MESSAGES.USER_NOT_FOUND,
          data: {},
        };
      }
      const authenticate = await bcrypt.compare(
        data.old_password,
        getUser.password
      );
      console.log("authenticate: ", authenticate);
      if (!authenticate) {
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          message: CUSTOM_MESSAGES.INVALID_CREDENTIALS,
          data: {},
        };
      }else {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(data.new_password, salt)
        await settingsService.updateUser(
          {
            password: hash,
          },
          user.data._id
        );
        return {
          status: RESPONSE_CODES.POST,
          success: true,
          message: CUSTOM_MESSAGES.PASSWORD_CHANGE_SUCCESS,
          data: {},
        };
      }
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

export default settingsController;
