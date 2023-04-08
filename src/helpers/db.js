import mongoose from "mongoose";
import Role from "../../database/models/Role";
import Country from "../../database/models/Country";
import State from "../../database/models/State";
import Language from "../../database/models/Language";
import Law from "../../database/models/laws";
import Status from "../../database/models/Status";
import { Roles } from "../../database/Seed/roles";
import { States } from "../../database/Seed/states";
import { Countries } from "../../database/Seed/countrys";
import { Languages } from "../../database/Seed/language";
import { Laws } from "../../database/Seed/laws";
// import { Statuses } from "../../database/Seed/status";

export default class DB {
  constructor() {
    this.db = {};
  }

  async init() {
    await this.connectMongoClient();
    await this.getDB();
  }

  async connectMongoClient() {
    // eslint-disable-next-line no-useless-catch
    try {
      console.log("Mongo URI : ", process.env.MONGO_DB_URI)
      mongoose.connect(process.env.MONGO_DB_URI, {
        useUnifiedTopology: true,
      });
      console.log("Connected to MongoDB");
      // await this.setupModels();
      await this.runSeed();
    } catch (err) {
      console.error("Unable to connect to the Client database:", err);
      throw err;
    }
  }

  // async setupModels() {
  //   this.db.categorySubcategory = require("../../database/models/CategorySubcategory");
  // }

  async getDB() {
    return this.db;
  }

  async runSeed() {
    await Role.deleteMany({});
    await Role.insertMany(Roles);
    await Country.deleteMany({});
    await Country.insertMany(Countries);
    await State.deleteMany({});
    await State.insertMany(States);
    await Language.deleteMany({});
    await Language.insertMany(Languages);
    await Law.insertMany(Laws)
    // await Status.deleteMany({});
    // await Status.insertMany(Statuses);
  }
}
