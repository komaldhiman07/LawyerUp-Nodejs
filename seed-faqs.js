/**
 * seed-faqs.js — seed the help-center FAQ entries.
 *
 * Run (babel-node):
 *   ./node_modules/.bin/babel-node seed-faqs.js          # insert only if empty
 *   ./node_modules/.bin/babel-node seed-faqs.js --force  # wipe + reseed
 */
import "dotenv/config";
import mongoose from "mongoose";
import Faq from "./database/models/Faq";

const MONGO_URI = process.env.MONGO_DB_URI || "mongodb://localhost:27017/lawyerup";
const FORCE = process.argv.includes("--force");

const FAQS = [
  ["Getting started", [
    ["What does LawyerUp do?", "LawyerUp explains US state laws in plain English. Look up what’s legal where you live, track laws for changes, and check the rules before you travel between states."],
    ["Is this legal advice?", "No. LawyerUp provides general legal information for awareness only. It is not legal advice and does not replace a licensed attorney. Always confirm with official sources or a lawyer before acting."],
    ["How current is the information?", "We review and update laws regularly from public sources, and show a “last reviewed” date and an official source link on each law. Laws change often, so always verify with the source."],
    ["Which states are covered?", "All 50 US states and Washington, D.C. Coverage depth varies by topic — we’re continually adding laws and categories."],
  ]],
  ["Finding laws", [
    ["How do I look up a law?", "Open State Laws, pick a category (like marijuana or guns) and a state — or search by keyword. Tap any law to see the summary, penalty, and official source."],
    ["What do Legal, Restricted, and Illegal mean?", "They’re a quick verdict: Legal (permitted), Restricted (allowed with limits or a permit), Illegal (prohibited). Tap the law for the full detail behind the label."],
    ["Why do penalties differ between states?", "Each state writes its own laws, so the same activity can carry very different penalties — or be fully legal in one state and a crime in another."],
    ["What does the “verified” badge mean?", "A verified law has been reviewed by our team against an official source. Unverified entries may be drafts still pending review."],
  ]],
  ["Tracking & alerts", [
    ["How do I track a law?", "Add a category to your tracked list, or tap the bell on a law. We’ll notify you when its status or penalty changes."],
    ["What notifications will I get?", "Updates when a tracked law changes, new laws in your categories, penalty changes, travel alerts for saved trips, and important reminders."],
    ["Why am I not getting notifications?", "Make sure notifications are enabled for LawyerUp in your phone settings and that you’ve set your home state. Some alerts are tied to laws or trips you track."],
    ["How do I set my home state?", "Tap your location on the Home screen and choose your state. This tailors your alerts and the laws shown to you."],
  ]],
  ["Travel & compare", [
    ["How does Travel Mode work?", "Save a trip with a destination and date. We’ll show how the laws differ from your home state and remind you 5, 3, and 1 days before — and on travel day — about anything risky."],
    ["Can I compare two states?", "Yes — use Compare to put two states side by side for any category and instantly see where the rules differ."],
    ["What counts as a travel “risk”?", "When something legal or allowed in your home state is prohibited at your destination — so you’re not caught off guard."],
  ]],
  ["Contributing", [
    ["Can I suggest a missing law or report an error?", "Yes. Use “Suggest a change” to request a missing law, report an error, or flag an update — or tap “Suggest a correction” on any law."],
    ["What happens after I submit?", "Our team reviews every suggestion. If we act on it, it becomes part of our verified law data and you’ll get a notification. Suggestions never publish directly."],
  ]],
  ["Account & privacy", [
    ["Is my data private?", "Yes. We only use your home state and tracked categories to personalize alerts. See our Privacy Policy for full details."],
    ["Do I need a subscription?", "Core features — browsing, searching, and tracking laws — are free. Some advanced features may require a subscription."],
    ["How do I delete my account?", "Go to Settings → Account to delete your account and its associated data."],
  ]],
];

async function run() {
  await mongoose.connect(MONGO_URI);
  const count = await Faq.countDocuments({ is_deleted: false });
  if (count > 0 && !FORCE) {
    console.log(`FAQs already present (${count}). Use --force to wipe & reseed.`);
    await mongoose.disconnect();
    return;
  }
  if (FORCE) {
    const del = await Faq.deleteMany({});
    console.log(`--force: removed ${del.deletedCount} existing FAQs.`);
  }

  const docs = [];
  for (const [category, items] of FAQS) {
    items.forEach(([question, answer], i) => {
      docs.push({ question, answer, category, order: i, is_active: true });
    });
  }
  await Faq.insertMany(docs);
  console.log(`Seeded ${docs.length} FAQs across ${FAQS.length} categories.`);
  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
