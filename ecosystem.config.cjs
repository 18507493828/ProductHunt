module.exports = {
  apps: [
    {
      name: "vibe-building",
      script: "server/index.js",
      cwd: __dirname,
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
      },
    },
  ],
};
