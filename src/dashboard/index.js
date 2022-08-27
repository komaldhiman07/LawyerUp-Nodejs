import express from "express";

import DashboardController from "./dashboard.controller";
import { handler } from "../../async.handler";

const router = express.Router();

const controller = new DashboardController();

class DashboardRoutes {
    static routes() {
        router.post(
            "/count/all",
            handler(controller.getDashboardCountAll, (req) => [req])
        );
        return router;
    }
}

export default DashboardRoutes.routes();
