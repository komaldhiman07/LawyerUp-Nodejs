import mongoose from "mongoose";
import Role from "../../database/models/Role";
import Country from "../../database/models/Country";
import State from "../../database/models/State";
import Language from "../../database/models/Language";
import Law from "../../database/models/laws";
import LawMaster from "../../database/models/LawMaster";
import StateLaw from "../../database/models/StateLaw";
import { Roles } from "../../database/Seed/roles";
import { States } from "../../database/Seed/states";
import { Countries } from "../../database/Seed/countrys";
import { Languages } from "../../database/Seed/language";
import { Laws } from "../../database/Seed/laws";
import { LawMasterSeed, StateLawSeed } from "../../database/Seed/stateLawsFromJson";
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
        maxPoolSize:              50,
        minPoolSize:              5,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS:          45000,
        connectTimeoutMS:         10000,
        heartbeatFrequencyMS:     10000,
        // SC-02: Guarantee majority write acknowledgment at the connection level.
        // w:'majority' is safe on standalone (treated as w:1) and correct on replica set.
        // j:true ensures journal flush before acknowledging writes — prevents data loss on crash.
        writeConcern:             { w: 'majority', j: true },
        // SC-02: readConcern 'majority' prevents dirty reads after a primary failover.
        // NOTE: requires SC-01 (replica set) to be meaningful; harmless on standalone.
        readConcern:              { level: 'majority' },
      });
      console.log("Connected to MongoDB");
      // R-03: Run seed after connection is established but don't block startup.
      // Seed only inserts if collections are empty — safe to run on every boot
      // but kept non-blocking so a slow seed doesn't delay request handling.
      this.runSeed().catch(err =>
        console.error("Seed error (non-fatal):", err.message)
      );
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
    const roleList = await Role.find();
    if(!roleList.length){
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

    const lawMasterCount = await LawMaster.countDocuments({ is_deleted: false });
    if (!lawMasterCount) {
      await LawMaster.insertMany(LawMasterSeed);
    }

    const stateLawCount = await StateLaw.countDocuments({ is_deleted: false });
    if (!stateLawCount) {
      await StateLaw.insertMany(StateLawSeed);
    }
  }
}
