import { STATE_NAME_BY_CODE } from "./usStates.js";

const FIELD_LABELS = {
  title: "Title",
  summary: "Summary",
  details: "Details",
  penalty_text: "Penalty",
  status: "Status",
  effective_from: "Effective Date",
  effective_to: "End Date",
  legality: "Legality",
  legality_label: "Label",
};

const DIFF_FIELDS = [
  "summary",
  "details",
  "penalty_text",
  "status",
  "effective_from",
  "effective_to",
  "legality",
  "title",
];

export function resolveStateCode(input) {
  if (!input) return "";
  const s = String(input).trim();
  if (s.length === 2) return s.toUpperCase();
  const entry = Object.entries(STATE_NAME_BY_CODE).find(
    ([, name]) => name.toLowerCase() === s.toLowerCase()
  );
  return entry ? entry[0] : s.toUpperCase();
}

function formatValue(field, value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "—";
  }
  if (field === "effective_from" || field === "effective_to") {
    try {
      return new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (_) {
      return String(value);
    }
  }
  if (field === "status") {
    const str = String(value);
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  return String(value);
}

function actionToChangeType(action) {
  switch (action) {
    case "publish":
    case "create":
      return "published";
    case "repeal":
      return "repealed";
    default:
      return "updated";
  }
}

function buildSummaryLine(changeType, stateName, diffs) {
  const labels = diffs.map((d) => d.field_label.toLowerCase());
  if (changeType === "published") {
    return `This law is newly enacted in ${stateName}.`;
  }
  if (changeType === "repealed") {
    return `This law has been repealed in ${stateName}.`;
  }
  if (labels.length) {
    const unique = [...new Set(labels)];
    const joined =
      unique.length === 1
        ? unique[0]
        : `${unique.slice(0, -1).join(", ")} and ${unique[unique.length - 1]}`;
    return `${joined.charAt(0).toUpperCase() + joined.slice(1)} ${
      unique.length === 1 ? "was" : "were"
    } changed in ${stateName}.`;
  }
  return `This law was updated in ${stateName}.`;
}

/**
 * Build user-facing before/after rows from a LawAuditLog entry.
 */
export function buildDiffsFromAuditLog(auditLog) {
  if (!auditLog) return [];

  const before = auditLog.before_data || {};
  const after = auditLog.after_data || {};
  const diffs = [];

  for (const field of DIFF_FIELDS) {
    const b = before[field];
    const a = after[field];
    // NOTE: this project's babel build rejects `??` — use an explicit null check.
    if (String(b == null ? "" : b) === String(a == null ? "" : a)) continue;
    diffs.push({
      field,
      field_label: FIELD_LABELS[field] || field,
      before: formatValue(field, b),
      after: formatValue(field, a),
    });
  }

  if (diffs.length) return diffs;

  // Fallbacks when only metadata fields changed (e.g. publish/repeal).
  if (auditLog.action === "publish" || auditLog.action === "create") {
    if (after.summary) {
      diffs.push({
        field: "summary",
        field_label: "Summary",
        before: "No active law existed in this state for this category.",
        after: formatValue("summary", after.summary),
      });
    }
    if (after.effective_from) {
      diffs.push({
        field: "effective_from",
        field_label: "Effective Date",
        before: "—",
        after: formatValue("effective_from", after.effective_from),
      });
    }
  }

  if (auditLog.action === "repeal") {
    diffs.push({
      field: "status",
      field_label: "Status",
      before: formatValue("status", before.status || "active"),
      after: "Repealed",
    });
    if (before.summary) {
      diffs.push({
        field: "summary",
        field_label: "Summary",
        before: formatValue("summary", before.summary),
        after: "Law repealed. No replacement legislation currently in effect.",
      });
    }
  }

  return diffs;
}

/**
 * Assemble the law-change detail payload for the mobile app.
 */
export function buildLawChangeDetail({
  law,
  auditLog,
  homeLaw,
  homeStateCode,
  changeTypeHint,
}) {
  const stateCode = (law.state_code || "").toUpperCase();
  const stateName = STATE_NAME_BY_CODE[stateCode] || stateCode;
  const homeCode = homeStateCode || "";
  const homeName = homeCode ? STATE_NAME_BY_CODE[homeCode] || homeCode : "";

  const changeType = auditLog
    ? actionToChangeType(auditLog.action)
    : changeTypeHint || "updated";

  const diffs = buildDiffsFromAuditLog(auditLog);

  return {
    law_id: law._id.toString(),
    law_title: law.title || "",
    law_key: law.law_key || "",
    state_code: stateCode,
    state_name: stateName,
    home_state_code: homeCode,
    home_state_name: homeName,
    change_type: changeType,
    change_action: auditLog ? auditLog.action : "",
    changed_at: auditLog
      ? auditLog.createdAt || auditLog.created_at
      : law.updatedAt || law.published_at || null,
    summary_line: buildSummaryLine(changeType, stateName, diffs),
    diffs,
    home_state_law: homeLaw
      ? {
          state_code: homeLaw.state_code,
          state_name:
            STATE_NAME_BY_CODE[homeLaw.state_code] || homeLaw.state_code,
          title: homeLaw.title || "",
          summary: homeLaw.summary || "",
          penalty_text: homeLaw.penalty_text || "",
        }
      : null,
  };
}
