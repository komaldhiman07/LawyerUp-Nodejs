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

    /* law list of a city */
    router.get(
      "/city-law-list",
      checkSchema(Validator.cityLawList()),
      handler(controller.cityLawList, (req) => [req])
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

    /* law list of the city which are not added as favourite */
    router.post(
      "/remaining-law-list",
      checkSchema(Validator.remainingLawList()),
      handler(controller.remainingLawList, (req) => [req])
    );
    /* end */

    /* like/dislike the law of a city */
    router.post(
      "/like-dislike-law",
      checkSchema(Validator.likeDislikeLawOfACity()),
      handler(controller.likeDislikeLawOfACity, (req) => [req])
    );
    /* end */

    return router;
  }
}

export default UserCategoryLawsRoutes.routes();
