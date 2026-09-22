#!/usr/bin/env bash
# 从备份恢复远程/本机库。默认用 latest.sql.gz；可传具体文件。
#
#   ./scripts/restore-mysql-backup.sh
#   ./scripts/restore-mysql-backup.sh backups/mysql/vibebuilding-20260922-180000.sql.gz
#
# 警告：会覆盖当前 MYSQL_DATABASE 的全部表数据。

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
MYSQL_PORT="${MYSQL_PORT:-3306}"
MYSQL_USER="${MYSQL_USER:-vibeBuilding}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-csdn@@1234!}"
MYSQL_DATABASE="${MYSQL_DATABASE:-vibebuilding}"

FILE="${1:-$ROOT/backups/mysql/latest.sql.gz}"

if [ ! -f "$FILE" ]; then
  echo "找不到备份文件: $FILE" >&2
  exit 1
fi

echo "即将用以下文件覆盖库 ${MYSQL_DATABASE}:"
echo "  $FILE"
read -r -p "确认恢复？输入 yes 继续: " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "已取消"
  exit 1
fi

export MYSQL_PWD="$MYSQL_PASSWORD"

if [[ "$FILE" == *.gz ]]; then
  gzip -dc "$FILE" | mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" \
    --max_allowed_packet=64M "$MYSQL_DATABASE"
else
  mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" \
    --max_allowed_packet=64M "$MYSQL_DATABASE" < "$FILE"
fi

echo "恢复完成。建议：pm2 restart vibe-building"
