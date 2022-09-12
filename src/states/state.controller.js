import stateService from "./state.service.js";
import { RESPONSE_CODES } from "../../config/constants.js";
import { CUSTOM_MESSAGES } from "../../config/customMessages.js";

class StateController {
  constructor() { }

  getStatesList = async (req) => {
    const states = await stateService.getStates();
    return {
      status: RESPONSE_CODES.GET,
      success: true,
      data: states,
      message: CUSTOM_MESSAGES.STATES_FOUND,
    };
  };
}

export default StateController;
