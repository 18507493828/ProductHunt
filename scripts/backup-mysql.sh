#!/usr/bin/env bash
# 远程 / 本机 MySQL 全库备份：有变更才落盘，并保留最近 N 份。
# 仅手动执行，不装 cron。
#
# 用法（在服务器上）：
#   cd /www/wwwroot/ProductHunt
#   ./scripts/backup-mysql.sh
#
# 环境变量（可覆盖）：
#   MYSQL_HOST MYSQL_PORT MYSQL_USER MYSQL_PASSWORD MYSQL_DATABASE
#   BACKUP_DIR          默认 /www/wwwroot/ProductHunt/backups/mysql
#   BACKUP_KEEP         保留份数，默认 30
#   BACKUP_FORCE=1      即使内容未变也强制再存一份

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
MYSQL_PORT="${MYSQL_PORT:-3306}"
MYSQL_USER="${MYSQL_USER:-vibeBuilding}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-csdn@@1234!}"
MYSQL_DATABASE="${MYSQL_DATABASE:-vibebuilding}"

BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups/mysql}"
BACKUP_KEEP="${BACKUP_KEEP:-30}"
BACKUP_FORCE="${BACKUP_FORCE:-0}"

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
TMP_SQL="$(mktemp "$BACKUP_DIR/.tmp-XXXXXX.sql")"
LATEST_GZ="$BACKUP_DIR/latest.sql.gz"
OUT_GZ="$BACKUP_DIR/${MYSQL_DATABASE}-${STAMP}.sql.gz"
LOG="$BACKUP_DIR/backup.log"

cleanup() {
  rm -f "$TMP_SQL"
}
trap cleanup EXIT

export MYSQL_PWD="$MYSQL_PASSWORD"

mysqldump \
  -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" \
  --single-transaction \
  --routines --triggers \
  --hex-blob \
  --set-gtid-purged=OFF \
  --no-tablespaces \
  --skip-dump-date \
  --max-allowed-packet=64M \
  "$MYSQL_DATABASE" > "$TMP_SQL"

# 去掉 dump 时间行后再比哈希，避免「库没变也每次新建备份」
hash_sql() {
  # shellcheck disable=SC2002
  cat "$1" | grep -vE '^-- Dump completed on |^-- MySQL dump [0-9]|^-- Host: |^-- Server version' \
    | openssl dgst -sha256 | awk '{print $2}'
}

NEW_HASH="$(hash_sql "$TMP_SQL")"
OLD_HASH=""
if [ -f "$LATEST_GZ" ]; then
  OLD_TMP="$(mktemp "$BACKUP_DIR/.old-XXXXXX.sql")"
  gzip -dc "$LATEST_GZ" > "$OLD_TMP" 2>/dev/null || true
  if [ -s "$OLD_TMP" ]; then
    OLD_HASH="$(hash_sql "$OLD_TMP")"
  fi
  rm -f "$OLD_TMP"
fi

if [ "$BACKUP_FORCE" != "1" ] && [ -n "$OLD_HASH" ] && [ "$NEW_HASH" = "$OLD_HASH" ]; then
  echo "$(date '+%F %T') unchanged sha256=$NEW_HASH" | tee -a "$LOG"
  exit 0
fi

gzip -c "$TMP_SQL" > "$OUT_GZ"
# 原子更新 latest：先写临时再 mv
cp -f "$OUT_GZ" "${LATEST_GZ}.tmp"
mv -f "${LATEST_GZ}.tmp" "$LATEST_GZ"

SIZE="$(ls -lh "$OUT_GZ" | awk '{print $5}')"
echo "$(date '+%F %T') saved $OUT_GZ ($SIZE) sha256=$NEW_HASH" | tee -a "$LOG"

# 只保留带时间戳的包，latest 不计入
ls -1t "$BACKUP_DIR"/"${MYSQL_DATABASE}"-*.sql.gz 2>/dev/null \
  | awk -v keep="$BACKUP_KEEP" 'NR > keep' \
  | while read -r f; do
      [ -n "$f" ] || continue
      rm -f "$f"
      echo "$(date '+%F %T') pruned $f" | tee -a "$LOG"
    done
