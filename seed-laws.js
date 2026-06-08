/**
 * Seed script — loads default LawMaster, StateLaw and city Laws data.
 *
 * Run from the lawyer_backend directory:
 *   ./node_modules/.bin/babel-node seed-laws.js
 *
 * Use --force to wipe and re-insert even if data already exists:
 *   ./node_modules/.bin/babel-node seed-laws.js --force
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import LawMaster from './database/models/LawMaster';
import StateLaw  from './database/models/StateLaw';
import Law       from './database/models/laws';
import { LawMasterSeed, StateLawSeed } from './database/Seed/stateLawsFromJson';
import { Laws }  from './database/Seed/laws';

const MONGO_URI = process.env.MONGO_DB_URI || 'mongodb://localhost:27017/lawyerup';
const FORCE     = process.argv.includes('--force');

async function seed(label, Model, data, countFilter = {}) {
  const existing = await Model.countDocuments(countFilter);
  if (existing && !FORCE) {
    console.log(`  skip  ${label} — ${existing} records already exist (use --force to reload)`);
    return;
  }
  if (FORCE) {
    await Model.deleteMany({});
    console.log(`  clear ${label}`);
  }
  const result = await Model.insertMany(data, { ordered: false });
  console.log(`  ✓     ${label} — inserted ${result.length} records`);
}

async function main() {
  console.log('Connecting to MongoDB:', MONGO_URI);
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected.\n');

  console.log('── Law Masters (' + LawMasterSeed.length + ' categories) ──');
  await seed('LawMaster', LawMaster, LawMasterSeed, { is_deleted: { $ne: true } });

  console.log('\n── State Laws (' + StateLawSeed.length + ' records, all 50 states × 5 categories) ──');
  await seed('StateLaw', StateLaw, StateLawSeed, { is_deleted: { $ne: true } });

  console.log('\n── City Laws (' + Laws.length + ' cities) ──');
  await seed('Laws (cities)', Law, Laws);

  console.log('\nDone.');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
