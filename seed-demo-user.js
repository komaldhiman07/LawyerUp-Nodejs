/* eslint-disable */
/**
 * Seed script — creates a demo app user with subscribed law categories and a device.
 * Run from the lawyer_backend directory:
 *   node seed-demo-user.js
 *
 * To reset and re-create:
 *   node seed-demo-user.js --force
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGO_URI = process.env.MONGO_DB_URI || 'mongodb://localhost:27017/lawyerup';
const FORCE     = process.argv.includes('--force');

// Role IDs from roles.js seed
const USER_ROLE_ID = '620ca6da33032d8eb3c3b236';

const DEMO_USER = {
  email:      'demo@yopmail.com',
  password:   'Test@123',
  first_name: 'Jane',
  last_name:  'Demo',
  username:   'jane.demo',
  state:      'California',
  city:       'Los Angeles',
};

// ── Minimal inline schemas ────────────────────────────────────────────────────

const userSchema = new mongoose.Schema(
  {
    role_id:                 { type: mongoose.Schema.Types.ObjectId, required: true },
    login_type:              { type: String, default: 'Manual' },
    first_name:              String,
    last_name:               String,
    username:                { type: String, required: true },
    email:                   String,
    password:                { type: String, required: true },
    state:                   String,
    city:                    String,
    is_otp_verified:         { type: Boolean, default: true },
    is_receive_notification: { type: Boolean, default: true },
    is_enable_notification:  { type: Boolean, default: true },
    status:                  { type: String, default: 'active' },
    is_deleted:              { type: Boolean, default: false },
  },
  { timestamps: true }
);
const User = mongoose.model('users', userSchema);

const categorySchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    name:    { type: String, required: true },
    city:    String,
    state:   String,
    laws:    [{ law_id: String, color: String }],
    active:  { type: Boolean, default: true },
  },
  { timestamps: true }
);
const UserCategoryLaws = mongoose.model('userCategoryLaws', categorySchema);

const deviceSchema = new mongoose.Schema({
  device_id:    { type: String, required: true },
  device_type:  { type: String, required: true },
  device_token: { type: String, required: true },
  user_id:      { type: mongoose.Schema.Types.ObjectId, required: true },
  is_deleted:   { type: Boolean, default: false },
  created_at:   Date,
  updated_at:   Date,
});
const Device = mongoose.model('device', deviceSchema);

const lawMasterSchema = new mongoose.Schema(
  {
    law_key:    String,
    title:      String,
    is_deleted: Boolean,
    is_active:  Boolean,
  },
  { strict: false }
);
const LawMaster = mongoose.model('lawmasters', lawMasterSchema);

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Connecting to MongoDB:', MONGO_URI);
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected.\n');

  // Check if demo user already exists
  const existing = await User.findOne({ email: DEMO_USER.email });

  if (existing && !FORCE) {
    console.log('✓ Demo user already exists:', DEMO_USER.email);
    console.log('  Use --force to recreate.');
    await mongoose.disconnect();
    return;
  }

  // Remove old data if --force or creating fresh
  if (existing) {
    console.log('⚠ --force: removing existing demo user and linked data…');
    await UserCategoryLaws.deleteMany({ user_id: existing._id });
    await Device.deleteMany({ user_id: existing._id });
    await User.deleteOne({ _id: existing._id });
  }

  // 1. Create demo user
  const hash = await bcrypt.hash(DEMO_USER.password, 10);
  const user = await User.create({
    role_id:                 USER_ROLE_ID,
    login_type:              'Manual',
    first_name:              DEMO_USER.first_name,
    last_name:               DEMO_USER.last_name,
    username:                DEMO_USER.username,
    email:                   DEMO_USER.email,
    password:                hash,
    state:                   DEMO_USER.state,
    city:                    DEMO_USER.city,
    is_otp_verified:         true,
    is_receive_notification: true,
    is_enable_notification:  true,
    status:                  'active',
  });
  console.log('✓ Created demo user:', user.email, '(ID:', user._id.toString() + ')');

  // 2. Fetch law master IDs to attach to categories
  const lawMasters = await LawMaster.find({ is_deleted: { $ne: true } }).lean();
  const lawMap = {};
  lawMasters.forEach(lm => { lawMap[lm.law_key] = lm._id.toString(); });

  // 3. Create subscribed law categories
  const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

  const categories = [
    {
      name:  'Marijuana Laws',
      state: DEMO_USER.state,
      city:  DEMO_USER.city,
      laws:  lawMap['marijuana'] ? [{ law_id: lawMap['marijuana'], color: COLORS[0] }] : [],
    },
    {
      name:  'Gun & Firearm Laws',
      state: DEMO_USER.state,
      city:  DEMO_USER.city,
      laws:  lawMap['guns'] ? [{ law_id: lawMap['guns'], color: COLORS[1] }] : [],
    },
    {
      name:  'Gambling Laws',
      state: DEMO_USER.state,
      laws:  lawMap['gambling'] ? [{ law_id: lawMap['gambling'], color: COLORS[2] }] : [],
    },
  ];

  const createdCategories = await UserCategoryLaws.insertMany(
    categories.map(cat => ({ ...cat, user_id: user._id, active: true }))
  );
  console.log('✓ Created', createdCategories.length, 'subscribed categories:',
    createdCategories.map(c => c.name).join(', '));

  // 4. Create a demo device entry (simulates a registered phone)
  await Device.create({
    user_id:      user._id,
    device_id:    'demo-device-001',
    device_type:  'android',
    device_token: 'demo-fcm-token-not-real',
    is_deleted:   false,
    created_at:   new Date(),
    updated_at:   new Date(),
  });
  console.log('✓ Created demo device entry');

  console.log('\n── Demo user credentials ────────────────────');
  console.log('  Email   :', DEMO_USER.email);
  console.log('  Password:', DEMO_USER.password);
  console.log('  State   :', DEMO_USER.state);
  console.log('  City    :', DEMO_USER.city);
  console.log('─────────────────────────────────────────────');

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
