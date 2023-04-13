// @ts-nocheck
import express from 'express';
import { checkSchema } from 'express-validator';

import ContactUsController from './contactUs.controller.js';
import Validator from './contactUs.validation.js';
import { handler } from '../../async.handler';


const router = express.Router();

const controller = new ContactUsController();

class ContactUsRoutes {
  static routes() {
    /* contact us */
    router.post(
      '/',
      checkSchema(Validator.contactUs()),
      handler(controller.contactUs, (req) => [req]),
    );
    /* end */

    return router;
  }
}

export default ContactUsRoutes.routes();
