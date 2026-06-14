/* eslint-disable no-useless-catch */
import mongoose from "mongoose";
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
import AdminLawsRoutes from "../src/adminLaws";
import NotificationRoutes from "../src/notification/index.js";
import TripRoutes from "../src/trips/index.js";
import FaqRoutes from "../src/faq/index.js";
import { startTripReminderJob } from "../src/jobs/tripReminders.js";
import { startLawIngestionJob } from "../src/jobs/lawIngestion.js";

const morgan = require("morgan");
import AWS from 'aws-sdk';

// ── API request / response logger ──────────────────────────────────────────
const SENSITIVE_KEYS = new Set(['password', 'token', 'access_token', 'refresh_token', 'otp']);

function maskBody(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, SENSITIVE_KEYS.has(k) ? '***' : v])
  );
}

function truncate(str, max = 800) {
  return str.length > max ? str.slice(0, max) + ' … (truncated)' : str;
}

const apiLogger = (req, res, next) => {
  const start = Date.now();
  const { method, url, body } = req;

  const safeBody = maskBody(body);
  const hasBody = safeBody && Object.keys(safeBody).length > 0;

  process.stdout.write(
    `\n➡  ${method} ${url}` +
    (hasBody ? `\n   Body: ${truncate(JSON.stringify(safeBody, null, 2))}` : '') +
    '\n'
  );

  // Intercept res.json to capture response body
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    const ms = Date.now() - start;
    const icon = res.statusCode < 400 ? '🟢' : '🔴';
    const preview = truncate(JSON.stringify(data, null, 2));
    process.stdout.write(
      `⬅  ${icon} ${res.statusCode} ${method} ${url} [${ms}ms]\n` +
      `   Body: ${preview}\n`
    );
    return originalJson(data);
  };

  next();
};
// ───────────────────────────────────────────────────────────────────────────

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
      this.app.use(apiLogger);

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
      this.app.use("/admin/laws", AdminLawsRoutes);
      this.app.use("/notification", NotificationRoutes);
      this.app.use("/trip", TripRoutes);
      this.app.use("/faq", FaqRoutes);
      this.app.get("/api-docs", swaggerUi.setup(swaggerDocument));
      /** All Cron Jobs Here */
      // Daily trip-reminder job (5/3/1/0 days before travel).
      startTripReminderJob();
      // Daily law-ingestion job (gated by LAW_INGEST_ENABLED) — scrapes/researches
      // law changes into draft StateLaws for admin review.
      startLawIngestionJob();
      return this.app;
    } catch (err) {
      console.log("e : ", err)
      throw err;
    }
  }

  async healthCheckRoute() {
    try {
      this.app.get("/", async (_req, res) => {
        // M-02: Real MongoDB ping — returns 503 if DB is unreachable
        const dbState = mongoose.connection.readyState;
        if (dbState !== 1) {
          return res.status(503).json({
            status: "UNHEALTHY",
            db: "disconnected",
            uptime: process.uptime(),
          });
        }
        try {
          await mongoose.connection.db.admin().ping();
          res.json({
            status: "HEALTHY",
            db: "connected",
            uptime: process.uptime(),
          });
        } catch (_err) {
          res.status(503).json({
            status: "UNHEALTHY",
            db: "ping_failed",
            uptime: process.uptime(),
          });
        }
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
