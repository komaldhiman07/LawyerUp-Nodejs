/**
 * Test helper — inserts one sample notification of each interesting type for a
 * user, so you can open the app's notification screen and verify all the new
 * styling (penalty diff, effective-date chip, priority accents, icons, CTAs).
 *
 * Run from lawyer_backend:
 *   ./node_modules/.bin/babel-node seed-test-notifications.js demo@yopmail.com
 *   ./node_modules/.bin/babel-node seed-test-notifications.js demo@yopmail.com --clear
 *
 * --clear first wipes this user's existing notifications.
 */

import 'dotenv/config';
import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_DB_URI || 'mongodb://localhost:27017/lawyerup';
const email = process.argv[2];
const CLEAR = process.argv.includes('--clear');

if (!email) {
  console.error('Usage: babel-node seed-test-notifications.js <user-email> [--clear]');
  process.exit(1);
}

const mins = (n) => new Date(Date.now() - n * 60000);
const days = (n) => new Date(Date.now() + n * 86400000);

function samples(userId) {
  const link = (route, args) => ({ route, args });
  return [
    {
      type: 'penaltyChange', priority: 'high',
      title: 'Penalty changed: Marijuana Laws',
      body: 'The penalty for "Marijuana Laws" in TX has changed. Tap to review.',
      data: { from: 'Misdemeanor · up to $2,000', to: 'Felony · up to 2 years' },
      state_code: 'TX', law_title: 'Marijuana Laws', law_key: 'marijuana',
      cta_label: 'View law', deep_link: link('stateLaws', { stateCode: 'TX', lawKey: 'marijuana' }),
      created_at: mins(3),
    },
    {
      type: 'effectiveSoon', priority: 'normal',
      title: 'Takes effect 2026-07-01: Minimum Wage',
      body: '"Minimum Wage" in CA takes effect on 2026-07-01.',
      effective_date: days(22), expires_at: days(22),
      state_code: 'CA', law_title: 'Minimum Wage', law_key: 'minimum_wage',
      cta_label: 'View law', deep_link: link('stateLaws', { stateCode: 'CA', lawKey: 'minimum_wage' }),
      created_at: mins(40),
    },
    {
      type: 'travelRisk', priority: 'urgent',
      title: 'Heads up in Texas',
      body: 'Marijuana is legal at home but a crime in Texas. Tap to compare.',
      data: { home: 'permitted', here: 'prohibited' },
      state_code: 'TX', cta_label: 'Compare states',
      deep_link: link('stateCompare', { destination: 'TX' }),
      created_at: mins(90),
    },
    {
      type: 'lawNew', priority: 'normal',
      title: 'New tenant-protection law published',
      body: '"Tenant Protections" has been published in NY.',
      state_code: 'NY', law_title: 'Tenant Protections', law_key: 'tenant',
      cta_label: 'View law', deep_link: link('stateLaws', { stateCode: 'NY' }),
      created_at: mins(200),
    },
    {
      type: 'lawRepeal', priority: 'high',
      title: 'Gambling Laws repealed',
      body: '"Gambling Laws" has been repealed in UT.',
      state_code: 'UT', law_title: 'Gambling Laws', law_key: 'gambling',
      cta_label: 'View law', deep_link: link('stateLaws', { stateCode: 'UT', lawKey: 'gambling' }),
      created_at: mins(1500),
    },
    {
      type: 'deadlineReminder', priority: 'high',
      title: 'Voter registration closes in 5 days',
      body: 'Register by 2026-06-14 to vote in your state.',
      effective_date: days(5), expires_at: days(5),
      cta_label: 'Learn more', created_at: mins(2000),
    },
    {
      type: 'knowYourRights', priority: 'low',
      title: 'Know your rights',
      body: 'In your state, you may record police interactions in public.',
      cta_label: 'Read more', created_at: mins(3000),
    },
    {
      type: 'weeklyDigest', priority: 'low',
      title: 'Your week in law',
      body: '2 laws changed in California and 1 in your tracked list.',
      cta_label: 'View digest', created_at: mins(5000),
    },
    {
      type: 'securityAlert', priority: 'normal',
      title: 'New sign-in detected',
      body: 'Your account was accessed from a new device.',
      cta_label: 'Review', is_read: true, created_at: mins(8000),
    },
  ].map((n) => ({
    receiver_id: userId,
    sender_id: null,
    is_read: n.is_read || false,
    message: n.body,
    ...n,
  }));
}

(async () => {
  await mongoose.connect(MONGO_URI);
  // Use raw collections to avoid loading mongoose models (their ref chain pulls
  // in a pre-existing model with a broken ref that breaks standalone scripts).
  const users = mongoose.connection.collection('users');
  const notifications = mongoose.connection.collection('notifications');

  const user = await users.findOne({ email });
  if (!user) { console.error(`No user with email ${email}`); process.exit(1); }

  if (CLEAR) {
    const del = await notifications.deleteMany({ receiver_id: user._id });
    console.log(`  cleared ${del.deletedCount} existing notifications`);
  }
  const docs = samples(user._id);
  await notifications.insertMany(docs);
  console.log(`  inserted ${docs.length} test notifications for ${user.email}`);
  await mongoose.disconnect();
  console.log('done — open the app notification screen to view');
})().catch((e) => { console.error(e); process.exit(1); });
