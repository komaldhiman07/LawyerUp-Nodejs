/**
 * Claude calls for the law-ingestion pipeline (server-side, babel-node).
 *  - normalizeRow:  clean a scraped table row into a StateLaw-ready record.
 *  - generateRow:   research a single (category, state) from scratch, with a
 *                   required source URL, for categories with no scrapeable table.
 *
 * Uses raw fetch (no SDK). Reads ANTHROPIC_API_KEY from env. Conservative,
 * citation-aware prompts — output is always a DRAFT for human review.
 *
 * NOTE: babel config here does not support `??` — use `||`.
 */

const MODEL_ALIASES = {
  haiku: "claude-haiku-4-5-20251001",
  sonnet: "claude-sonnet-4-6",
  opus: "claude-opus-4-8",
};

const MODEL =
  MODEL_ALIASES[process.env.LAW_INGEST_MODEL] ||
  process.env.LAW_INGEST_MODEL ||
  MODEL_ALIASES.haiku;

const LAW_TOOL = {
  name: "record_law",
  description: "Record the normalized legal information for this state and topic.",
  input_schema: {
    type: "object",
    properties: {
      legality: {
        type: "string",
        enum: ["permitted", "restricted", "prohibited", "info"],
        description:
          'Practical verdict for an ordinary person. "info" for non-legality topics (e.g. minimum wage, age thresholds).',
      },
      legality_label: { type: "string" },
      summary: { type: "string", description: "Neutral plain-English summary, <240 chars, no legal advice." },
      penalty_text: { type: "string", description: "Penalty in plain English IF supported; otherwise empty." },
      penalty_severity: { type: "string", enum: ["none", "low", "medium", "high"] },
      key_points: { type: "array", items: { type: "string" } },
      traveler_note: { type: "string" },
      statute_reference: { type: "string", description: "Only if explicitly supported by the source; else empty." },
      source_url: { type: "string", description: "Authoritative URL supporting this (official/gov preferred)." },
      confidence: { type: "string", enum: ["high", "medium", "low"] },
    },
    required: ["legality", "summary", "key_points", "penalty_severity", "confidence"],
  },
};

const NORMALIZE_SYSTEM = [
  "You normalize messy scraped US state-law table data into clean records for a consumer app that summarizes laws by state.",
  "RULES:",
  "1. Base output ONLY on the provided scraped data plus widely-known, stable facts. Do NOT invent statute numbers, dollar penalties, or dates the data does not support — leave unknown fields empty.",
  '2. legality: "permitted" (broadly legal), "restricted" (legal with limits/permits), "prohibited" (illegal), "info" (informational topics like minimum wage or age thresholds).',
  "3. summary: neutral, plain English, under 240 characters, no legal advice.",
  "4. key_points: 2-5 short factual bullets from the data.",
  "5. traveler_note: one practical heads-up for an out-of-state visitor, or empty.",
  "6. Set confidence by how clearly the data supports your answer.",
  "This is a DRAFT for human review — accurate and conservative over comprehensive.",
].join("\n");

const RESEARCH_SYSTEM = [
  "You are a legal research assistant compiling US state-law summaries for a consumer app, one (topic, state) at a time.",
  "RULES:",
  "1. Provide the current, generally-accepted legal position for this topic in this state, in plain English.",
  "2. You MUST include a source_url to an authoritative reference (official state government / statute / reputable legal source). If you cannot identify a credible source, set confidence to \"low\" and say so in the summary.",
  "3. Do NOT fabricate specific statute numbers, dollar amounts, or dates you are not confident about — leave those fields empty rather than guess.",
  "4. legality: permitted / restricted / prohibited / info. summary under 240 chars, no legal advice.",
  "5. key_points: 2-5 bullets. traveler_note: one practical heads-up or empty.",
  "6. confidence reflects your certainty; prefer \"medium\"/\"low\" when unsure.",
  "Output is a DRAFT for mandatory human review before publication.",
].join("\n");

async function callTool(system, userText, attempt = 0) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system,
      tools: [LAW_TOOL],
      tool_choice: { type: "tool", name: "record_law" },
      messages: [{ role: "user", content: userText }],
    }),
  });

  if (res.status === 429 || res.status === 529 || res.status >= 500) {
    if (attempt >= 5) throw new Error(`Claude API ${res.status} after ${attempt} retries`);
    await new Promise((r) => setTimeout(r, Math.min(2000 * 2 ** attempt, 30000)));
    return callTool(system, userText, attempt + 1);
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Claude API ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = await res.json();
  const tool = (json.content || []).find((c) => c.type === "tool_use" && c.name === "record_law");
  if (!tool) throw new Error("No tool_use in Claude response");
  return tool.input;
}

export function ingestModel() {
  return MODEL;
}

export async function normalizeRow({ topic, state, columns }) {
  const payload = { topic, state, scraped_columns: columns };
  return callTool(NORMALIZE_SYSTEM, `Normalize this into a record_law call:\n${JSON.stringify(payload, null, 2)}`);
}

export async function generateRow({ topic, state }) {
  const payload = { topic, state };
  return callTool(RESEARCH_SYSTEM, `Research and record_law for:\n${JSON.stringify(payload, null, 2)}`);
}
