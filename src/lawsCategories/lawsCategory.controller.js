import { matchedData } from "express-validator";
import { CategoryService } from "./lawsCategory.services";
import { RESPONSE_CODES } from "../../config/constants.js";
import { CUSTOM_MESSAGES } from "../../config/customMessages.js";
import mongoose from 'mongoose';
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
        state: data.state,
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
      if(!cityLawList){
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          message: CUSTOM_MESSAGES.CITY_NOT_FOUND,
          data: null,
        };
      }
      const laws = [];
      for(let i=0; i< categoryLaw.laws.length; i++){
        const law = categoryLaw.laws[i];
        const data = cityLawList.laws.find((obj) => obj._id.toString() === law.law_id)
        laws.push(data);
      }
      console.log("categoryLaw :", categoryLaw);
      console.log("laws : ", laws);
      const categoryPayload = {
        name: categoryLaw.name,
        city: categoryLaw.city,
        state: categoryLaw.state,
        user_id: categoryLaw.user_id,
        _id: categoryLaw._id,
        active: categoryLaw.active,
        laws
      }
      return {
        status: RESPONSE_CODES.GET,
        success: true,
        message: CUSTOM_MESSAGES.DATA_LOADED_SUCCESS,
        data: categoryPayload,
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
  deleteCategory = async (req) => {
    const { params, user } = req;
    try {
      const categoryLaw = await this.service.getUserCategoryLaw({
        _id: params.category_id,
        user_id: user.data._id,
      });
      if (!categoryLaw) {
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          message: CUSTOM_MESSAGES.CATEGORY_NOT_FOUND,
          data: {},
        };
      }
      const response = await this.service.deleteUserCategoryLaw({
        _id: params.category_id,
        user_id: user.data._id,
      });
      return {
        status: RESPONSE_CODES.GET,
        success: true,
        message: CUSTOM_MESSAGES.CATEGORY_DELETED,
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
        user_id: user.data._id,
      });
      if (!categoryLaw) {
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          message: CUSTOM_MESSAGES.CATEGORY_NOT_FOUND,
          data: {},
        };
      }
      // Check for name duplicate within the same user's other categories
      const duplicate = await this.service.getUserCategoryLaw({
        name: data.name,
        user_id: user.data._id,
        _id: { $ne: new mongoose.Types.ObjectId(params.category_id) },
      });
      if (duplicate) {
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          message: CUSTOM_MESSAGES.CATEGORY_NAME_ALREADY_EXISTS,
          data: {},
        };
      }
      // Block state/city change when the category already has laws
      const stateChanging = data.state && data.state !== categoryLaw.state;
      const cityChanging = data.city && data.city !== categoryLaw.city;
      if ((stateChanging || cityChanging) && categoryLaw.laws.length > 0) {
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          message: "Remove all laws from this category before changing its state or city.",
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
      console.log("lawArr : ", lawArr);
      for (let i = 0; i < data.laws.length; i++) {
        const law_id = data.laws[i].law_id;
        const found = lawArr.some((data) => data.law_id === law_id);
        if (!found) {
          console.log("Not found : ", law_id);
          lawArr.push({ law_id, color: data.laws[i].color });
        }
      }
      const response = await this.service.updateUserCategoryLaw(
        { _id: data.category_id },
        {
          laws: lawArr,
        }
      );
      return {
        status: RESPONSE_CODES.POST,
        success: true,
        message: CUSTOM_MESSAGES.LAW_ADDED_SUCCESS,
        data: response,
      };
    } catch (error) {
      console.log("Error : ", error);
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
  deleteLawFromCategory = async (req) => {
    const data = matchedData(req);
    const { params, user } = req;
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
      const newArray = lawArr.filter((element) => element.law_id !== data.law_id);
      const payload = {
        laws: newArray,
      };
      const response = await this.service.updateUserCategoryLaw(
        { _id: data.category_id },
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

      // Annotate each category with how many tracked state laws have changed
      // since the user last saw them — the visible "tracking" payoff.
      const allIds = [];
      for (const cat of response) {
        for (const sl of cat.state_laws || []) allIds.push(sl.law_id);
      }
      let versionById = {};
      if (allIds.length) {
        const current = await this.service.getStateLawsByIds(allIds);
        versionById = current.reduce((acc, l) => {
          acc[l._id.toString()] = l.version;
          return acc;
        }, {});
      }
      const annotated = response.map((cat) => {
        const updatesCount = (cat.state_laws || []).filter((sl) => {
          const v = versionById[sl.law_id];
          return v !== undefined && v > (sl.last_seen_version || 1);
        }).length;
        return {
          ...cat,
          tracked_count: (cat.state_laws || []).length,
          updates_count: updatesCount,
        };
      });

      return {
        status: RESPONSE_CODES.POST,
        success: true,
        message: CUSTOM_MESSAGES.DATA_LOADED_SUCCESS,
        data: annotated,
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

  /* add StateLaw record(s) to a category's tracked list */
  addStateLawToCategory = async (req) => {
    const data = matchedData(req);
    const { user } = req;
    try {
      const category = await this.service.getUserCategoryLaw({
        _id: data.category_id,
        user_id: user.data._id,
      });
      if (!category) {
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          message: CUSTOM_MESSAGES.CATEGORY_NOT_FOUND,
          data: {},
        };
      }
      const incoming = Array.isArray(data.laws) ? data.laws : [];
      const ids = incoming.map((l) => l.law_id);
      const current = await this.service.getStateLawsByIds(ids);
      const byId = current.reduce((acc, l) => {
        acc[l._id.toString()] = l;
        return acc;
      }, {});

      const existing = [...(category.state_laws || [])];
      for (const item of incoming) {
        const law = byId[item.law_id];
        if (!law) continue; // skip unknown/deleted laws
        if (existing.some((e) => e.law_id === item.law_id)) continue; // dedupe
        existing.push({
          law_id: item.law_id,
          state_code: law.state_code,
          law_key: law.law_key,
          color: item.color || "#3482CB",
          last_seen_version: law.version,
          last_seen_summary: law.summary || "",
          last_seen_legality: this.service.classifyLegality(law.law_key, law.summary),
          added_at: new Date(),
        });
      }

      const response = await this.service.updateUserCategoryLaw(
        { _id: data.category_id },
        { state_laws: existing }
      );
      return {
        status: RESPONSE_CODES.POST,
        success: true,
        message: CUSTOM_MESSAGES.LAW_ADDED_SUCCESS,
        data: response,
      };
    } catch (error) {
      console.log("Error :", error);
      return {
        status: RESPONSE_CODES.SERVER_ERROR,
        success: false,
        message: error,
        data: {},
      };
    }
  };
  /* end */

  /* list a category's tracked state laws, hydrated with current data + change status */
  getTrackedStateLaws = async (req) => {
    const { params, user } = req;
    try {
      const category = await this.service.getUserCategoryLaw({
        _id: params.category_id,
        user_id: user.data._id,
      });
      if (!category) {
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          message: CUSTOM_MESSAGES.CATEGORY_NOT_FOUND,
          data: {},
        };
      }
      const tracked = category.state_laws || [];
      const current = await this.service.getStateLawsByIds(
        tracked.map((t) => t.law_id)
      );
      const byId = current.reduce((acc, l) => {
        acc[l._id.toString()] = l;
        return acc;
      }, {});

      const laws = tracked.map((t) => {
        const law = byId[t.law_id];
        if (!law) {
          // The law was removed upstream — surface as repealed/unavailable.
          return {
            law_id: t.law_id,
            state_code: t.state_code,
            law_key: t.law_key,
            color: t.color,
            available: false,
            updated: false,
          };
        }
        const updated = (law.version || 1) > (t.last_seen_version || 1);
        return {
          law_id: t.law_id,
          state_code: law.state_code,
          law_key: law.law_key,
          color: t.color,
          title: law.title,
          summary: law.summary,
          details: law.details,
          penalty_text: law.penalty_text,
          effective_from: law.effective_from,
          updatedAt: law.updatedAt,
          version: law.version,
          legality: this.service.classifyLegality(law.law_key, law.summary),
          available: true,
          updated,
          diff: updated
            ? { from: t.last_seen_summary, to: law.summary }
            : null,
        };
      });

      return {
        status: RESPONSE_CODES.GET,
        success: true,
        message: CUSTOM_MESSAGES.DATA_LOADED_SUCCESS,
        data: {
          _id: category._id,
          name: category.name,
          state: category.state,
          updates_count: laws.filter((l) => l.updated).length,
          laws,
        },
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

  /* remove a tracked state law from a category */
  removeStateLawFromCategory = async (req) => {
    const data = matchedData(req);
    const { user } = req;
    try {
      const category = await this.service.getUserCategoryLaw({
        _id: data.category_id,
        user_id: user.data._id,
      });
      if (!category) {
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          message: CUSTOM_MESSAGES.CATEGORY_NOT_FOUND,
          data: {},
        };
      }
      const next = (category.state_laws || []).filter(
        (e) => e.law_id !== data.law_id
      );
      const response = await this.service.updateUserCategoryLaw(
        { _id: data.category_id },
        { state_laws: next }
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

  /* acknowledge an update — snapshot the current version so the badge clears */
  markStateLawSeen = async (req) => {
    const data = matchedData(req);
    const { user } = req;
    try {
      const category = await this.service.getUserCategoryLaw({
        _id: data.category_id,
        user_id: user.data._id,
      });
      if (!category) {
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          message: CUSTOM_MESSAGES.CATEGORY_NOT_FOUND,
          data: {},
        };
      }
      const current = await this.service.getStateLawsByIds([data.law_id]);
      const law = current[0];
      const next = (category.state_laws || []).map((e) => {
        if (e.law_id !== data.law_id || !law) return e;
        return {
          ...e,
          last_seen_version: law.version,
          last_seen_summary: law.summary || "",
          last_seen_legality: this.service.classifyLegality(law.law_key, law.summary),
        };
      });
      const response = await this.service.updateUserCategoryLaw(
        { _id: data.category_id },
        { state_laws: next }
      );
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

  /* laws list of a city */
  cityLawList = async (req) => {
    const data = matchedData(req);
    try {
      const response = await this.service.getAllCityLaws({ city: data.city });
      return {
        status: RESPONSE_CODES.GET,
        success: true,
        message: CUSTOM_MESSAGES.DATA_LOADED_SUCCESS,
        data: response
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
      if(!cityLaws){
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          message: CUSTOM_MESSAGES.CITY_NOT_FOUND,
          data: null,
        };
      }
      let cityLawsArr = [];
      if (cityLaws && cityLaws.laws) {
        for (let law of cityLaws.laws) {
          cityLawsArr.push(law._id);
        }
      }
      const categoryLaws = await this.service.getUserCategoryLaw({
        _id: data.category_id,
        user_id: user.data._id,
      });
      const response = cityLaws.laws.filter(
        (law) => !categoryLaws.laws.some((data) => data.law_id === law._id.toString()) 
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
      const cityLaws = await this.service.getCityLaws({
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
              } else {
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
              } else {
                userLikeObj.is_dislike = true;
                userLikeObj.is_like = false;
              }
              law.dislikes = law.dislikes + 1;
            }
            if (userLikedDetail) {
              await this.service.updateUserLikedLaw(
                { _id: userLikedDetail._id },
                userLikeObj
              );
            } else {
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
      console.log("Error : ", error);
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
