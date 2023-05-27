import express from "express";
import { checkSchema } from "express-validator";
import multer from "multer";
import path from "path";

import { authenticate } from "../../authenticate.handler.js";
import UserFavouriteLawsController from "./userFavouriteLaws.controller.js";
import Validator from "./userFavouriteLaws.validation.js";
import { handler } from "../../async.handler";
import UploadDocument from "../services/common/uploadDocToS3";
import userFavouriteLawsValidation from "./userFavouriteLaws.validation.js";

const router = express.Router();

const controller = new UserFavouriteLawsController();

class UserFavouriteLawsRoutes {
  static routes() {
    /* add favourite law */
    router.post(
      "/add",
      checkSchema(Validator.addFavouriteLaw()),
      handler(controller.addFavouriteLaw, (req) => [req])
    );
    /* end */

    return router;
  }
}

export default UserFavouriteLawsRoutes.routes();
