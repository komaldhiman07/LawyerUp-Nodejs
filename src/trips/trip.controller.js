import { matchedData } from "express-validator";
import tripService from "./trip.service";
import { RESPONSE_CODES } from "../../config/constants.js";
import { CUSTOM_MESSAGES } from "../../config/customMessages.js";
import { STATE_NAME_BY_CODE } from "../helpers/usStates";

class TripController {
  /* POST /trip/create */
  create = async (req) => {
    const data = matchedData(req);
    const { user } = req;
    try {
      const payload = {
        user_id: user.data._id,
        destination_state: (data.destination_state || "").toUpperCase().trim(),
        destination_city: data.destination_city || "",
        label: data.label || "",
        travel_date: new Date(data.travel_date),
        return_date: data.return_date ? new Date(data.return_date) : undefined,
        home_state: (data.home_state || user.data.state || "").toUpperCase().trim(),
        status: "upcoming",
        reminders_sent: [],
      };
      const trip = await tripService.create(payload);
      return {
        status: RESPONSE_CODES.POST,
        success: true,
        message: "Trip saved",
        data: trip,
      };
    } catch (error) {
      return { status: RESPONSE_CODES.SERVER_ERROR, success: false, message: error, data: {} };
    }
  };

  /* GET /trip/list — annotated with difference counts */
  list = async (req) => {
    const { user } = req;
    try {
      const trips = await tripService.listByUser(user.data._id);
      const annotated = await Promise.all(
        trips.map(async (t) => {
          const diff = await tripService.getStateDifferences(
            t.home_state,
            t.destination_state
          );
          return {
            ...t,
            destination_name:
              STATE_NAME_BY_CODE[t.destination_state] || t.destination_state,
            home_name: STATE_NAME_BY_CODE[t.home_state] || t.home_state,
            difference_count: diff.count,
            risk_count: diff.riskCount,
          };
        })
      );
      return {
        status: RESPONSE_CODES.GET,
        success: true,
        message: CUSTOM_MESSAGES.DATA_LOADED_SUCCESS,
        data: annotated,
      };
    } catch (error) {
      return { status: RESPONSE_CODES.SERVER_ERROR, success: false, message: error, data: [] };
    }
  };

  /* GET /trip/:id/differences — full law diff for the trip detail */
  differences = async (req) => {
    const { user, params } = req;
    try {
      const trip = await tripService.getById(params.id, user.data._id);
      if (!trip) {
        return { status: RESPONSE_CODES.BAD_REQUEST, success: false, message: "Trip not found", data: {} };
      }
      const diff = await tripService.getStateDifferences(
        trip.home_state,
        trip.destination_state
      );
      return {
        status: RESPONSE_CODES.GET,
        success: true,
        message: CUSTOM_MESSAGES.DATA_LOADED_SUCCESS,
        data: {
          trip: {
            ...trip,
            destination_name:
              STATE_NAME_BY_CODE[trip.destination_state] || trip.destination_state,
            home_name: STATE_NAME_BY_CODE[trip.home_state] || trip.home_state,
          },
          ...diff,
        },
      };
    } catch (error) {
      return { status: RESPONSE_CODES.SERVER_ERROR, success: false, message: error, data: {} };
    }
  };

  /* DELETE /trip/:id — cancel */
  remove = async (req) => {
    const { user, params } = req;
    try {
      const trip = await tripService.cancel(params.id, user.data._id);
      if (!trip) {
        return { status: RESPONSE_CODES.BAD_REQUEST, success: false, message: "Trip not found", data: {} };
      }
      return { status: RESPONSE_CODES.POST, success: true, message: "Trip removed", data: {} };
    } catch (error) {
      return { status: RESPONSE_CODES.SERVER_ERROR, success: false, message: error, data: {} };
    }
  };
}

export default new TripController();
