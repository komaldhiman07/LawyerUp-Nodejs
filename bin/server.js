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
import AuthRoutes from "../src/auth/index.js";
import StateRoutes from "../src/states/index";
import SettingsRoutes from "../src/settings/index";
import ContactUsRoutes from "../src/contactUs/index";
import LawsRoutes from "../src/raiseLaw/index";
import UserCategoryLawsRoutes from "../src/lawsCategories";

const morgan = require("morgan");
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

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
      console.log("bucket : ", process.env.AWS_BUCKET)
      await this.createBucket(process.env.AWS_BUCKET);
      await this.configureRoutes(this.db);
      this.app.use("/api-docs", swaggerUi.serve);
      this.app.use("/states", StateRoutes);
      this.app.use("/user", UserRoutes);
      this.app.use("/auth", AuthRoutes);
      this.app.use("/settings", SettingsRoutes);
      this.app.use("/contact-us", ContactUsRoutes);
      this.app.use("/laws", LawsRoutes);
      this.app.use("/category", UserCategoryLawsRoutes);
      this.app.get("/api-docs", swaggerUi.setup(swaggerDocument));
      /** All Cron Jobs Here */
      /** Cron job for expire the album and send notification */
      // cron.schedule("0 0 * * *", async () => {
      // });
      return this.app;
    } catch (err) {
      console.log("e : ", err)
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

  async createBucket(bucketName) {
    try {
      const params = {
        Bucket: bucketName
      };
      let bucket = await this.checkBucketExists(params)
      if (!bucket) {
        console.log("creating bucket...")
        s3.createBucket(params, function (err, data) {
          if (err) {
            console.log("error creating bucket : " + err.message);
          } // an error occurred
          else { console.log("bucket created :" + data.Location); }
        });
      } else {
        console.log("Bucket already exist...")
      }

    } catch (err) {
      throw err;
    }
  }
  async checkBucketExists(options) {
    try {
      // await s3.headBucket(options).promise();
      return new Promise((resolve, reject) => {
        s3.headBucket(options).promise().then(res => {
          resolve(true);
        }).catch(e => {
          resolve(false);
        })
      })

    } catch (error) {
      if (error.statusCode === 404) {
        return false;
      }
      throw error;
    }
  };


  async configureRoutes(db) {
    this.router = express.Router();
    this.app.use(this.router);
  }
}

export default Server;
