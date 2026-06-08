import express from "express";
import { checkSchema } from "express-validator";

import AdminLawsController from "./adminLaws.controller.js";
import Validator from "./adminLaws.validation.js";
import { handler } from "../../async.handler";

const router = express.Router();
const controller = new AdminLawsController();

class AdminLawsRoutes {
  static routes() {
    router.get(
      "/dashboard/stats",
      handler(controller.getDashboardStats, (req) => [req])
    );

    router.get(
      "/master",
      handler(controller.listLawMaster, (req) => [req])
    );

    router.post(
      "/master",
      checkSchema(Validator.createLawMaster()),
      handler(controller.createLawMaster, (req) => [req])
    );

    router.put(
      "/master/:id",
      checkSchema(Validator.updateLawMaster()),
      handler(controller.updateLawMaster, (req) => [req])
    );

    router.get(
      "/state",
      handler(controller.listStateLaws, (req) => [req])
    );

    router.post(
      "/state",
      checkSchema(Validator.createStateLaw()),
      handler(controller.createStateLaw, (req) => [req])
    );

    router.put(
      "/state/:id",
      checkSchema(Validator.updateStateLaw()),
      handler(controller.updateStateLaw, (req) => [req])
    );

    router.post(
      "/state/:id/publish",
      handler(controller.publishStateLaw, (req) => [req])
    );

    router.post(
      "/state/:id/repeal",
      handler(controller.repealStateLaw, (req) => [req])
    );

    router.delete(
      "/state/:id",
      handler(controller.deleteStateLaw, (req) => [req])
    );

    router.get(
      "/users",
      handler(controller.listAdminUsers, (req) => [req])
    );

    router.get(
      "/users/:id",
      handler(controller.getAdminUserById, (req) => [req])
    );

    router.put(
      "/users/:id/status",
      handler(controller.toggleUserStatus, (req) => [req])
    );

    router.get(
      "/ingestion/jobs",
      handler(controller.listIngestionJobs, (req) => [req])
    );

    router.get(
      "/ingestion/jobs/:job_id/errors",
      handler(controller.listIngestionErrors, (req) => [req])
    );

    return router;
  }
}

export default AdminLawsRoutes.routes();
