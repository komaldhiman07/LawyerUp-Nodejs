// @ts-nocheck
import express from 'express';
import { checkSchema } from 'express-validator';
import multer from 'multer';
import path from 'path';

import { authenticate } from '../../authenticate.handler.js';
import ContactUsController from './contactUs.controller.js';
import Validator from './contactUs.validation.js';
import { handler } from '../../async.handler';
import contactUsValidation from './contactUs.validation.js';
import UploadDocument from '../services/common/uploadDocToS3';

const upload = multer({
  dest: path.join(`${__dirname}/../services/uploadFiles`),
});

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
