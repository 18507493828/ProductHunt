const path = require("path");

module.exports = {
  apps: [
    {
      name: "vibe-building",
      script: "index.js",
      cwd: path.join(__dirname, "server"),
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        HOST: "0.0.0.0",
        JWT_SECRET: "change-this-to-a-long-random-string",
        ADMIN_USERNAME: "admin",
        ADMIN_PASSWORD: "change-this-admin-password",
        // 与 Navicat / mysql -u vibeBuilding 保持一致；库名 Linux 上多为小写 vibebuilding
        MYSQL_HOST: "127.0.0.1",
        MYSQL_PORT: 3306,
        MYSQL_USER: "vibeBuilding",
        MYSQL_PASSWORD: "csdn@@1234!",
        MYSQL_DATABASE: "vibebuilding",
        // 启动时自动 upsert 样例应用名称 + /apps/ 落地页；若要清空远程旧产品再写入：SEED_SCENES_REPLACE=1
        SEED_SCENES_REPLACE: "0",
      },
    },
  ],
};
