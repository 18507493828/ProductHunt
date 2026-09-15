#!/usr/bin/env bash
# 将本地 vibebuilding 的产品相关表覆盖同步到远程。
# 用法：
#   ./scripts/sync-products-to-remote.sh
#   REMOTE=ubuntu@159.75.116.187 ./scripts/sync-products-to-remote.sh
#
# 依赖：本机 mysql/mysqldump、ssh/scp；远程已装 mysql 客户端。

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REMOTE="${REMOTE:-ubuntu@159.75.116.187}"
LOCAL_HOST="${LOCAL_HOST:-127.0.0.1}"
LOCAL_USER="${LOCAL_USER:-vibeBuilding}"
LOCAL_PASS="${LOCAL_PASS:-csdn@@1234!}"
LOCAL_DB="${LOCAL_DB:-vibebuilding}"

REMOTE_MYSQL_USER="${REMOTE_MYSQL_USER:-vibeBuilding}"
REMOTE_MYSQL_PASS="${REMOTE_MYSQL_PASS:-csdn@@1234!}"
REMOTE_DB="${REMOTE_DB:-vibebuilding}"
REMOTE_APP="${REMOTE_APP:-/www/wwwroot/ProductHunt}"

DUMP="$ROOT/scripts/sync-products-from-local.sql"
# uploads：封面图二进制（imageUrl=/api/uploads/xxx），不同步会导致远程图片 404
TABLES=(
  products
  product_categories
  product_topics
  product_ratings
  product_comments
  uploads
)

echo "==> 1/4 导出本地 ${LOCAL_DB}（${TABLES[*]}）"
mysqldump -h"$LOCAL_HOST" -u"$LOCAL_USER" -p"$LOCAL_PASS" \
  --lock-tables=false --no-tablespaces --set-gtid-purged=OFF \
  --complete-insert --hex-blob --skip-triggers \
  --max-allowed-packet=64M \
  "$LOCAL_DB" "${TABLES[@]}" > "$DUMP"
ls -lh "$DUMP"

echo "==> 2/4 上传到 ${REMOTE}:/tmp/"
scp "$DUMP" "${REMOTE}:/tmp/sync-products-from-local.sql"

echo "==> 3/4 远程导入，并挪走旧 JSON（防止启动回填脏数据）"
ssh "$REMOTE" bash -s <<EOF
set -euo pipefail
mysql -h127.0.0.1 -u'${REMOTE_MYSQL_USER}' -p'${REMOTE_MYSQL_PASS}' \
  --max_allowed_packet=64M '${REMOTE_DB}' \
  < /tmp/sync-products-from-local.sql

STORAGE="${REMOTE_APP}/server/storage"
if [ -d "\$STORAGE/products" ]; then
  stamp=\$(date +%Y%m%d%H%M%S)
  mv "\$STORAGE/products" "\$STORAGE/products.bak.\$stamp"
  mkdir -p "\$STORAGE/products"
  echo "moved old JSON -> products.bak.\$stamp"
fi

mysql -h127.0.0.1 -u'${REMOTE_MYSQL_USER}' -p'${REMOTE_MYSQL_PASS}' '${REMOTE_DB}' -e \
  "SELECT COUNT(*) AS products FROM products;
   SELECT COUNT(*) AS cats FROM product_categories;
   SELECT COUNT(*) AS topics FROM product_topics;
   SELECT COUNT(*) AS uploads FROM uploads;"
EOF

echo "==> 4/4 重启远程服务（让进程读到新库；JSON 已挪走不会回填）"
ssh "$REMOTE" "cd '${REMOTE_APP}' && (pm2 restart vibe-building || true) && pm2 list | head -20"

echo "完成：本地产品表已覆盖到远程 ${REMOTE}"
