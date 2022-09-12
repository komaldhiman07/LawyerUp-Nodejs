import express from "express";
import StateController from "./state.controller.js";
import { handler } from "../../async.handler";

const router = express.Router();

const controller = new StateController();

class StatesRoutes {
  constructor(){
    console.log("test...")

  }
  static routes() {
    router.get(
      "/",
      handler(controller.getStatesList, (req) => [req])
      );
      return router;
  }
}
export default StatesRoutes.routes();