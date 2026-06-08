#!/usr/bin/env bash
# =============================================================================
# SEC-01: MongoDB Authentication Setup Script
# =============================================================================
# Run this ONCE on the server that hosts MongoDB to enable authentication.
#
# Usage:
#   chmod +x scripts/setup-mongodb-auth.sh
#   sudo ./scripts/setup-mongodb-auth.sh
#
# What it does:
#   1. Creates the lawyerup_app database user with readWrite on lawyerup DB
#   2. Creates a separate read-only monitoring user
#   3. Installs the hardened mongod.conf (binds to 127.0.0.1, enables auth)
#   4. Restarts mongod
#   5. Verifies the connection with the new credentials
#
# After running this script:
#   - Update your .env: MONGO_DB_URI=mongodb://lawyerup_app:<password>@127.0.0.1:27017/lawyerup?authSource=admin
#   - Delete this script or restrict its permissions (it contains a temp password prompt)
# =============================================================================

set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()    { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ── Pre-flight checks ─────────────────────────────────────────────────────────
[[ $EUID -eq 0 ]] || error "Please run as root (sudo $0)"
command -v mongosh &>/dev/null || command -v mongo &>/dev/null \
  || error "mongosh / mongo CLI not found. Install MongoDB tools first."

MONGO_CLI=$(command -v mongosh 2>/dev/null || command -v mongo)
info "Using mongo CLI: $MONGO_CLI"

# ── Prompt for passwords ──────────────────────────────────────────────────────
echo ""
echo "Enter a strong password for the application user (lawyerup_app):"
read -r -s APP_PASSWORD
[[ ${#APP_PASSWORD} -ge 12 ]] || error "Password must be at least 12 characters."

echo "Enter a strong password for the monitoring user (lawyerup_monitor):"
read -r -s MONITOR_PASSWORD
[[ ${#MONITOR_PASSWORD} -ge 12 ]] || error "Password must be at least 12 characters."
echo ""

# ── Step 1: Create users (auth is OFF at this point — run before enabling) ───
info "Creating MongoDB users..."

$MONGO_CLI --quiet admin --eval "
  // Drop users if they already exist (idempotent re-run)
  try { db.dropUser('lawyerup_app'); } catch(e) {}
  try { db.dropUser('lawyerup_monitor'); } catch(e) {}

  db.createUser({
    user: 'lawyerup_app',
    pwd:  '$APP_PASSWORD',
    roles: [
      { role: 'readWrite', db: 'lawyerup' }
    ],
    passwordDigestor: 'server'
  });

  db.createUser({
    user: 'lawyerup_monitor',
    pwd:  '$MONITOR_PASSWORD',
    roles: [
      { role: 'clusterMonitor',  db: 'admin'    },
      { role: 'read',            db: 'lawyerup' }
    ],
    passwordDigestor: 'server'
  });

  print('Users created successfully.');
" || error "Failed to create MongoDB users. Is mongod running without auth?"

info "Users created."

# ── Step 2: Install hardened mongod.conf ──────────────────────────────────────
CONF_SRC="$(dirname "$0")/../config/mongod.conf"
CONF_DEST="/etc/mongod.conf"

if [[ -f "$CONF_SRC" ]]; then
  info "Installing mongod.conf from $CONF_SRC → $CONF_DEST"
  cp "$CONF_DEST" "${CONF_DEST}.bak.$(date +%Y%m%d%H%M%S)" && info "Backed up original config."
  cp "$CONF_SRC" "$CONF_DEST"
else
  warn "config/mongod.conf not found — writing minimal hardened config directly."
  cat > "$CONF_DEST" <<'MONGODCONF'
# Hardened mongod.conf — managed by setup-mongodb-auth.sh
net:
  port: 27017
  bindIp: 127.0.0.1        # localhost only — NEVER 0.0.0.0 in production

storage:
  dbPath: /var/lib/mongodb
  wiredTiger:
    engineConfig:
      cacheSizeGB: 1.5
      journalCompressor: snappy
    collectionConfig:
      blockCompressor: snappy
    indexConfig:
      prefixCompression: true

security:
  authorization: enabled   # SEC-01: enforce authentication

operationProfiling:
  mode: slowOp
  slowOpThresholdMs: 100   # M-01: log slow queries

systemLog:
  destination: file
  path: /var/log/mongodb/mongod.log
  logAppend: true

processManagement:
  timeZoneInfo: /usr/share/zoneinfo
MONGODCONF
fi

# ── Step 3: Restart mongod ────────────────────────────────────────────────────
info "Restarting mongod..."
if systemctl is-active --quiet mongod; then
  systemctl restart mongod
  sleep 3
  systemctl is-active --quiet mongod && info "mongod restarted successfully." \
    || error "mongod failed to restart. Check: journalctl -u mongod -n 50"
else
  warn "mongod service not found via systemctl. Restart it manually."
fi

# ── Step 4: Verify the connection with new credentials ───────────────────────
info "Verifying authenticated connection..."
$MONGO_CLI --quiet \
  "mongodb://lawyerup_app:${APP_PASSWORD}@127.0.0.1:27017/lawyerup?authSource=admin" \
  --eval "db.runCommand({ ping: 1 })" \
  | grep -q '"ok"' \
  && info "Connection verified successfully." \
  || error "Authentication test failed. Check credentials and mongod.conf."

# ── Step 5: Print next steps ──────────────────────────────────────────────────
echo ""
echo -e "${GREEN}============================================================${NC}"
echo -e "${GREEN}  MongoDB authentication is now ENABLED.${NC}"
echo -e "${GREEN}============================================================${NC}"
echo ""
echo "Next steps:"
echo ""
echo "  1. Update your server .env file:"
echo "     MONGO_DB_URI=mongodb://lawyerup_app:${APP_PASSWORD}@127.0.0.1:27017/lawyerup?authSource=admin"
echo ""
echo "  2. Update monitoring tooling (Prometheus exporter etc.) with:"
echo "     mongodb://lawyerup_monitor:${MONITOR_PASSWORD}@127.0.0.1:27017/admin"
echo ""
echo "  3. Restart the Node.js application."
echo ""
warn "Store these passwords in a secrets manager (e.g. AWS Secrets Manager, Vault)."
warn "Do NOT commit passwords to git."
