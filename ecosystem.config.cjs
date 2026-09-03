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
      },
    },
  ],
};
