/* eslint-disable */
/**
 * Seed script — creates an admin user.
 * Run from the lawyer_backend directory:
 *   node seed-admin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGO_URI = process.env.MONGO_DB_URI || 'mongodb://localhost:27017/lawyerup';

// Hardcoded admin role ID used throughout the codebase
const ADMIN_ROLE_ID = '620504e9f47dd88dfc51e183';

const ADMIN_EMAIL    = 'admin@yopmail.com';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Test@123';

// ── Minimal schemas (no ES-module imports needed) ───────────────────────────

const roleSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  is_deleted: { type: Boolean, default: false },
  created_at: Date,
  updated_at: Date,
});
const Role = mongoose.model('roles', roleSchema);

const userSchema = new mongoose.Schema(
  {
    role_id:                { type: mongoose.Schema.Types.ObjectId, ref: 'roles', required: true },
    login_type:             { type: String, default: 'Manual' },
    first_name:             String,
    last_name:              String,
    username:               { type: String, required: true },
    email:                  String,
    password:               { type: String, required: true },
    otp:                    String,
    is_otp_verified:        { type: Boolean, default: false },
    is_receive_notification:{ type: Boolean, default: false },
    is_enable_notification: { type: Boolean, default: false },
    status:                 { type: String, default: 'active' },
    enabled_2fa:            { type: Boolean, default: false },
    secret_2fa:             { type: String, default: '' },
    is_deleted:             { type: Boolean, default: false },
  },
  { timestamps: true }
);
const User = mongoose.model('users', userSchema);

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Connecting to MongoDB:', MONGO_URI);
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected.\n');

  // 1. Ensure the admin role exists with the exact ID the codebase expects
  let role = await Role.findById(ADMIN_ROLE_ID);
  if (!role) {
    role = await Role.create({
      _id: new mongoose.Types.ObjectId(ADMIN_ROLE_ID),
      name: 'Admin',
      created_at: new Date(),
      updated_at: new Date(),
    });
    console.log('✓ Created admin role:', role._id.toString());
  } else {
    console.log('✓ Admin role already exists:', role._id.toString());
  }

  // 2. Upsert the admin user
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const existing = await User.findOne({ email: ADMIN_EMAIL });

  if (existing) {
    existing.password        = hash;
    existing.role_id         = ADMIN_ROLE_ID;
    existing.is_otp_verified = true;
    existing.status          = 'active';
    existing.is_deleted      = false;
    await existing.save();
    console.log('✓ Updated existing user:', ADMIN_EMAIL);
  } else {
    await User.create({
      role_id:                ADMIN_ROLE_ID,
      first_name:             'Admin',
      last_name:              'User',
      username:               ADMIN_USERNAME,
      email:                  ADMIN_EMAIL,
      password:               hash,
      is_otp_verified:        true,
      status:                 'active',
      enabled_2fa:            false,
      secret_2fa:             '',
      is_receive_notification:false,
      is_enable_notification: false,
    });
    console.log('✓ Created admin user:', ADMIN_EMAIL);
  }

  console.log('\nDone! You can now log in with:');
  console.log('  Email   :', ADMIN_EMAIL);
  console.log('  Password:', ADMIN_PASSWORD);

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
