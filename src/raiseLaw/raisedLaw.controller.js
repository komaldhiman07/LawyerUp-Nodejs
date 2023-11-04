import { matchedData } from "express-validator";
import raiseLawService from "./raisedLaw.service.js";
import { RESPONSE_CODES } from "../../config/constants.js";
import { CUSTOM_MESSAGES } from "../../config/customMessages.js";

class LawsController {
  constructor() {}

  /* raise law */
  raiseLaw = async (req) => {
    const data = matchedData(req);
    const { user } = req;
    try {
      data.user_id = user.data._id;
      const result = await raiseLawService.addRaisedLaw(data);
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
      const result = await raiseLawService.getRaisedLawById({
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
      const raisedLaw = await raiseLawService.getRaisedLawById({
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
      await raiseLawService.updateRaisedLaw(
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
      const raisedLaw = await raiseLawService.getRaisedLawById({
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
      const result = await raiseLawService.deleteRaisedLaw({
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
    const { query, user } = req;
    try {
      const response = await raiseLawService.getRaisedLawList({
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

  generateLawReport = async (req) => {
    const data = matchedData(req);
    console.log("data :", data);
    const { source, destination } = data;
    try {
      const sourceCityData = await raiseLawService.getCityLaws({
        city: source.city,
        state: source.state,
      });
      //console.log("sourceCityData :", sourceCityData);
      const destinationCityData = await raiseLawService.getCityLaws({
        city: destination.city,
        state: destination.state,
      });
      const response = await this.compareLawsByQnA(
        sourceCityData,
        destinationCityData
      );
      return {
        status: RESPONSE_CODES.GET,
        success: true,
        message: CUSTOM_MESSAGES.DATA_LOADED_SUCCESS,
        data: response,
      };
    } catch (e) {
      console.log("e : ", e);
      return {
        status: RESPONSE_CODES.SERVER_ERROR,
        success: false,
        message: e,
        data: {},
      };
    }
  };

  async compareLawsByQnA(city1Data, city2Data) {
    const diff = [];
    if(!city1Data && !city2Data){
      return diff;
    }
    if(city1Data && !city2Data){
      city1Data.laws.forEach((city1) => {
        diff.push({
          title: city1.title,
          cities: [
            {
              city: city1Data.city,
              state: city1Data.state,
              result: city1.description,
            },
          ],
        });
      })
      return diff;
    }
    if(!city1Data && city2Data){
      city2Data.laws.forEach((city2) => {
        diff.push({
          title: city2.title,
          cities: [
            {
              city: city2Data.city,
              state: city2Data.state,
              result: city2.description,
            },
          ],
        });
      })
      return diff;
    }
    city1Data.laws.forEach((city1) => {
      const city2 = city2Data.laws.find((item) => item.title === city1.title);
      // Prepare and return the structured response
      const cities = [
        {
          city: city1Data.city,
          state: city1Data.state,
          result: city1.description,
        },
      ];
      if(city2){
        cities.push({
          city: city2Data.city,
          state: city2Data.state,
          result: city2.description,
        });
      }
      diff.push({
        title: city1.title,
        cities,
      });
    });
    return diff;
  }
}

export default LawsController;
