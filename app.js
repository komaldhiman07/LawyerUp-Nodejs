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

const app = new Application();
(async () => {
  process.setMaxListeners(0);
  await app.initApp();
})();
