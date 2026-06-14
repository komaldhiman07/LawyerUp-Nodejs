/**
 * Daily job — sends law-awareness reminders for upcoming saved trips at
 * 5 / 3 / 1 / 0 days before travel. Risk-first content, deduped via
 * Trip.reminders_sent. Persists the in-app notification first, then pushes.
 */
import cron from "node-cron";
import Trip from "../../database/models/Trip";
import Device from "../../database/models/Device";
import Notification from "../../database/models/Notification";
import tripService from "../trips/trip.service";
import firebaseService from "../services/common/firebase";
import { STATE_NAME_BY_CODE } from "../helpers/usStates";

const REMINDER_DAYS = [5, 3, 1, 0];

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const daysBetween = (from, to) =>
  Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86400000);

const LAW_LABELS = {
  marijuana: "Marijuana",
  guns: "Guns",
  gambling: "Gambling",
  death_penalty: "Death penalty",
  minimum_wage: "Minimum wage",
};
const labelFor = (k) => LAW_LABELS[k] || (k || "").replace(/_/g, " ");

async function sendTripReminder(trip, days) {
  const destName =
    STATE_NAME_BY_CODE[trip.destination_state] || trip.destination_state;
  const diff = await tripService.getStateDifferences(
    trip.home_state,
    trip.destination_state
  );

  const when = days === 0 ? "today" : `in ${days} day${days === 1 ? "" : "s"}`;
  const title =
    days === 0
      ? `You're traveling to ${destName} today`
      : `Trip to ${destName} ${when}`;

  let body;
  let priority = "normal";
  if (diff.riskCount > 0) {
    const topRisk = diff.rows.find((r) => r.isRisk);
    const cat = topRisk ? labelFor(topRisk.law_key) : "Something";
    body = `${diff.riskCount} thing${diff.riskCount === 1 ? "" : "s"} could get you in trouble — ${cat} is legal at home but not in ${destName}. Tap to review.`;
    priority = "urgent";
  } else if (diff.count > 0) {
    body = `${diff.count} law${diff.count === 1 ? "" : "s"} differ from your home state. Tap to compare before you go.`;
  } else {
    body = `Laws look similar to home. Tap to review.`;
  }

  const deepLink = {
    route: "stateCompare",
    args: { destination: trip.destination_state },
  };
  const data = {
    days,
    risk_count: diff.riskCount,
    difference_count: diff.count,
    trip_id: trip._id.toString(),
  };

  // 1) Persist first — must survive a push failure.
  try {
    await Notification.create({
      title,
      body,
      message: body,
      type: "tripReminder",
      priority,
      sender_id: null,
      receiver_id: trip.user_id,
      is_read: false,
      state_code: trip.destination_state,
      cta_label: "Compare states",
      deep_link: deepLink,
      data,
      created_at: new Date(),
    });
  } catch (e) {
    console.error("[tripReminders] persist failed:", e && e.message);
  }

  // 2) Best-effort push.
  try {
    const devices = await Device.find({
      user_id: trip.user_id,
      is_deleted: false,
    }).lean();
    const tokens = devices.map((d) => d.device_token).filter(Boolean);
    if (tokens.length) {
      await firebaseService.sendNotification({
        registrationToken: tokens,
        title,
        message: body,
        payload: {
          type: "tripReminder",
          priority,
          state_code: trip.destination_state,
          cta_label: "Compare states",
          deep_link: JSON.stringify(deepLink),
          data: JSON.stringify(data),
        },
      });
    }
  } catch (e) {
    console.error("[tripReminders] push failed (non-fatal):", e && e.message);
  }
}

/** One pass: complete past trips, then fire any due reminders. */
export async function runTripReminders() {
  const today = new Date();
  try {
    // Past trips → completed.
    await Trip.updateMany(
      { status: "upcoming", travel_date: { $lt: startOfDay(today) } },
      { status: "completed" }
    );

    const horizon = new Date(startOfDay(today).getTime() + 6 * 86400000);
    const trips = await Trip.find({
      status: "upcoming",
      travel_date: { $gte: startOfDay(today), $lte: horizon },
    });

    for (const trip of trips) {
      const days = daysBetween(today, trip.travel_date);
      if (!REMINDER_DAYS.includes(days)) continue;
      if ((trip.reminders_sent || []).includes(days)) continue;
      await sendTripReminder(trip, days);
      trip.reminders_sent = [...(trip.reminders_sent || []), days];
      await trip.save();
    }
  } catch (e) {
    console.error("[tripReminders] run failed:", e && e.message);
  }
}

/** Schedule the daily run (09:00 server time) + a catch-up run on boot. */
export function startTripReminderJob() {
  cron.schedule("0 9 * * *", runTripReminders);
  // Catch-up shortly after boot so same-day reminders aren't missed on restart.
  setTimeout(() => {
    runTripReminders().catch((e) =>
      console.error("[tripReminders] boot run:", e && e.message)
    );
  }, 15000);
  console.log("[tripReminders] daily reminder job scheduled (09:00)");
}
