# Vibe Building · Agent 生态社区

React 前端 + Node.js 后端的 Agent 生态资源社区：上传专家、技能、链接器、模版等各类资源，社区评分、冲榜互动。

## 功能

- 资源上传：名称、一句话介绍、演示链接、分类、详细介绍
- 评分：登录用户可为资源打分
- 榜单：今日 / 周榜 / 月榜 / 总榜，按热度排序
- 热门 TOP 10：当前榜单前列资源
- 分类筛选：Agent / 专家、技能、链接器 / 集成、自动化模版、Prompt / 指令、MCP / 工具、插件 / 扩展、开源项目、其他
- 审核流：普通用户上传需管理员审核，管理员上传直接上架
- 管理后台：待审核 / 已上架 / 已拒绝 / 全部，支持通过、拒绝（带原因）、删除

## 本地开发

```bash
cd /Users/csdn/skill-store-main
npm run install:all
npm run dev
```

- 前端：http://localhost:5173
- 后端：http://localhost:3001/api/health

## 生产部署

```bash
npm run install:all
npm run build
npm start
```

生产模式下前端构建产物由后端托管，默认监听 **3001** 端口（可用 PORT 环境变量覆盖）。

### PM2 守护进程部署

```bash
sudo npm install -g pm2
cd /Users/csdn/skill-store-main
npm run install:all
npm run build
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

也可使用一键部署脚本：

```bash
bash scripts/deploy.sh
```

### Nginx 反向代理（可选）

将 `scripts/nginx-product-hunt.conf` 中的 `your-domain.com` 替换为实际域名后：

```bash
sudo cp scripts/nginx-product-hunt.conf /etc/nginx/sites-available/product-hunt
sudo ln -sf /etc/nginx/sites-available/product-hunt /etc/nginx/sites-enabled/product-hunt
sudo nginx -t
sudo systemctl reload nginx
```

## 数据存储

- 资源：`server/storage/products/<id>.json`（每条资源一个 JSON 文件，**不提交 git**）
- 用户：`server/storage/users.json`（**不提交 git**）
- 话题：`server/storage/topics.json`（种子数据，**需提交 git**）
- 话题内容：`server/storage/topic-posts/*.json`（种子数据，**需提交 git**）
- 轮播 / 导航：`server/storage/banners.json`、`server/storage/navs.json`（**需提交 git**）
- 上传图片：`server/storage/uploads/`（运行时生成，**不提交 git**）

首次启动或远程 `topics.json` 为空时，服务端会从 `server/topic-seed.js` 自动写入话题种子数据。

## 环境变量

| 变量           | 说明             | 默认值                 |
| -------------- | ---------------- | ---------------------- |
| PORT           | 服务端口         | 3001                   |
| HOST           | 监听地址         | 0.0.0.0                |
| JWT_SECRET     | JWT 签名密钥     | 开发默认值（生产必改） |
| ADMIN_USERNAME | 初始管理员用户名 | admin                  |
| ADMIN_PASSWORD | 初始管理员密码   | admin123456            |

## 远程部署

cd /www/wwwroot/ProductHunt/client && npm ci && npm run build
cd .. && pm2 reload ecosystem.config.cjs
