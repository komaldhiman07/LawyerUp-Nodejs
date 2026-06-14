import { matchedData } from "express-validator";
import raiseLawService from "./raisedLaw.service.js";
import { RESPONSE_CODES } from "../../config/constants.js";
import { CUSTOM_MESSAGES } from "../../config/customMessages.js";
import StateLaw from "../../database/models/StateLaw.js";
import { classifyLegality } from "../helpers/lawClassifier.js";

class LawsController {
  constructor() {}

  /* raise law */
  raiseLaw = async (req) => {
    const data = matchedData(req);
    const { user } = req;
    try {
      data.user_id = user.data._id;
      data.type = data.type || "missing";
      data.status = "submitted";        // new submissions always enter the queue
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

  /* aggregate stats per law category — powers the app home category grid */
  getStateLawStats = async (req) => {
    try {
      const laws = await StateLaw
        .find({ status: 'active', is_deleted: false })
        .select('state_code law_key summary')
        .lean();

      const byKey = {};
      for (const law of laws) {
        (byKey[law.law_key] = byKey[law.law_key] || []).push(law);
      }

      const stats = {};
      for (const [key, arr] of Object.entries(byKey)) {
        const total = new Set(arr.map((a) => a.state_code)).size;
        const summaries = arr.map((a) => a.summary || '');
        let headline;

        if (key === 'marijuana' || key === 'gambling') {
          const n = summaries.filter(
            (s) => /legal/i.test(s) && !/illegal/i.test(s)
          ).length;
          headline = `${n} legal`;
        } else if (key === 'guns') {
          const n = summaries.filter(
            (s) => /permitless|constitutional/i.test(s)
          ).length;
          headline = `${n} permitless`;
        } else if (key === 'death_penalty') {
          const n = summaries.filter(
            (s) => /abolish|no death penalty|repeal/i.test(s)
          ).length;
          headline = `${n} abolished`;
        } else if (key === 'minimum_wage') {
          const amounts = summaries
            .map((s) => {
              const m = s.match(/\$\s*([0-9]+(?:\.[0-9]+)?)/);
              return m ? parseFloat(m[1]) : null;
            })
            .filter((x) => x !== null);
          headline = amounts.length
            ? `$${Math.min(...amounts).toFixed(0)}–$${Math.max(...amounts).toFixed(0)}`
            : `${total} states`;
        } else {
          headline = `${total} states`;
        }

        stats[key] = { total, headline };
      }

      return {
        status: RESPONSE_CODES.GET,
        success: true,
        message: CUSTOM_MESSAGES.DATA_LOADED_SUCCESS,
        data: stats,
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

  /* law change detail — before/after diffs from audit log */
  getStateLawChangeDetail = async (req) => {
    const { query } = req;
    try {
      const detail = await raiseLawService.getStateLawChangeDetail({
        stateCode: query.state_code,
        lawKey: query.law_key,
        homeState: query.home_state,
        changeTypeHint: query.change_type,
      });
      if (!detail) {
        return {
          status: RESPONSE_CODES.NOT_FOUND,
          success: false,
          message: CUSTOM_MESSAGES.LAW_NOT_FOUND,
          data: {},
        };
      }
      return {
        status: RESPONSE_CODES.GET,
        success: true,
        message: CUSTOM_MESSAGES.DATA_LOADED_SUCCESS,
        data: detail,
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

  /* list active state laws — user-facing read-only endpoint */
  getStateLaws = async (req) => {
    const { query } = req;
    try {
      const filter = { status: 'active', is_deleted: false };
      if (query.state_code) filter.state_code = query.state_code.trim().toUpperCase();
      if (query.law_key)    filter.law_key    = query.law_key.trim().toLowerCase();
      if (query.q)          filter.$text      = { $search: query.q.trim() };

      const rows = await StateLaw
        .find(filter)
        .select('state_code law_key title summary details penalty_text penalty_severity ' +
          'legality legality_label statute_reference official_url sources verified ' +
          'last_reviewed_at key_points traveler_note numeric_value unit attributes reciprocity ' +
          'effective_from published_at updatedAt version')
        .sort({ state_code: 1, law_key: 1 })
        .lean();

      // Prefer the stored verdict; fall back to a derived one for legacy rows.
      const laws = rows.map((law) => ({
        ...law,
        legality: law.legality || classifyLegality(law.law_key, law.summary),
      }));

      return {
        status: RESPONSE_CODES.GET,
        success: true,
        message: CUSTOM_MESSAGES.DATA_LOADED_SUCCESS,
        data: laws,
      };
    } catch (error) {
      return {
        status: RESPONSE_CODES.SERVER_ERROR,
        success: false,
        message: error,
        data: [],
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
