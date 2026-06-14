/**
 * scrape-law-categories.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Discovers how many law *categories* vary by US state, scraping the MediaWiki
 * (Wikipedia) API from two complementary signals and merging them:
 *
 *   1. Title search — pages/categories titled "<Topic> … by state".
 *   2. Category tree — members of curated seed categories such as
 *      "Category:United States law by issue and state".
 *
 * Each hit is normalised to a topic (e.g. "Cannabis law in the United States by
 * state" → "Cannabis"), de-duplicated, and flagged as legal-looking.
 *
 * NOTE: there is no single authoritative count of "US law categories" — this is
 * an empirical lower-bound of topics Wikipedia explicitly maintains per state.
 *
 * Output:  scraped/law-categories.json   (+ a printed count)
 *
 * Run (plain node — NOT babel-node; uses native fetch + ESM):
 *     node scraped/script/scrape-law-categories.mjs
 *     node scraped/script/scrape-law-categories.mjs --all   # include non-legal topics
 *
 * No DB writes. No external dependencies.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const API = 'https://en.wikipedia.org/w/api.php';
const UA = 'LawyerUp-category-scraper/1.0 (https://lawyerup.app; admin@lawyerup.app)';
// Anchor output to scraped/ (two levels up from scraped/script/) so the script
// works regardless of the current working directory.
const ROOT = path.resolve(import.meta.dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'scraped');
const INCLUDE_ALL = process.argv.includes('--all');

// Title-search patterns (intitle keeps matches on the page title).
const TITLE_PATTERNS = [
  'intitle:"in the United States by state"',
  'intitle:"laws in the United States by state"',
  'intitle:"laws by state"',
  'intitle:"by U.S. state"',
  'intitle:"by US state"',
];

// Seed categories whose members are per-state legal topics. Keep this tight —
// broad parents ("State law in the United States") inject per-state articles
// ("Law of Florida"), lists and templates that aren't categories.
const SEED_CATEGORIES = [
  'United States law by issue and state',
];

// 50 states + DC — used to drop bare state names / "Law of <state>" pages.
const US_STATES = new Set([
  'alabama','alaska','arizona','arkansas','california','colorado','connecticut',
  'delaware','florida','georgia','hawaii','idaho','illinois','indiana','iowa',
  'kansas','kentucky','louisiana','maine','maryland','massachusetts','michigan',
  'minnesota','mississippi','missouri','montana','nebraska','nevada',
  'new hampshire','new jersey','new mexico','new york','north carolina',
  'north dakota','ohio','oklahoma','oregon','pennsylvania','rhode island',
  'south carolina','south dakota','tennessee','texas','utah','vermont',
  'virginia','washington','west virginia','wisconsin','wyoming',
  'district of columbia',
]);

// Suffixes/substrings stripped while deriving the topic name.
const STRIP_SUFFIXES = [
  ' by state or territory',
  ' by U.S. jurisdiction',
  ' by US jurisdiction',
  ' by jurisdiction',
  ' by U.S. state',
  ' by US state',
  ' by state',
];

// Substrings that mark structural/noise titles, not real law categories.
const DENY = [
  'administrative law', 'case law', 'legislation', 'ballot', 'constitution',
  'court system', 'legal history', 'related lists', 'clemency', 'pardon',
  'penal system', 'in state law', 'list of', 'template', ' school', 'election',
  ' event', ' culture', ' history', 'organization', 'commissioner',
  'shot dead', 'suicide', 'jim crow', 'personality rights', 'enforcement',
  'hotel', 'death', 'tax revenue', 'movement', 'dispute', 'relations',
  'hinduism', 'religion', 'islam', 'christianity', 'never opened', 'violence',
];

// Heuristic: does a topic read like a legal domain?
const LEGAL_HINTS = [
  'law', 'legal', 'cannabis', 'marijuana', 'gun', 'firearm', 'weapon', 'carry',
  'abortion', 'alcohol', 'liquor', 'gambling', 'lottery', 'betting', 'casino',
  'capital punishment', 'death penalty', 'marriage', 'divorce', 'consent',
  'minimum wage', 'wage', 'labor', 'tax', 'smoking', 'tobacco', 'vaping',
  'speed limit', 'seat belt', 'helmet', 'driving', 'dui', 'cannabis',
  'fireworks', 'knife', 'self-defense', 'stand-your-ground', 'euthanasia',
  'prostitution', 'drug', 'hemp', 'cbd', 'voter', 'felony', 'expungement',
  'rent', 'eviction', 'inheritance', 'estate', 'rights', 'bank regulation',
  'lgbt', 'lgbtq',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function apiGet(params) {
  const qs = new URLSearchParams({ format: 'json', formatversion: '2', ...params });
  const res = await fetch(`${API}?${qs}`, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Wikipedia API ${res.status} ${res.statusText}`);
  const json = await res.json();
  if (json.error) throw new Error(`Wikipedia API: ${json.error.info}`);
  return json;
}

/** Normalise a page/category title into a clean topic name (or null to drop). */
function deriveTopic(rawTitle) {
  if (/^(Template|Portal|Wikipedia|Help):/i.test(rawTitle)) return null;
  let t = rawTitle.replace(/^Category:/, '').trim();

  // Drop trailing "by state…" qualifiers (case-insensitive — suffixes contain
  // "U.S." so compare lowercased on both sides).
  for (const suf of STRIP_SUFFIXES) {
    if (t.toLowerCase().endsWith(suf.toLowerCase())) { t = t.slice(0, -suf.length); break; }
  }
  t = t.replace(/^Legality of\s+/i, '');          // "Legality of cannabis" → "cannabis"
  t = t.replace(/\s+(in|of)\s+the\s+United\s+States/i, '');
  t = t.replace(/^United States\s+/i, '');        // "United States gun laws" → "gun laws"
  if (/^Law of\b/i.test(t)) return null;          // per-state "Law of Florida"
  t = t.replace(/^State\s+/i, '');                // "State taxation" → "taxation"
  t = t.replace(/\s+laws?$/i, '');                // trailing " law"/" laws"
  t = t.replace(/\s{2,}/g, ' ').trim();
  if (!t) return null;
  if (US_STATES.has(t.toLowerCase())) return null; // bare state name
  return t.charAt(0).toUpperCase() + t.slice(1);
}

const isNoise = (topic) =>
  DENY.some((d) => topic.toLowerCase().includes(d));

const looksLegal = (topic) => {
  const t = topic.toLowerCase();
  return LEGAL_HINTS.some((h) => t.includes(h));
};

async function searchTitles(pattern) {
  const titles = [];
  let offset = 0;
  for (let i = 0; i < 10; i++) {
    const data = await apiGet({
      action: 'query', list: 'search', srsearch: pattern,
      srlimit: '500', sroffset: String(offset), srnamespace: '0|14', srprop: '',
    });
    (data.query?.search ?? []).forEach((h) => titles.push(h.title));
    const cont = data.continue?.sroffset;
    if (cont === undefined) break;
    offset = cont;
    await sleep(300);
  }
  return titles;
}

async function categoryMembers(category) {
  const titles = [];
  let cmcontinue;
  for (let i = 0; i < 10; i++) {
    const data = await apiGet({
      action: 'query', list: 'categorymembers',
      cmtitle: `Category:${category}`, cmlimit: '500', cmtype: 'subcat|page',
      cmnamespace: '0|14',
      ...(cmcontinue ? { cmcontinue } : {}),
    });
    (data.query?.categorymembers ?? []).forEach((m) => titles.push(m.title));
    cmcontinue = data.continue?.cmcontinue;
    if (!cmcontinue) break;
    await sleep(300);
  }
  return titles;
}

async function main() {
  console.log('→ Discovering US state-varying law categories from Wikipedia…\n');

  const seen = new Map(); // topic(lowercased) → record

  const add = (rawTitle, source) => {
    const topic = deriveTopic(rawTitle);
    if (!topic || isNoise(topic)) return;
    const key = topic.toLowerCase();
    if (seen.has(key)) { seen.get(key).sources.add(source); return; }
    seen.set(key, {
      category: topic,
      example_page: rawTitle,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(rawTitle.replace(/ /g, '_'))}`,
      looks_legal: looksLegal(topic),
      sources: new Set([source]),
    });
  };

  // 1) Title patterns
  for (const pat of TITLE_PATTERNS) {
    process.stdout.write(`  • title search: ${pat}\n`);
    const titles = await searchTitles(pat);
    titles.forEach((t) => add(t, 'title-search'));
    await sleep(300);
  }

  // 2) Seed category trees
  for (const cat of SEED_CATEGORIES) {
    process.stdout.write(`  • category tree: ${cat}\n`);
    const members = await categoryMembers(cat);
    members.forEach((t) => add(t, 'category-tree'));
    await sleep(300);
  }

  let records = [...seen.values()]
    .map((r) => {
      const sources = [...r.sources];
      return {
        category: r.category,
        // "high" when it came from the curated "law by issue and state" tree.
        confidence: sources.includes('category-tree') ? 'high' : 'medium',
        example_page: r.example_page,
        url: r.url,
        looks_legal: r.looks_legal,
        sources,
      };
    })
    .sort((a, b) =>
      (a.confidence === b.confidence ? 0 : a.confidence === 'high' ? -1 : 1) ||
      a.category.localeCompare(b.category));

  const legalRecords = records.filter((r) => r.looks_legal);
  if (!INCLUDE_ALL) records = legalRecords;
  const highConfidence = records.filter((r) => r.confidence === 'high');

  await mkdir(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, 'law-categories.json');
  await writeFile(outPath, JSON.stringify({
    source: 'en.wikipedia.org (MediaWiki API: title search + category tree)',
    fetched_at: new Date().toISOString(),
    filter: INCLUDE_ALL ? 'all topics' : 'legal-looking topics only',
    total_topics_found: seen.size,
    legal_looking: legalRecords.length,
    high_confidence: highConfidence.length,
    count: records.length,
    categories: records,
  }, null, 2));

  console.log('\n' + '─'.repeat(60));
  console.log(`Distinct "by state" topics found:  ${seen.size}`);
  console.log(`Legal-looking categories:          ${legalRecords.length}`);
  console.log(`  └ high confidence (curated cat):  ${highConfidence.length}`);
  console.log(`Written to JSON (${INCLUDE_ALL ? 'all' : 'legal only'}):       ${records.length}`);
  console.log('─'.repeat(60));
  console.log(`\nSaved → ${outPath}\n`);
  console.log('Categories (★ = high confidence):');
  records.forEach((r) => console.log(`  ${r.confidence === 'high' ? '★' : '•'} ${r.category}`));
  if (!INCLUDE_ALL) {
    console.log('\nTip: re-run with --all to include every topic (not just legal-looking ones).');
  }
}

main().catch((e) => {
  console.error('\n[x] Failed:', e.message);
  process.exit(1);
});
