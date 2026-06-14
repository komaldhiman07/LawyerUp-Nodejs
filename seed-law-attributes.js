/**
 * Seed script — declares each category's `attribute_schema` on its LawMaster
 * and backfills derived `attributes` onto existing StateLaw records (from their
 * summary verdicts) so the app's comparison grid has live structured data.
 *
 * Run from the lawyer_backend directory:
 *   ./node_modules/.bin/babel-node seed-law-attributes.js
 *
 * Idempotent. --force overwrites existing StateLaw.attributes values
 * (schemas are always (re)written — they're definitional).
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import LawMaster from './database/models/LawMaster';
import StateLaw from './database/models/StateLaw';

const MONGO_URI = process.env.MONGO_DB_URI || 'mongodb://localhost:27017/lawyerup';
const FORCE = process.argv.includes('--force');

// ── Attribute schemas (declared on the LawMaster) ─────────────────────────────
const SCHEMAS = {
  marijuana: [
    { key: 'recreational',  label: 'Recreational',  type: 'boolean' },
    { key: 'medical',       label: 'Medical',       type: 'boolean' },
    { key: 'decriminalized',label: 'Decriminalized',type: 'boolean' },
  ],
  guns: [
    { key: 'permit_required',      label: 'Permit Required',      type: 'boolean' },
    { key: 'constitutional_carry', label: 'Constitutional Carry', type: 'boolean' },
    { key: 'carry_regime',         label: 'Carry Regime',         type: 'enum',
      options: ['Permitless', 'Shall-Issue', 'May-Issue', 'Restricted', 'Heavily Restricted'] },
  ],
  gambling: [
    { key: 'casinos',        label: 'Casinos',        type: 'boolean' },
    { key: 'sports_betting', label: 'Sports Betting', type: 'boolean' },
    { key: 'lottery',        label: 'Lottery',        type: 'boolean' },
  ],
  death_penalty: [
    { key: 'status', label: 'Status', type: 'enum',
      options: ['Active', 'Abolished', 'Moratorium'] },
  ],
  minimum_wage: [
    { key: 'above_federal',        label: 'Above Federal Rate',   type: 'boolean' },
    { key: 'indexed_to_inflation', label: 'Indexed to Inflation', type: 'boolean' },
  ],
};

// ── Derive attribute values from a law's summary verdict ──────────────────────
function deriveAttributes(lawKey, summary) {
  const s = (summary || '').toLowerCase();
  switch (lawKey) {
    case 'marijuana':
      return {
        recreational: s.includes('recreational'),
        medical: s.includes('medical') || s.includes('recreational'),
        decriminalized: s.includes('decriminal'),
      };
    case 'guns': {
      const regimeMap = {
        'permitless carry': 'Permitless',
        'shall-issue': 'Shall-Issue',
        'may-issue': 'May-Issue',
        'heavily restricted': 'Heavily Restricted',
        'restricted': 'Restricted',
      };
      let regime = '';
      for (const [needle, label] of Object.entries(regimeMap)) {
        if (s.includes(needle)) { regime = label; break; }
      }
      const permitless = regime === 'Permitless';
      return {
        permit_required: !permitless,
        constitutional_carry: permitless,
        ...(regime ? { carry_regime: regime } : {}),
      };
    }
    case 'gambling':
      return {
        casinos: s.includes('fully legal') || s.includes('casino'),
        sports_betting: s.includes('fully legal') || s.includes('sports betting'),
        lottery: s.includes('fully legal') || s.includes('lottery'),
      };
    case 'death_penalty': {
      if (s.includes('abolish')) return { status: 'Abolished' };
      if (s.includes('moratorium')) return { status: 'Moratorium' };
      if (s.includes('active')) return { status: 'Active' };
      return {};
    }
    case 'minimum_wage':
      return { above_federal: s.includes('above') };
    default:
      return {};
  }
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('connected');

  // 1) Declare schemas on each LawMaster.
  for (const [lawKey, schema] of Object.entries(SCHEMAS)) {
    const res = await LawMaster.updateOne(
      { law_key: lawKey },
      { $set: { attribute_schema: schema } }
    );
    console.log(`  schema  ${lawKey.padEnd(14)} ${res.matchedCount ? 'set' : 'NO MASTER FOUND'}`);
  }

  // 2) Backfill derived attribute values on StateLaw records.
  const laws = await StateLaw.find({ is_deleted: false }).select('law_key summary attributes').lean();
  const ops = [];
  for (const law of laws) {
    const hasAttrs = law.attributes && Object.keys(law.attributes).length > 0;
    if (hasAttrs && !FORCE) continue;
    const derived = deriveAttributes(law.law_key, law.summary);
    if (Object.keys(derived).length === 0) continue;
    ops.push({ updateOne: { filter: { _id: law._id }, update: { $set: { attributes: derived } } } });
  }
  if (ops.length) {
    const res = await StateLaw.bulkWrite(ops, { ordered: false });
    console.log(`  values  updated ${res.modifiedCount} state laws`);
  } else {
    console.log('  values  nothing to update (use --force to overwrite)');
  }

  await mongoose.disconnect();
  console.log('done');
}

run().catch((e) => { console.error(e); process.exit(1); });
