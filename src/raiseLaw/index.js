// @ts-nocheck
import express from 'express';
import { checkSchema } from 'express-validator';

import LawsController from './raisedLaw.controller.js';
import Validator from './raisedLaw.validation.js';
import { handler } from '../../async.handler.js';

const router = express.Router();

const controller = new LawsController();

class LawsRoutes {
  static routes() {
    /* raise laws */
    router.post(
      '/raise',
      checkSchema(Validator.raiseLaw()),
      handler(controller.raiseLaw, (req) => [req]),
    );

    /* get raised law by id */
    router.get(
      '/',
      handler(controller.getRaisedLaw, (req) => [req]),
    );

    /* update raised law */
    router.put(
      '/',
      checkSchema(Validator.raiseLaw()),
      handler(controller.updateRaisedLaw, (req) => [req]),
    );

    /* delete raised law by id */
    router.delete(
      '/',
      handler(controller.deleteRaisedLaw, (req) => [req]),
    );

    /* list raised law */
    router.get(
      '/list',
      handler(controller.getRaisedLawList, (req) => [req]),
    );

    router.post(
      '/report',
      checkSchema(Validator.report()),
      handler(controller.generateLawReport, (req) => [req])
    )


    return router;
  }
}

export default LawsRoutes.routes();
