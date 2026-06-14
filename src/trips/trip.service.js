import Trip from "../../database/models/Trip";
import StateLaw from "../../database/models/StateLaw";
import { classifyLegality } from "../helpers/lawClassifier";

export class TripService {
  create = (data) => Trip.create(data);

  listByUser = (userId) =>
    Trip.find({ user_id: userId, status: { $ne: "cancelled" } })
      .sort({ travel_date: 1 })
      .lean();

  getById = (id, userId) => Trip.findOne({ _id: id, user_id: userId }).lean();

  cancel = (id, userId) =>
    Trip.findOneAndUpdate(
      { _id: id, user_id: userId },
      { status: "cancelled" },
      { new: true }
    );

  /**
   * Compute the law differences between two states (home → destination),
   * risk-first. Shared by the trip-detail endpoint and the reminder cron.
   */
  getStateDifferences = async (homeCode, destCode) => {
    const home = (homeCode || "").toUpperCase();
    const dest = (destCode || "").toUpperCase();
    if (!dest) return { count: 0, riskCount: 0, rows: [] };

    const laws = await StateLaw.find({
      status: "active",
      is_deleted: false,
      state_code: { $in: [home, dest].filter(Boolean) },
    })
      .select("state_code law_key summary legality")
      .lean();

    const byKeyState = {};
    for (const l of laws) {
      const legality = l.legality || classifyLegality(l.law_key, l.summary);
      (byKeyState[l.law_key] = byKeyState[l.law_key] || {})[l.state_code] = {
        summary: l.summary,
        legality,
      };
    }

    const rows = [];
    for (const key of Object.keys(byKeyState).sort()) {
      const a = byKeyState[key][home] || null; // home
      const b = byKeyState[key][dest] || null; // destination
      if (!b && !a) continue;
      const differs =
        a && b &&
        (a.summary || "").trim().toLowerCase() !==
          (b.summary || "").trim().toLowerCase();
      const isRisk =
        a && b &&
        (a.legality === "permitted" || a.legality === "restricted") &&
        b.legality === "prohibited";
      rows.push({ law_key: key, home: a, destination: b, differs, isRisk });
    }

    // Risk first, then other differences, then same.
    rows.sort((x, y) => {
      const rank = (r) => (r.isRisk ? 0 : r.differs ? 1 : 2);
      return rank(x) - rank(y);
    });

    const riskCount = rows.filter((r) => r.isRisk).length;
    const diffCount = rows.filter((r) => r.isRisk || r.differs).length;
    return { count: diffCount, riskCount, rows };
  };
}

export default new TripService();
