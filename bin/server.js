/* eslint-disable no-useless-catch */
import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";
import path from "path";
import swaggerUi from "swagger-ui-express";
import DB from "../src/helpers/db";
import swaggerDocument from "../config/swagger.json";
import authMiddleWare from "../src/helpers/middlewares";
import UserRoutes from "../src/user/index.js";
// import AlbumRoutes from "../src/album/index.js";
import AuthRoutes from "../src/auth/index.js";
import StripeRoutes from "../src/stripe";
import DashboarRoutes from "../src/dashboard/index";
// import CategorySubcategoryRoutes from "../src/categorySubcategory/index.js";
import cron from "node-cron";
import { expiredAlbums } from "../src/services/common/cronjobs";

const morgan = require("morgan");
class Server {
  constructor() {
    this.app = null;
    this.db = null;
  }

  async initServer() {
    try {
      this.app = await express();
      this.app.use(bodyParser.json({ limit: "200mb" }));
      this.app.use(
        bodyParser.urlencoded({
          limit: "200mb",
          extended: true,
          parameterLimit: 1000000,
        })
      );
      this.app.use(cookieParser());
      this.app.set("view engine", "ejs");
      this.app.use(express.static(path.join(__dirname, "../", "public")));
      this.app.use(morgan("tiny"));

      this.app.use(
        cors({
          exposeHeaders: [
            "date",
            "content-type",
            "content-length",
            "connection",
            "server",
            "x-powered-by",
            "access-control-allow-origin",
            "authorization",
            "x-final-url",
          ],
          allowHeaders: ["content-type", "accept", "authorization"],
        })
      );
      this.app.use(helmet());
      this.app.use(authMiddleWare);

      this.db = new DB();
      await this.db.init();
      await this.healthCheckRoute();
      // await this.healthyDB();
      await this.configureRoutes(this.db);
      this.app.use("/api-docs", swaggerUi.serve);
      this.app.use("/user", UserRoutes);
      this.app.use("/auth", AuthRoutes);
      // this.app.use("/video", AlbumRoutes);
      this.app.use("/stripe", StripeRoutes);
      this.app.use("/dashboard", DashboarRoutes);
      // this.app.use("/categorySubcategory", CategorySubcategoryRoutes);
      this.app.get("/api-docs", swaggerUi.setup(swaggerDocument));
      /** All Cron Jobs Here */
      /** Cron job for expire the album and send notification */
      cron.schedule("0 0 * * *", async () => {
        await expiredAlbums();
      });
      return this.app;
    } catch (err) {
      throw err;
    }
  }

  async healthCheckRoute() {
    try {
      this.app.get("/", (req, res) => {
        res.json({
          status: "HEALTHY",
          msg: "This works perfectly fine",
        });
      });
    } catch (err) {
      throw err;
    }
  }

  async configureRoutes(db) {
    this.router = express.Router();
    this.app.use(this.router);
  }
}

export default Server;
