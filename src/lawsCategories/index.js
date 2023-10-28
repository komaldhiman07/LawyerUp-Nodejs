import express from "express";
import { checkSchema } from "express-validator";
import {LawsCategoriesController} from "./lawsCategory.controller";
import Validator from "./lawsCategory.validation.js";
import { handler } from "../../async.handler.js";

const router = express.Router();

const controller = new LawsCategoriesController();

class UserCategoryLawsRoutes {
  static routes() {
    /* add category law */
    router.post(
      "/create",
      checkSchema(Validator.createCategory()),
      handler(controller.addCategory, (req) => [req])
    );
    /* end */

    /* list of categories */
    router.get(
      "/list",
      handler(controller.listCategories, (req) => [req])
    );
    /* end */

    /* law list of a city */
    router.post(
      "/city-law-list",
      checkSchema(Validator.cityLawList()),
      handler(controller.cityLawList, (req) => [req])
    );
    /* end */

    /* get category law by category law id */
    router.get(
      "/:category_id",
      handler(controller.getCategoryLaw, (req) => [req])
    );
    /* end */

    /* delete category law by category law id */
    router.delete(
      "/:category_id",
      handler(controller.deleteCategoryLaw, (req) => [req])
    );
    /* end */

    /* update category law by category law id */
    router.put(
      "/:category_id",
      checkSchema(Validator.updateCategoryLaw()),
      handler(controller.updateCategoryLaw, (req) => [req])
    );
    /* end */

    /* add law to the category law */
    router.post(
      "/add-law",
      checkSchema(Validator.addLawToCategoryLaw()),
      handler(controller.addLawToCategoryLaw, (req) => [req])
    );
    /* end */

    /* delete law from the category law */
    router.post(
      "/delete-law",
      checkSchema(Validator.addLawToCategoryLaw()),
      handler(controller.deleteLawFromCategoryLaw, (req) => [req])
    );
    /* end */

    /* law list of the city which are not added as favorite */
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
