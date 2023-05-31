import express from "express";
import { checkSchema } from "express-validator";
import multer from "multer";
import path from "path";

import { authenticate } from "../../authenticate.handler.js";
import UserCategoryLawsController from "./userCategoryLaws.controller.js";
import Validator from "./userCategoryLaws.validation.js";
import { handler } from "../../async.handler";

const router = express.Router();

const controller = new UserCategoryLawsController();

class UserCategoryLawsRoutes {
  static routes() {
    /* add category law */
    router.post(
      "/add",
      checkSchema(Validator.addCategoryLaw()),
      handler(controller.addCategoryLaw, (req) => [req])
    );
    /* end */

    /* list of the category laws of a user */
    router.get(
      "/list",
      handler(controller.categoryLawList, (req) => [req])
    );
    /* end */

    /* remaining laws */
    router.get(
      "/default-list",
      handler(controller.defaultList, (req) => [req])
    );
    /* end */

    /* get category law by category law id */
    router.get(
      "/:category_law_id",
      handler(controller.getCategoryLaw, (req) => [req])
    );
    /* end */

    /* delete category law by category law id */
    router.delete(
      "/:category_law_id",
      handler(controller.deleteCategoryLaw, (req) => [req])
    );
    /* end */

    /* update category law by category law id */
    router.put(
      "/:category_law_id",
      checkSchema(Validator.updateCategoryLaw()),
      handler(controller.updateCategoryLaw, (req) => [req])
    );
    /* end */

    /* add law to the category law */
    router.post(
      "/add-law",
      checkSchema(Validator.addLawtoCategoryLaw()),
      handler(controller.addLawtoCategoryLaw, (req) => [req])
    );
    /* end */

    /* delete law from the category law */
    router.post(
      "/delete-law",
      checkSchema(Validator.addLawtoCategoryLaw()),
      handler(controller.deleteLawFromCategoryLaw, (req) => [req])
    );
    /* end */

    return router;
  }
}

export default UserCategoryLawsRoutes.routes();
