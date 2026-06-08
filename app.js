/* eslint-disable no-tabs */
// import cluster from "cluster";
import http from "http";
import os from "os";
import config from "config";
import Logger from "./src/helpers/logger";
import Server from "./bin/server";

class Application {
  constructor() {
    this.app = "";
    this.logger = "";
    this.address = "";
    this.bind = "";
    this.port = "";
    this.server = "";
    this.serverObj = "";
    this.numCPUs = "";
  }

  async initApp() {
    this.numCPUs = os.cpus().length;
    this.port = config.port;
    this.serverObj = new Server();
    this.app = await this.serverObj.initServer();
    this.logger = new Logger();
    await this.logger.init();
    this.app.set("port", this.port);
    await this.initAppServer();
  }

  async initAppServer() {
    this.server = await http.createServer(this.app);
    this.server.listen(this.port);
    this.address = this.server.address();
    this.bind =
      typeof this.address === "string"
        ? `pipe ${this.address}`
        : `port ${this.address.port}`;
    this.logger.logDebug(`Listening On: ${this.bind}`);
    this.logger.logInfo(`Server running on: ${this.port}`);
    console.log("Server port : ",this.port)
  }
}

// SEC-01 / SEC-05: Fail fast if critical environment variables are missing or weak
function validateEnv() {
  const errors = [];
  if (!process.env.MONGO_DB_URI) {
    errors.push('MONGO_DB_URI is not set');
  }
  if (!process.env.PRIVATE_JWT_SECRET) {
    errors.push('PRIVATE_JWT_SECRET is not set');
  } else if (process.env.PRIVATE_JWT_SECRET.length < 32) {
    errors.push('PRIVATE_JWT_SECRET must be at least 32 characters');
  }
  if (process.env.NODE_ENV === 'production') {
    if (process.env.MONGO_DB_URI && !process.env.MONGO_DB_URI.includes('@')) {
      errors.push(
        'MONGO_DB_URI has no credentials — MongoDB authentication is required in production. ' +
        'Run scripts/setup-mongodb-auth.sh and update MONGO_DB_URI.'
      );
    }
  }
  if (errors.length) {
    console.error('\n[STARTUP ERROR] Invalid environment configuration:');
    errors.forEach(e => console.error(`  ✗ ${e}`));
    console.error('\nSee .env.example for required values.\n');
    process.exit(1);
  }
}

const app = new Application();
(async () => {
  process.setMaxListeners(0);
  validateEnv();
  await app.initApp();
})();

// R-02: Graceful shutdown — close MongoDB connection cleanly on process termination
const shutdown = async (signal) => {
  console.log(`Received ${signal}, shutting down gracefully...`);
  try {
    const mongoose = await import("mongoose");
    await mongoose.default.connection.close();
    console.log("MongoDB connection closed.");
  } catch (err) {
    console.error("Error closing MongoDB connection:", err.message);
  }
  process.exit(0);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
