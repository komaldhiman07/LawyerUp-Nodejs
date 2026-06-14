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
    );

    /* aggregate category stats — GET /laws/state-laws/stats (declare before /state-laws) */
    router.get(
      '/state-laws/stats',
      handler(controller.getStateLawStats, (req) => [req])
    );

    /* law change detail — GET /laws/state-laws/change-detail?state_code=CA&law_key=marijuana */
    router.get(
      '/state-laws/change-detail',
      handler(controller.getStateLawChangeDetail, (req) => [req])
    );

    /* list active state laws for app users — GET /laws/state-laws?state_code=CA&law_key=marijuana */
    router.get(
      '/state-laws',
      handler(controller.getStateLaws, (req) => [req])
    );

    return router;
  }
}

export default LawsRoutes.routes();
