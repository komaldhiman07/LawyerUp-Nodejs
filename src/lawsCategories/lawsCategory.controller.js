import { matchedData } from "express-validator";
import { CategoryService } from "./lawsCategory.services";
import { RESPONSE_CODES } from "../../config/constants.js";
import { CUSTOM_MESSAGES } from "../../config/customMessages.js";
export class LawsCategoriesController {
  constructor() {
    this.service = new CategoryService();
  }

  /* add category law */
  addCategory = async (req) => {
    const data = matchedData(req);
    const { user } = req;
    try {
      /* check whether the city law already exists as category or not */
      const categoryLaw = await this.service.getUserCategoryLaw({
        city: data.city,
        name: data.name,
        user_id: user.data._id,
      });
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
      };
      const response = await this.service.addCategoryLaw(payload);
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
      const categoryLaw = await this.service.getUserCategoryLaw({
        _id: params.category_id,
      });
      if (!categoryLaw) {
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          message: CUSTOM_MESSAGES.LAW_NOT_FOUND,
          data: {},
        };
      }
      const cityLawList = await this.service.getAllCityLaws({
        city: categoryLaw.city,
      });
      const lawDetail = categoryLaw.laws.map((id) => {
        return cityLawList.laws.find((obj) => obj.id === id);
      });
      categoryLaw.laws = lawDetail;
      return {
        status: RESPONSE_CODES.POST,
        success: true,
        message: CUSTOM_MESSAGES.DATA_LOADED_SUCCESS,
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
      const categoryLaw = await this.service.getUserCategoryLaw({
        _id: params.category_id,
      });
      if (!categoryLaw) {
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          message: CUSTOM_MESSAGES.LAW_NOT_FOUND,
          data: {},
        };
      }
      const response = await this.service.deleteUserCategoryLaw({
        _id: params.category_law_id,
      });
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
      const categoryLaw = await this.service.getUserCategoryLaw({
        _id: params.category_id,
      });
      if (!categoryLaw) {
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          message: CUSTOM_MESSAGES.CATEGORY_NOT_FOUND,
          data: {},
        };
      }
      const isCategoryNameExists = await this.service.getUserCategoryLaw({
        name: data.name,
        user_id: { $ne: user.data._id },
      });
      if (isCategoryNameExists && isCategoryNameExists.user_id) {
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          message: CUSTOM_MESSAGES.CATEGORY_NAME_ALREADY_EXISTS,
          data: {},
        };
      }
      const response = await this.service.updateUserCategoryLaw(
        { _id: params.category_id },
        data
      );
      return {
        status: RESPONSE_CODES.POST,
        success: true,
        message: CUSTOM_MESSAGES.CATEGORY_UPDATE_SUCCESS,
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
  addLawToCategoryLaw = async (req) => {
    const data = matchedData(req);
    try {
      const categoryLaw = await this.service.getUserCategoryLaw({
        _id: data.category_id,
      });
      if (!categoryLaw) {
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          message: CUSTOM_MESSAGES.CATEGORY_NOT_FOUND,
          data: {},
        };
      }
      const lawArr = [...categoryLaw.laws];
      lawArr.push(data.law_id);
      const payload = {
        laws: lawArr,
      };
      const response = await this.service.updateUserCategoryLaw(
        { _id: data.category_id },
        payload
      );
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
      const categoryLaw = await this.service.getUserCategoryLaw({
        _id: data.category_law_id,
      });
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
      };
      const response = await this.service.updateUserCategoryLaw(
        { _id: data.category_law_id },
        payload
      );
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
  listCategories = async (req) => {
    const { user } = req;
    try {
      const response = await this.service.getCategoryLawList({
        user_id: user.data._id,
      });
      return {
        status: RESPONSE_CODES.POST,
        success: true,
        message: CUSTOM_MESSAGES.DATA_LOADED_SUCCESS,
        data: response,
      };
    } catch (error) {
      console.log("error :>> ", error);
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
    try {
      const response = await this.service.getAllCityLaws({ city: data.city });
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
      const cityLaws = await this.service.getAllCityLaws({ city: data.city });
      let cityLawsArr = [];
      if (cityLaws && cityLaws.laws) {
        for (let law of cityLaws.laws) {
          cityLawsArr.push(law._id);
        }
      }
      const categoryLaws = await this.service.getUserCategoryLaw({
        _id: data.category_law_id,
        user_id: user.data._id,
      });
      const response = cityLawsArr.filter(
        (element) => !categoryLaws.laws.includes(element)
      );
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

  /* like dislike law */
  likeDislikeLawOfACity = async (req) => {
    const data = matchedData(req);
    const { user } = req;
    const { action_type, master_law_id, law_id } = data;
    try {
      const cityLaws = await this.service.getAllCityLaws({
        _id: master_law_id,
      });
      const lawsArr = [];
      let userLikeObj = {};
      if (cityLaws) {
        for (let law of cityLaws.laws) {
          if (law._id.toString() === law_id) {
            userLikeObj.law_id = law_id;
            userLikeObj.user_id = user.data._id;
            const userLikedDetail = await this.service.getUserLikedLaw({
              user_id: user.data._id,
              law_id,
            });
            console.log("userLikedDetail :", userLikedDetail);
            if (action_type) {
              if (userLikedDetail && userLikedDetail.is_like) {
                return {
                  status: RESPONSE_CODES.BAD_REQUEST,
                  success: false,
                  message: CUSTOM_MESSAGES.ALREADY_LIKED,
                  data: {},
                };
              }
              if (userLikedDetail && userLikedDetail.is_dislike) {
                law.dislikes = law.dislikes ? law.dislikes - 1 : law.dislikes;
                userLikeObj.is_dislike = false;
                userLikeObj.is_like = true;
              }else{
                userLikeObj.is_like = true;
                userLikeObj.is_dislike = false;
              }
              law.likes = law.likes + 1;
            } else {
              if (userLikedDetail && userLikedDetail.is_dislike) {
                return {
                  status: RESPONSE_CODES.BAD_REQUEST,
                  success: false,
                  message: CUSTOM_MESSAGES.ALREADY_DISLIKED,
                  data: {},
                };
              }
              if (userLikedDetail && userLikedDetail.is_like) {
                law.likes = law.likes ? law.likes - 1 : law.likes;
                userLikeObj.is_like = false;
                userLikeObj.is_dislike = true;
              }else{
                userLikeObj.is_dislike = true;
                userLikeObj.is_like = false;
              }
              law.dislikes = law.dislikes + 1;
            }
            if(userLikedDetail){
              await this.service.updateUserLikedLaw({_id: userLikedDetail._id}, userLikeObj);
            }else{
              await this.service.createUserLikedLaw(userLikeObj);
            }
            lawsArr.push(law);
          } else {
            lawsArr.push(law);
          }
        }
      }
      const userLikedDetail = await this.service.getUserLikedLaw({
        user_id: user._id,
        law_id,
      });
      if (userLikedDetail && userLikedDetail._id) {
        // Update user liked laws model
        if (userLikedDetail.is_liked && !action_type) {
        }
      }
      await this.service.updateCityLaws(
        { _id: master_law_id },
        { laws: lawsArr }
      );
      const updatedLaw = await this.service.getAllCityLaws({
        _id: master_law_id,
      });
      return {
        status: RESPONSE_CODES.GET,
        success: true,
        message: CUSTOM_MESSAGES.DATA_LOADED_SUCCESS,
        data: updatedLaw,
      };
    } catch (error) {
      console.log("Error : ", error)
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
