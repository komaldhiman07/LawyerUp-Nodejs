/**
 * normalize-laws-with-claude.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Turns the messy scraped tables from scrape-laws-per-state.mjs into clean,
 * StateLaw-ready records using the Claude API (structured tool-use output):
 * a plain-English summary, a legality verdict, penalty text/severity,
 * key points and a traveler note — each kept conservative and citation-safe.
 *
 * Reads:   scraped/laws-per-state/<category>.json
 * Writes:  scraped/normalized/<category>.json   (richer schema)
 *          → then run import-scraped-laws.js --normalized to load as drafts.
 *
 * Run (plain node — native fetch + ESM, no deps):
 *   export ANTHROPIC_API_KEY=sk-ant-...
 *   node scraped/script/normalize-laws-with-claude.mjs cannabis
 *   node scraped/script/normalize-laws-with-claude.mjs --all
 *   node scraped/script/normalize-laws-with-claude.mjs cannabis --limit 3       # cheap test
 *   node scraped/script/normalize-laws-with-claude.mjs cannabis --model sonnet  # quality
 *
 * IMPORTANT: output is a DRAFT for human review. The prompt forbids inventing
 * statutes/penalties, but an LLM can still err — never publish unreviewed.
 */

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';

const API_KEY = process.env.ANTHROPIC_API_KEY;
// Anchor I/O to scraped/ (two levels up from scraped/script/).
const ROOT = path.resolve(import.meta.dirname, '..', '..');
const IN_DIR = path.join(ROOT, 'scraped', 'laws-per-state');
const OUT_DIR = path.join(ROOT, 'scraped', 'normalized');

const MODEL_ALIASES = {
  haiku: 'claude-haiku-4-5-20251001',
  sonnet: 'claude-sonnet-4-6',
  opus: 'claude-opus-4-8',
};

const args = process.argv.slice(2);
const getFlag = (name, def) => {
  const i = args.indexOf(name);
  return i !== -1 ? args[i + 1] : def;
};
const MODEL = MODEL_ALIASES[getFlag('--model', 'haiku')] || getFlag('--model', 'haiku');
const LIMIT = parseInt(getFlag('--limit', '0'), 10) || 0;
const CONCURRENCY = parseInt(getFlag('--concurrency', '4'), 10) || 4;
const ALL = args.includes('--all');
const onlyCategory = args.find((a, i) =>
  !a.startsWith('--') && args[i - 1] !== '--model' && args[i - 1] !== '--limit' && args[i - 1] !== '--concurrency');

const humanize = (key) => key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Claude structured-output tool ─────────────────────────────────────────────
const LAW_TOOL = {
  name: 'record_law',
  description: 'Record the normalized legal information for this state and topic.',
  input_schema: {
    type: 'object',
    properties: {
      legality: {
        type: 'string',
        enum: ['permitted', 'restricted', 'prohibited', 'info'],
        description: 'Practical verdict for an ordinary person. "info" for non-legality topics (e.g. minimum wage, age thresholds).',
      },
      legality_label: { type: 'string', description: 'Short label, e.g. "Legal", "Restricted", "Illegal", or a value like "$16.00/hr".' },
      summary: { type: 'string', description: 'Neutral plain-English summary, <240 chars, no legal advice.' },
      penalty_text: { type: 'string', description: 'Penalty in plain English IF supported by the data; otherwise empty.' },
      penalty_severity: { type: 'string', enum: ['none', 'low', 'medium', 'high'] },
      key_points: { type: 'array', items: { type: 'string' }, description: '2-5 scannable bullet facts.' },
      traveler_note: { type: 'string', description: 'One practical heads-up for an out-of-state visitor, or empty.' },
      confidence: { type: 'string', enum: ['high', 'medium', 'low'], description: 'How well the source data supports this.' },
    },
    required: ['legality', 'summary', 'key_points', 'penalty_severity', 'confidence'],
  },
};

const SYSTEM = [
  'You normalize messy scraped US state-law table data into clean records for a consumer app that summarizes laws by state.',
  'RULES:',
  '1. Base output ONLY on the provided scraped data plus widely-known, stable facts. Do NOT invent statute numbers, specific dollar penalties, or dates the data does not support — leave unknown fields empty.',
  '2. legality is the practical verdict: "permitted" (broadly legal), "restricted" (legal with limits/permits/conditions), "prohibited" (illegal), "info" (informational topics like minimum wage or age-of-consent thresholds that are not about legality).',
  '3. summary: neutral, plain English, under 240 characters, no legal advice, no hedging filler.',
  '4. key_points: 2–5 short factual bullets drawn from the data.',
  '5. traveler_note: one practical heads-up for someone visiting from another state, or empty string.',
  '6. Set confidence by how clearly the scraped data supports your answer.',
  'This is a DRAFT for human review — be accurate and conservative over comprehensive.',
].join('\n');

async function callClaude(topic, state, columns, attempt = 0) {
  const userPayload = { topic, state, scraped_columns: columns };
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM,
      tools: [LAW_TOOL],
      tool_choice: { type: 'tool', name: 'record_law' },
      messages: [{ role: 'user', content: `Normalize this into a record_law call:\n${JSON.stringify(userPayload, null, 2)}` }],
    }),
  });

  if (res.status === 429 || res.status === 529 || res.status >= 500) {
    if (attempt >= 5) throw new Error(`API ${res.status} after ${attempt} retries`);
    const wait = Math.min(2000 * 2 ** attempt, 30000);
    await sleep(wait);
    return callClaude(topic, state, columns, attempt + 1);
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = await res.json();
  const toolUse = (json.content || []).find((c) => c.type === 'tool_use' && c.name === 'record_law');
  if (!toolUse) throw new Error('No tool_use in response');
  return toolUse.input;
}

// Simple concurrency pool.
async function mapPool(items, worker, size) {
  const results = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, run));
  return results;
}

async function normalizeFile(file) {
  const raw = JSON.parse(await readFile(file, 'utf8'));
  const slug = (raw.category || path.basename(file, '.json')).toLowerCase();
  let rows = Array.isArray(raw.rows) ? raw.rows : [];
  if (!rows.length) { console.log(`  · ${slug}: no rows, skipped`); return null; }
  if (LIMIT) rows = rows.slice(0, LIMIT);

  const topic = humanize(slug);
  console.log(`\n→ ${slug}  (${rows.length} states · model ${MODEL})`);

  let done = 0;
  let failed = 0;
  const normRows = await mapPool(rows, async (row) => {
    try {
      const out = await callClaude(topic, row.state, row.columns);
      done++;
      process.stdout.write(`\r  normalized ${done}/${rows.length}   `);
      return { state: row.state, state_code: row.state_code, ...out };
    } catch (e) {
      failed++;
      return { state: row.state, state_code: row.state_code, error: e.message };
    }
  }, CONCURRENCY);

  process.stdout.write('\n');
  if (failed) console.log(`  [!] ${failed} state(s) failed`);

  await mkdir(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, `${slug}.json`);
  await writeFile(outPath, JSON.stringify({
    category: slug,
    title: raw.title,
    source: 'en.wikipedia.org (normalized via Claude)',
    source_url: raw.source_url,
    model: MODEL,
    normalized_at: new Date().toISOString(),
    state_count: normRows.filter((r) => !r.error).length,
    rows: normRows,
  }, null, 2));
  console.log(`  saved → ${outPath}`);
  return { slug, count: normRows.filter((r) => !r.error).length };
}

async function main() {
  if (!API_KEY) {
    console.error('[x] ANTHROPIC_API_KEY is not set.\n    export ANTHROPIC_API_KEY=sk-ant-...');
    process.exit(1);
  }
  let files;
  if (ALL) {
    files = (await readdir(IN_DIR)).filter((f) => f.endsWith('.json'));
  } else if (onlyCategory) {
    files = [`${onlyCategory.toLowerCase()}.json`];
  } else {
    console.log('Usage:\n  node normalize-laws-with-claude.mjs <category>|--all [--limit N] [--model haiku|sonnet|opus]');
    return;
  }

  const summary = [];
  for (const f of files) {
    try {
      const r = await normalizeFile(path.join(IN_DIR, f));
      if (r) summary.push(r);
    } catch (e) {
      console.error(`  [x] ${f}: ${e.message}`);
    }
  }
  console.log('\n' + '─'.repeat(60));
  summary.forEach((s) => console.log(`  ${s.slug.padEnd(20)} ${String(s.count).padStart(3)} normalized`));
  console.log('─'.repeat(60));
  console.log('\nNext: ./node_modules/.bin/babel-node import-scraped-laws.js --normalized\n');
}

main().catch((e) => { console.error('\n[x] Failed:', e.message); process.exit(1); });
