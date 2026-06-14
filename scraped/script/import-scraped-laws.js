/**
 * import-scraped-laws.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Maps the JSON produced by scrape-laws-per-state.mjs into DRAFT StateLaw
 * records, so scraped research flows through your existing admin
 * review → publish pipeline (nothing goes live until an admin publishes it).
 *
 * Reads:   scraped/laws-per-state/<category>.json
 * Writes:  StateLaw documents with status = "draft", change_source = "migration"
 *
 * Run from the lawyer_backend root (babel-node — it imports the Mongoose models):
 *   ./node_modules/.bin/babel-node scraped/script/import-scraped-laws.js            # all files
 *   ./node_modules/.bin/babel-node scraped/script/import-scraped-laws.js cannabis   # one category
 *   ./node_modules/.bin/babel-node scraped/script/import-scraped-laws.js --force    # version-bump
 *   ./node_modules/.bin/babel-node scraped/script/import-scraped-laws.js --normalized
 *   ./node_modules/.bin/babel-node scraped/script/import-scraped-laws.js --admin <userId>
 *
 * Idempotent by default: a (state_code, law_key) that already exists is SKIPPED.
 * With --force it instead creates a new version (version = latest + 1).
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import StateLaw from '../../database/models/StateLaw';
import { classifyLegality, penaltySeverity } from '../../src/helpers/lawClassifier';

const MONGO_URI = process.env.MONGO_DB_URI || 'mongodb://localhost:27017/lawyerup';
// Anchor input to scraped/ (two levels up from scraped/script/) so the script
// works regardless of the current working directory.
const ROOT = path.resolve(__dirname, '..', '..');

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
// --normalized → consume Claude-normalized files (richer schema) instead of raw.
const NORMALIZED = args.includes('--normalized');
const IN_DIR = path.join(ROOT, 'scraped', NORMALIZED ? 'normalized' : 'laws-per-state');
const adminIdx = args.indexOf('--admin');
const ADMIN_ID = adminIdx !== -1 ? args[adminIdx + 1] : null;
const onlyCategory = args.find((a) => !a.startsWith('--') && a !== ADMIN_ID) || null;

// Scraped category slug → your app's canonical law_key.
const CATEGORY_TO_LAWKEY = {
  cannabis: 'marijuana',
  capital_punishment: 'death_penalty',
  death_penalty: 'death_penalty',
  minimum_wage: 'minimum_wage',
  age_of_consent: 'age_of_consent',
  abortion: 'abortion',
  alcohol: 'alcohol',
  gambling: 'gambling',
  gun: 'guns',
  guns: 'guns',
};

const humanize = (key) =>
  key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// Build summary / details / key_points from a scraped row's columns.
function composeContent(columns) {
  const entries = Object.entries(columns || {}).filter(([, v]) => v && String(v).trim());
  // Short labelled bullets become key_points (skip very long prose like "Notes").
  const keyPoints = entries
    .filter(([, v]) => String(v).length <= 160)
    .map(([k, v]) => `${k}: ${v}`);
  const noteEntry = entries.find(([k]) => /note/i.test(k));
  const traveler = noteEntry ? String(noteEntry[1]).slice(0, 400) : '';

  // summary = the labelled bullets, capped; fall back to the notes prose.
  let summary = keyPoints.join('; ');
  if (!summary) summary = entries.map(([, v]) => v).join(' ').slice(0, 280);
  if (summary.length > 300) summary = summary.slice(0, 297) + '…';

  const details = entries.map(([k, v]) => `${k}: ${v}`).join('\n');
  return { summary: summary || 'See details.', details: details || 'No details parsed.', keyPoints, traveler };
}

async function importFile(file) {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const slug = (raw.category || path.basename(file, '.json')).toLowerCase();
  const law_key = (CATEGORY_TO_LAWKEY[slug] || slug).toLowerCase();
  const rows = Array.isArray(raw.rows) ? raw.rows : [];

  if (!rows.length) {
    console.log(`  · ${slug}: no rows (skipped)`);
    return { created: 0, skipped: 0, file: path.basename(file) };
  }

  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    if (row.error) { skipped++; continue; }  // normalizer failed on this state
    const state_code = String(row.state_code || '').trim().toUpperCase();
    if (!state_code) { skipped++; continue; }

    const latest = await StateLaw
      .findOne({ state_code, law_key })
      .sort({ version: -1 })
      .select('version')
      .lean();
    if (latest && !FORCE) { skipped++; continue; }

    let payload;
    if (NORMALIZED) {
      // Rich, Claude-cleaned fields — use them directly.
      const keyPoints = Array.isArray(row.key_points) ? row.key_points : [];
      const summary = row.summary || 'See details.';
      const details = [keyPoints.join('\n'), row.penalty_text]
        .filter(Boolean).join('\n').trim() || summary;
      payload = {
        state_code,
        law_key,
        title: `${row.state} — ${humanize(law_key)}`,
        summary,
        details,
        key_points: keyPoints,
        traveler_note: row.traveler_note || '',
        legality: row.legality || classifyLegality(law_key, summary),
        legality_label: row.legality_label || '',
        penalty_text: row.penalty_text || '',
        penalty_severity: row.penalty_severity || penaltySeverity(row.penalty_text || ''),
      };
    } else {
      // Raw scraped table — derive content + classify.
      const { summary, details, keyPoints, traveler } = composeContent(row.columns);
      payload = {
        state_code,
        law_key,
        title: `${row.state} — ${humanize(law_key)}`,
        summary,
        details,
        key_points: keyPoints,
        traveler_note: traveler,
        legality: classifyLegality(law_key, summary),
        penalty_severity: penaltySeverity(''),
      };
    }
    payload.official_url = raw.source_url || '';
    payload.sources = raw.source_url ? [{ label: 'Wikipedia', url: raw.source_url }] : [];
    payload.status = 'draft';
    payload.version = latest ? latest.version + 1 : 1;
    payload.change_source = 'migration';
    payload.verified = false;
    payload.last_reviewed_at = null;
    if (ADMIN_ID) { payload.created_by = ADMIN_ID; payload.updated_by = ADMIN_ID; }

    try {
      await StateLaw.create(payload);
      created++;
    } catch (e) {
      console.log(`    [x] ${state_code}/${law_key}: ${e.message}`);
      skipped++;
    }
  }

  console.log(`  ✓ ${slug.padEnd(20)} law_key=${law_key.padEnd(14)} created ${String(created).padStart(3)}  skipped ${String(skipped).padStart(3)}`);
  return { created, skipped, file: path.basename(file) };
}

async function run() {
  if (!fs.existsSync(IN_DIR)) {
    throw new Error(`No scraped data at ${IN_DIR}. Run scrape-laws-per-state.mjs first.`);
  }
  let files = fs.readdirSync(IN_DIR).filter((f) => f.endsWith('.json'));
  if (onlyCategory) {
    files = files.filter((f) => path.basename(f, '.json') === onlyCategory.toLowerCase());
    if (!files.length) throw new Error(`No scraped file for "${onlyCategory}" in ${IN_DIR}`);
  }

  await mongoose.connect(MONGO_URI);
  console.log(`\nImporting ${files.length} file(s) as DRAFT StateLaw records${FORCE ? ' (--force: version-bump existing)' : ''}…\n`);

  let totalCreated = 0;
  let totalSkipped = 0;
  for (const f of files) {
    const r = await importFile(path.join(IN_DIR, f));
    totalCreated += r.created;
    totalSkipped += r.skipped;
  }

  console.log('\n' + '─'.repeat(60));
  console.log(`  Drafts created: ${totalCreated}    Skipped (existing/empty): ${totalSkipped}`);
  console.log('─'.repeat(60));
  console.log('\nReview & publish them in the admin portal → State Laws (filter status = draft).\n');

  await mongoose.disconnect();
}

run().catch((e) => { console.error('\n[x] Failed:', e.message); process.exit(1); });
