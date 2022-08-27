import express from "express";
import { checkSchema } from "express-validator";
import validator from "./stripe.validation";

import StripeController from "./stripe.controller";
import { handler } from "../../async.handler";

const router = express.Router();

const controller = new StripeController();

class StripeRoutes {
  static routes() {
    router.get(
      "/link-account",
      handler(controller.linkStripeAccount, (req) => [req])
    );

    router.get(
      "/retrive-account/:id?",
      handler(controller.retriveAccount, (req) => [req])
    );

    router.post(
      "/create-charge",
      checkSchema(validator.createStripeCharge()),
      handler(controller.createCharge, (req) => [req])
    );

    router.post(
      "/create-transfer",
      handler(controller.createTransfer, (req) => [req])
    );

    router.post(
      "/create-card",
      handler(controller.createCard, (req) => [req])
    );

    router.get(
      "/card-list",
      handler(controller.cardList, (req) => [req])
    );

    router.delete(
      "/delete-card",
      handler(controller.deleteCard, (req) => [req])
    );

    router.post(
      "/transaction-list",
      handler(controller.transactionList, (req) => [req])
    );

    router.put(
      "/update-expert-stripe-status",
      handler(controller.updateExpertStripeStatus, (req) => [req])
    );
    return router;
  }
}

export default StripeRoutes.routes();
