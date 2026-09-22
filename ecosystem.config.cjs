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
        // 对外访问根地址（落地页 /apps/... 用这个域名，不要用 IP）
        PUBLIC_BASE_URL: "https://vb.csdn.net",
        VIBE_BASE_URL: "https://vb.csdn.net",
        // 启动时 upsert 样例名称/落地页；禁止设为 1（会清空远程用户上传）
        // 本地与远程数据库永久分离，不要用本地 dump 覆盖远程
        SEED_SCENES_REPLACE: "0",
      },
    },
  ],
};
