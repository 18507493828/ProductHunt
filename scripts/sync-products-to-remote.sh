#!/usr/bin/env bash
# 已禁用：本地与远程数据库永久分离，禁止把本地数据覆盖到远程。
#
# 远程数据请只在远程手动备份 / 恢复：
#   ./scripts/backup-mysql.sh
#   ./scripts/restore-mysql-backup.sh   # 仅在同一环境（远程）内恢复
#
# 不要使用本脚本，也不要手动 mysqldump 本地后导入远程。

set -euo pipefail

cat >&2 <<'EOF'
拒绝执行：本地 → 远程 数据库同步已永久关闭。

原因：本地与远程数据永远分离，避免用户上传（如 Smile1019 的应用）被本地样例覆盖。

如需备份远程（手动）：
  ssh 到服务器后执行
  cd /www/wwwroot/ProductHunt && ./scripts/backup-mysql.sh

如需在远程恢复：
  ./scripts/restore-mysql-backup.sh backups/mysql/latest.sql.gz
EOF
exit 1
