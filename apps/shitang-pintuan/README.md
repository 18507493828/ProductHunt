# 食堂拼团王

校园食堂 / 周边餐厅凑单拼团 H5 应用（单页，手机优先，PC 居中展示）。

## 本地访问

- 开发（需后端已启动）：http://localhost:3001/apps/shitang-pintuan/
- 经 Vite 代理：http://localhost:5173/apps/shitang-pintuan/

## 线上访问

与主站一并部署。后端会挂载仓库根目录 `apps/` 为静态资源，生产地址形如：

`https://你的域名/apps/shitang-pintuan/`

Docker 构建已包含 `apps/` 目录；`npm run deploy` / `scripts/deploy.sh` 部署整仓时也会带上。

## 文件

- `index.html` — 完整可交互单页应用
