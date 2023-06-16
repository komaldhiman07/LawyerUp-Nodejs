import { matchedData } from "express-validator";
import UserCategoryLawsService from "./userCategoryLaws.services";
import { RESPONSE_CODES } from "../../config/constants.js";
import { CUSTOM_MESSAGES } from "../../config/customMessages.js";
class UserCategoryLawsController {
  constructor() { }

  /* add category law */
  addCategoryLaw = async (req) => {
    const data = matchedData(req);
    const { user } = req;
    try {
      /* check whether the city law already exists as category or not */
      const categoryLaw = await UserCategoryLawsService.getUserCategoryLaw({ city: data.city, name: data.name, user_id: user.data._id });
      if (categoryLaw) {
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          message: CUSTOM_MESSAGES.CATEGORY_NAME_ALREADY_EXISTS,
          data: {},
        };
      }
      const payload = {
        ...data,
        user_id: user.data._id,
      }
      const response = await UserCategoryLawsService.addCategoryLaw(payload);
      return {
        status: RESPONSE_CODES.POST,
        success: true,
        message: CUSTOM_MESSAGES.LAW_CATEGORY_ADDED_SUCCESS,
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

  /* get category law by category law id */
  getCategoryLaw = async (req) => {
    const { params } = req;
    try {
      const categoryLaw = await UserCategoryLawsService.getUserCategoryLaw({ _id: params.category_law_id });
      if (!categoryLaw) {
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          message: CUSTOM_MESSAGES.LAW_NOT_FOUND,
          data: {},
        };
      }
      const cityLawList = await UserCategoryLawsService.getAllCityLaws({ city: categoryLaw.city });
      const lawDetail = categoryLaw.laws.map(id =>  {
        return cityLawList.laws.find(obj => obj.id === id);
      });
      categoryLaw.laws = lawDetail;
      return {
        status: RESPONSE_CODES.POST,
        success: true,
        message: CUSTOM_MESSAGES.LAW_FOUND_SUCCESS,
        data: categoryLaw,
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

  /* delete category law by category law id */
  deleteCategoryLaw = async (req) => {
    const { params } = req;
    try {
      const categoryLaw = await UserCategoryLawsService.getUserCategoryLaw({ _id: params.category_law_id });
      if (!categoryLaw) {
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          message: CUSTOM_MESSAGES.LAW_NOT_FOUND,
          data: {},
        };
      }
      const response = await UserCategoryLawsService.deleteUserCategoryLaw({ _id: params.category_law_id });
      return {
        status: RESPONSE_CODES.POST,
        success: true,
        message: CUSTOM_MESSAGES.LAW_DELETE_SUCCESS,
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

  /* update category law by category law id */
  updateCategoryLaw = async (req) => {
    const data = matchedData(req);
    const { params, user } = req;
    try {
      const categoryLaw = await UserCategoryLawsService.getUserCategoryLaw({ _id: params.category_law_id });
      if (!categoryLaw) {
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          message: CUSTOM_MESSAGES.CATEGORY_NOT_FOUND,
          data: {},
        };
      }
      const isCategoryNameExists = await UserCategoryLawsService.getUserCategoryLaw({ name: data.name, user_id: user.data._id });
      if (isCategoryNameExists) {
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          message: CUSTOM_MESSAGES.CATEGORY_NAME_ALREADY_EXISTS,
          data: {},
        };
      }
      const response = await UserCategoryLawsService.updateUserCategoryLaw({ _id: params.category_law_id }, data);
      return {
        status: RESPONSE_CODES.POST,
        success: true,
        message: CUSTOM_MESSAGES.CATEGORY_LAW_UPDATE_SUCCESS,
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

  /* add law to category law by category law id */
  addLawtoCategoryLaw = async (req) => {
    const data = matchedData(req);
    const { params, user } = req;
    try {
      const categoryLaw = await UserCategoryLawsService.getUserCategoryLaw({ _id: data.category_law_id });
      if (!categoryLaw) {
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          message: CUSTOM_MESSAGES.CATEGORY_NOT_FOUND,
          data: {},
        };
      }
      const lawArr = [...categoryLaw.laws];
      lawArr.push(data.law_id)
      const payload = {
        laws: lawArr,
      }
      const response = await UserCategoryLawsService.updateUserCategoryLaw({ _id: data.category_law_id }, payload);
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

  /* delete law from category law by category law id */
  deleteLawFromCategoryLaw = async (req) => {
    const data = matchedData(req);
    const { params, user } = req;
    try {
      const categoryLaw = await UserCategoryLawsService.getUserCategoryLaw({ _id: data.category_law_id });
      if (!categoryLaw) {
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          message: CUSTOM_MESSAGES.CATEGORY_NOT_FOUND,
          data: {},
        };
      }
      const lawArr = [...categoryLaw.laws];
      const newArray = lawArr.filter((element) => element !== data.law_id);
      const payload = {
        laws: newArray,
      }
      const response = await UserCategoryLawsService.updateUserCategoryLaw({ _id: data.category_law_id }, payload);
      return {
        status: RESPONSE_CODES.POST,
        success: true,
        message: CUSTOM_MESSAGES.LAW_DELETE_SUCCESS,
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

  /* get list of category laws */
  categoryLawList = async (req) => {
    const { user } = req;
    try {
      const response = await UserCategoryLawsService.getCategoryLawList({ user_id: user.data._id });
      return {
        status: RESPONSE_CODES.POST,
        success: true,
        message: CUSTOM_MESSAGES.DATA_LOADED_SUCCESS,
        data: response,
      };
    } catch (error) {
      console.log('error :>> ', error);
      return {
        status: RESPONSE_CODES.SERVER_ERROR,
        success: false,
        message: error,
        data: {},
      };
    }
  };
  /* end */

  /* laws list of a city */
  cityLawList = async (req) => {
    const data = matchedData(req);
    const { user } = req;
    try {
      const response = await UserCategoryLawsService.getAllCityLaws({ city: data.city });
      return {
        status: RESPONSE_CODES.POST,
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

  /* law list of the city which are not added as favourite */
  remainingLawList = async (req) => {
    const data = matchedData(req);
    const { user } = req;
    try {
      /* get all laws of a city */
      const cityLaws = await UserCategoryLawsService.getAllCityLaws({ city: data.city });
      let cityLawsArr = [];
      if (cityLaws && cityLaws.laws) {
        for (let law of cityLaws.laws) {
          cityLawsArr.push(law._id)
        }
      }
      const categoryLaws = await UserCategoryLawsService.getUserCategoryLaw({ _id: data.category_law_id, user_id: user.data._id });
      const response = cityLawsArr.filter((element) => !categoryLaws.laws.includes(element));
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

export default UserCategoryLawsController;
