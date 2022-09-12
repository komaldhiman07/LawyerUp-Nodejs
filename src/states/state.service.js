import State from "../../database/models/State";

class StateService {
  constructor() {}


  getStates = () =>
    State.find().sort({ created_at: -1 });

}

export default new StateService();
