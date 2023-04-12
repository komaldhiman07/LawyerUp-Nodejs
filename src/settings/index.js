import express from "express";
import { checkSchema } from "express-validator";
import multer from "multer";
import path from "path";

import { authenticate } from "../../authenticate.handler.js";
import SettingsController from "./settings.controller.js";
import Validator from "./settings.validation.js";
import { handler } from "../../async.handler";
import settingsValidation from "./settings.validation.js";

const upload = multer({
  dest: path.join(`${__dirname}/../services/uploadFiles`),
});

const router = express.Router();

const controller = new SettingsController();

class SettingsRoutes {
  static routes() {
    /* get user settings */
    router.get(
      "/",
      handler(controller.getSettings, (req) => [req])
    );
    /* update user settings */
    router.put(
        "/notification",
      checkSchema(Validator.updateSettings()),
        handler(controller.updateSettings, (req) => [req])
      );
    /* change user password */
    router.put(
      "/change-password",
    checkSchema(Validator.changePassword()),
      handler(controller.changePassword, (req) => [req])
    );


    return router;
  }
}

export default SettingsRoutes.routes();
