/**
 * scrape-laws-per-state.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches a category's "by state" Wikipedia page, finds the table keyed by US
 * state, and emits one structured record per state to JSON.
 *
 * Usage (run from the lawyer_backend root):
 *   node scraped/script/scrape-laws-per-state.mjs <category>
 *   node scraped/script/scrape-laws-per-state.mjs --page "<Exact Wikipedia Title>"
 *   node scraped/script/scrape-laws-per-state.mjs --all     # every CATEGORY_PAGES entry
 *
 * Examples:
 *   node scraped/script/scrape-laws-per-state.mjs cannabis
 *   node scraped/script/scrape-laws-per-state.mjs --page "Gun laws in the United States by state"
 *
 * Output:  scraped/laws-per-state/<slug>.json
 *
 * Run with plain node (NOT babel-node). Native fetch + ESM. No DB writes,
 * no external dependencies.
 *
 * CAVEAT: Wikipedia tables are human-authored and inconsistent. This parser
 * handles the common wikitable shape (single header row, a state column,
 * rowspan/colspan). Always spot-check the JSON before importing — treat the
 * output as a research draft, not authoritative legal data.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const API = 'https://en.wikipedia.org/w/api.php';
const UA = 'LawyerUp-law-scraper/1.0 (https://lawyerup.app; admin@lawyerup.app)';
// Anchor output to scraped/ (two levels up from scraped/script/).
const ROOT = path.resolve(import.meta.dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'scraped', 'laws-per-state');

// Known good "by state" pages for common categories. Pages must contain a
// single table keyed by state (not per-state sub-tables) for clean extraction.
const CATEGORY_PAGES = {
  cannabis:           'Legality of cannabis by U.S. jurisdiction',
  capital_punishment: 'Capital punishment in the United States',
  death_penalty:      'Capital punishment in the United States',
  minimum_wage:       'Minimum wage in the United States',
  age_of_consent:     'Age of consent in the United States',
  abortion:           'Abortion in the United States by state',
  alcohol:            'Alcohol laws of the United States',
  // NOTE: "Gun laws in the United States by state" uses per-state sub-tables,
  // not one state-keyed table — the parser will skip it. Kept for reference.
  gun:                'Gun laws in the United States by state',
};

const NAME_TO_CODE = {
  Alabama:'AL',Alaska:'AK',Arizona:'AZ',Arkansas:'AR',California:'CA',Colorado:'CO',
  Connecticut:'CT',Delaware:'DE',Florida:'FL',Georgia:'GA',Hawaii:'HI',Idaho:'ID',
  Illinois:'IL',Indiana:'IN',Iowa:'IA',Kansas:'KS',Kentucky:'KY',Louisiana:'LA',
  Maine:'ME',Maryland:'MD',Massachusetts:'MA',Michigan:'MI',Minnesota:'MN',
  Mississippi:'MS',Missouri:'MO',Montana:'MT',Nebraska:'NE',Nevada:'NV',
  'New Hampshire':'NH','New Jersey':'NJ','New Mexico':'NM','New York':'NY',
  'North Carolina':'NC','North Dakota':'ND',Ohio:'OH',Oklahoma:'OK',Oregon:'OR',
  Pennsylvania:'PA','Rhode Island':'RI','South Carolina':'SC','South Dakota':'SD',
  Tennessee:'TN',Texas:'TX',Utah:'UT',Vermont:'VT',Virginia:'VA',Washington:'WA',
  'West Virginia':'WV',Wisconsin:'WI',Wyoming:'WY','District of Columbia':'DC',
};
// Aliases the tables sometimes use.
const NAME_ALIASES = {
  'Washington, D.C.':'District of Columbia','Washington DC':'District of Columbia',
  'Washington, DC':'District of Columbia','D.C.':'District of Columbia',
};

const args = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

// ── HTML cell → clean text ────────────────────────────────────────────────────
function decodeEntities(s) {
  return s
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
    .replace(/&ndash;|&#8211;/g, '–').replace(/&mdash;|&#8212;/g, '—')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));
}

function cleanText(html) {
  return decodeEntities(
    html
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<sup[\s\S]*?<\/sup>/gi, '')                 // citation markers
      .replace(/<span[^>]*display\s*:\s*none[^>]*>[\s\S]*?<\/span>/gi, '') // hidden sortkeys
      .replace(/<br\s*\/?>/gi, ' / ')
      .replace(/<\/(td|th|tr|p|div|li)>/gi, ' ')
      .replace(/<[^>]+>/g, '')                              // strip remaining tags
      .replace(/\[[0-9a-z ]+\]/gi, '')                      // [1] [note 2] footnotes
  ).replace(/\s+/g, ' ').trim();
}

// Parse the cells of one <tr> … keeping rowspan/colspan.
function parseRowCells(rowHtml) {
  const cells = [];
  const re = /<(th|td)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(rowHtml))) {
    const attrs = m[2] || '';
    const rowspan = parseInt((attrs.match(/rowspan\s*=\s*"?(\d+)/i) || [])[1] || '1', 10);
    const colspan = parseInt((attrs.match(/colspan\s*=\s*"?(\d+)/i) || [])[1] || '1', 10);
    cells.push({
      text: cleanText(m[3]),
      header: m[1].toLowerCase() === 'th',
      rowspan: Math.max(1, rowspan),
      colspan: Math.max(1, colspan),
    });
  }
  return cells;
}

// Build a normalised grid (rows × cols) honouring rowspan/colspan.
function buildGrid(tableHtml) {
  const rowChunks = tableHtml.split(/<tr\b[^>]*>/i).slice(1).map((c) => c.split(/<\/tr>/i)[0]);
  const grid = [];
  const carry = {}; // colIndex → { text, remaining }
  const consumeCarry = (row, colRef) => {
    while (carry[colRef.c] && carry[colRef.c].remaining > 0) {
      row[colRef.c] = carry[colRef.c].text;
      carry[colRef.c].remaining--;
      colRef.c++;
    }
  };
  for (const chunk of rowChunks) {
    const cells = parseRowCells(chunk);
    if (!cells.length) continue;
    const row = [];
    const colRef = { c: 0 };
    consumeCarry(row, colRef);
    for (const cell of cells) {
      for (let s = 0; s < cell.colspan; s++) {
        row[colRef.c] = cell.text;
        if (cell.rowspan > 1) carry[colRef.c] = { text: cell.text, remaining: cell.rowspan - 1 };
        colRef.c++;
        consumeCarry(row, colRef);
      }
    }
    grid.push(row);
  }
  return grid;
}

const canonicalState = (raw) => {
  const t = (raw || '')
    .replace(/§/g, '')                 // section-sign anchors ("§ Alabama")
    .replace(/\s*\(.*?\)\s*/g, '')      // drop "(state)" etc.
    .replace(/^[^A-Za-z]+/, '')         // leading symbols / nbsp / numbers
    .trim();
  if (NAME_TO_CODE[t]) return t;
  if (NAME_ALIASES[t]) return NAME_ALIASES[t];
  // Match a state name appearing at the start of the cell.
  for (const name of Object.keys(NAME_TO_CODE)) {
    if (t.toLowerCase().startsWith(name.toLowerCase())) return name;
  }
  return null;
};

// Pick the table on the page that is most clearly keyed by US state.
function pickStateTable(html) {
  const tables = [...html.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/gi)].map((m) => m[0]);
  let best = null;
  let bestScore = 0;
  for (const t of tables) {
    if (!/wikitable/i.test(t)) continue;
    const grid = buildGrid(t);
    if (grid.length < 5) continue;
    // For each column, count rows whose value is a US state.
    const colHits = {};
    for (let r = 1; r < grid.length; r++) {
      const row = grid[r] || [];
      for (let c = 0; c < row.length; c++) {
        if (canonicalState(row[c])) colHits[c] = (colHits[c] || 0) + 1;
      }
    }
    const stateCol = Object.keys(colHits).sort((a, b) => colHits[b] - colHits[a])[0];
    const score = stateCol !== undefined ? colHits[stateCol] : 0;
    if (score > bestScore) { bestScore = score; best = { grid, stateCol: +stateCol, score }; }
  }
  // Require real coverage — a true by-state table has most of the ~51 rows.
  // This rejects incidental tables that merely mention a state name or two.
  if (best && best.score >= 15) return best;
  return null;
}

async function fetchPageHtml(title) {
  const qs = new URLSearchParams({
    action: 'parse', page: title, prop: 'text', redirects: '1',
    format: 'json', formatversion: '2',
  });
  const res = await fetch(`${API}?${qs}`, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Wikipedia API ${res.status} ${res.statusText}`);
  const json = await res.json();
  if (json.error) throw new Error(`Wikipedia: ${json.error.info}`);
  return { html: json.parse.text, resolvedTitle: json.parse.title };
}

async function scrapeOne(category, explicitPage) {
  const title = explicitPage || CATEGORY_PAGES[category] || category;
  console.log(`\n→ ${category || title}\n  page: "${title}"`);
  const { html, resolvedTitle } = await fetchPageHtml(title);
  const sourceUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(resolvedTitle.replace(/ /g, '_'))}`;

  const picked = pickStateTable(html);
  if (!picked) {
    console.log('  [!] No single state-keyed table found (page may use per-state sub-tables). Skipping.');
    return {
      category: category || slug(resolvedTitle),
      title: resolvedTitle,
      source: 'en.wikipedia.org',
      source_url: sourceUrl,
      fetched_at: new Date().toISOString(),
      note: 'No single by-state table found on this page — it likely uses per-state sub-tables. Try a different page with --page.',
      state_count: 0,
      rows: [],
    };
  }
  const { grid, stateCol } = picked;
  const header = (grid[0] || []).map((h, i) => h || `col_${i}`);

  const seen = new Set();
  const rows = [];
  for (let r = 1; r < grid.length; r++) {
    const row = grid[r] || [];
    const name = canonicalState(row[stateCol]);
    if (!name || seen.has(name)) continue;
    seen.add(name);
    const columns = {};
    for (let c = 0; c < row.length; c++) {
      if (c === stateCol) continue;
      const key = header[c] || `col_${c}`;
      if (row[c]) columns[key] = row[c];
    }
    rows.push({ state: name, state_code: NAME_TO_CODE[name], columns });
  }

  console.log(`  ✓ parsed ${rows.length} states (state column = "${header[stateCol]}", ${header.length} columns)`);
  return {
    category: category || slug(resolvedTitle),
    title: resolvedTitle,
    source: 'en.wikipedia.org',
    source_url: sourceUrl,
    fetched_at: new Date().toISOString(),
    columns: header,
    state_count: rows.length,
    rows,
  };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  let jobs = [];
  if (args.includes('--all')) {
    jobs = Object.keys(CATEGORY_PAGES).map((c) => ({ category: c }));
  } else if (args.includes('--page')) {
    const page = args[args.indexOf('--page') + 1];
    if (!page) throw new Error('--page requires a title, e.g. --page "Gun laws in the United States by state"');
    jobs = [{ category: slug(page), explicitPage: page }];
  } else if (args[0]) {
    jobs = [{ category: args[0] }];
  } else {
    console.log('Usage:\n  node scrape-laws-per-state.mjs <category>        e.g. gun, cannabis, alcohol, gambling, abortion, capital_punishment, minimum_wage\n  node scrape-laws-per-state.mjs --page "<Exact Wikipedia Title>"\n  node scrape-laws-per-state.mjs --all');
    console.log('\nKnown categories:', Object.keys(CATEGORY_PAGES).join(', '));
    return;
  }

  const results = [];
  for (const job of jobs) {
    try {
      const result = await scrapeOne(job.category, job.explicitPage);
      const outPath = path.join(OUT_DIR, `${slug(result.category)}.json`);
      await writeFile(outPath, JSON.stringify(result, null, 2));
      console.log(`  saved → ${outPath}`);
      results.push({ category: result.category, states: result.state_count, file: outPath });
    } catch (e) {
      console.error(`  [x] ${job.category}: ${e.message}`);
    }
    if (jobs.length > 1) await sleep(800);
  }

  if (jobs.length > 1) {
    console.log('\n' + '─'.repeat(60));
    results.forEach((r) => console.log(`  ${r.category.padEnd(22)} ${String(r.states).padStart(3)} states`));
    console.log('─'.repeat(60));
  }
}

main().catch((e) => {
  console.error('\n[x] Failed:', e.message);
  process.exit(1);
});
