# Product Hunt · 发现好作品

React 前端 + Node.js 后端的产品发现社区，Product Hunt 风格：提交产品、投票、冲榜。

## 功能

- 产品提交：名称、一句话介绍、产品链接、分类、详细介绍
- 投票：登录用户一人一票，可取消
- 榜单：今日 / 周榜 / 月榜 / 总榜，按票数排序
- 热门 TOP 5：当前榜单前 5 名
- 分类筛选：AI 工具、开发工具、开源项目、效率办公、设计创意、学习教育、生活娱乐、企业服务、硬件设备、其他
- 审核流：普通用户提交需管理员审核，管理员提交直接上架
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

- 产品：`server/storage/products/<id>.json`（每条产品一个 JSON 文件）
- 用户：`server/storage/users.json`（bcrypt 密码哈希 + JWT 鉴权）

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| PORT | 服务端口 | 3001 |
| HOST | 监听地址 | 0.0.0.0 |
| JWT_SECRET | JWT 签名密钥 | 开发默认值（生产必改） |
| ADMIN_USERNAME | 初始管理员用户名 | admin |
| ADMIN_PASSWORD | 初始管理员密码 | admin123456 |
