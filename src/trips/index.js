import express from "express";
import { checkSchema } from "express-validator";
import tripController from "./trip.controller";
import Validator from "./trip.validation";
import { handler } from "../../async.handler.js";

const router = express.Router();

class TripRoutes {
  static routes() {
    router.post(
      "/create",
      checkSchema(Validator.create()),
      handler(tripController.create, (req) => [req])
    );

    router.get(
      "/list",
      handler(tripController.list, (req) => [req])
    );

    router.get(
      "/:id/differences",
      handler(tripController.differences, (req) => [req])
    );

    router.delete(
      "/:id",
      handler(tripController.remove, (req) => [req])
    );

    return router;
  }
}

export default TripRoutes.routes();
