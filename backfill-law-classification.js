/**
 * Backfill script — populates the Tier-1 derived fields on existing StateLaw
 * records: `legality` (from summary) and `penalty_severity` (from penalty_text).
 *
 * Run from the lawyer_backend directory:
 *   ./node_modules/.bin/babel-node backfill-law-classification.js
 *
 * Idempotent: safe to run repeatedly. Use --force to overwrite values that
 * were already set (otherwise only empty/default values are filled).
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import StateLaw from './database/models/StateLaw';
import { classifyLegality, penaltySeverity } from './src/helpers/lawClassifier';

const MONGO_URI = process.env.MONGO_DB_URI || 'mongodb://localhost:27017/lawyerup';
const FORCE = process.argv.includes('--force');

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('connected');

  const laws = await StateLaw.find({ is_deleted: false }).lean();
  console.log(`  scanning ${laws.length} state laws`);

  const ops = [];
  for (const law of laws) {
    const set = {};
    const derivedLegality = classifyLegality(law.law_key, law.summary);
    const derivedSeverity = penaltySeverity(law.penalty_text);

    if (FORCE || !law.legality || law.legality === 'info') {
      if (derivedLegality !== 'info' || !law.legality) set.legality = derivedLegality;
    }
    if (FORCE || !law.penalty_severity || law.penalty_severity === 'none') {
      if (derivedSeverity !== 'none' || !law.penalty_severity) {
        set.penalty_severity = derivedSeverity;
      }
    }
    if (Object.keys(set).length) {
      ops.push({ updateOne: { filter: { _id: law._id }, update: { $set: set } } });
    }
  }

  if (ops.length) {
    const res = await StateLaw.bulkWrite(ops, { ordered: false });
    console.log(`  updated ${res.modifiedCount} records`);
  } else {
    console.log('  nothing to update');
  }

  await mongoose.disconnect();
  console.log('done');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
