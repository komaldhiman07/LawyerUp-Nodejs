/**
 * Shared law-content classifiers.
 *
 * Single source of truth for deriving the scannable verdict + penalty severity
 * from a law's free-text summary/penalty. Used by the admin save path, the
 * user-facing read endpoint, and the backfill script.
 */

/** Derive legality verdict from a law's summary. */
export function classifyLegality(lawKey, summary) {
  if (lawKey === "minimum_wage" || lawKey === "death_penalty") return "info";
  const s = (summary || "").toLowerCase();
  if (/\billegal\b|prohibit|banned|not legal|felony/.test(s)) return "prohibited";
  if (/medical only|limited|permit required|decriminal|restricted|misdemeanor|conditional/.test(s)) {
    return "restricted";
  }
  if (/legal|permitless|recreational|constitutional carry|allowed|lawful/.test(s)) {
    return "permitted";
  }
  return "info";
}

/** Derive a coarse penalty-severity bucket from penalty text. */
export function penaltySeverity(penaltyText) {
  const s = (penaltyText || "").toLowerCase().trim();
  if (!s) return "none";
  if (/felony|years|life|prison|\$\s*[1-9]\d{3,}/.test(s)) return "high";
  if (/misdemeanor|jail|months|\$\s*[1-9]\d{2,}/.test(s)) return "medium";
  if (/fine|infraction|citation|civil/.test(s)) return "low";
  return "low";
}
