import { matchedData } from "express-validator";
import lawsService from "./laws.service.js";
import { RESPONSE_CODES } from "../../config/constants.js";
import { CUSTOM_MESSAGES } from "../../config/customMessages.js";

class LawsController {
  constructor() {}

  /* raise law */
  raiseLaw = async (req) => {
    const data = matchedData(req);
    console.log("data :>> ", data);
    const { user } = req;
    try {
      data.user_id = user.data._id;
      const result = await lawsService.addRaisedLaw(data);
      return {
        status: RESPONSE_CODES.POST,
        success: true,
        message: CUSTOM_MESSAGES.LAW_RAISED_SUCCESS,
        data: result,
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

  /* get raised law by id */
  getRaisedLaw = async (req) => {
    const { query, user } = req;
    try {
      const result = await lawsService.getRaisedLawById({
        _id: query.raised_law_id,
        user_id: user.data._id,
      });
      if (!result) {
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          message: CUSTOM_MESSAGES.LAW_NOT_FOUND,
          data: {},
        };
      }
      return {
        status: RESPONSE_CODES.GET,
        success: true,
        message: CUSTOM_MESSAGES.LAW_FOUND_SUCCESS,
        data: result,
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

  /* update raised law */
  updateRaisedLaw = async (req) => {
    const data = matchedData(req);
    const { query, user } = req;
    try {
      const raisedLaw = await lawsService.getRaisedLawById({
        _id: query.raised_law_id,
        user_id: user.data._id,
      });
      if (!raisedLaw) {
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          message: CUSTOM_MESSAGES.LAW_NOT_FOUND,
          data: {},
        };
      }
      await lawsService.updateRaisedLaw(
        { _id: query.raised_law_id, user_id: user.data._id },
        data
      );
      return {
        status: RESPONSE_CODES.POST,
        success: true,
        message: CUSTOM_MESSAGES.LAW_UPDATE_SUCCESS,
        data: {},
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

  /* delete raised law */
  deleteRaisedLaw = async (req) => {
    const { query, user } = req;
    try {
      const raisedLaw = await lawsService.getRaisedLawById({
        _id: query.raised_law_id,
        user_id: user.data._id,
      });
      if (!raisedLaw) {
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          message: CUSTOM_MESSAGES.LAW_NOT_FOUND,
          data: {},
        };
      }
      const result = await lawsService.deleteRaisedLaw({
        _id: query.raised_law_id,
        user_id: user.data._id,
      });
      return {
        status: RESPONSE_CODES.POST,
        success: true,
        message: CUSTOM_MESSAGES.LAW_DELETE_SUCCESS,
        data: {},
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

  /* get raised law list */
  getRaisedLawList = async (req) => {
    const data = matchedData(req);
    const { query, user } = req;
    try {
      const response = await lawsService.getRaisedLawList({
        user_id: user.data._id,
      });
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
}

export default LawsController;
