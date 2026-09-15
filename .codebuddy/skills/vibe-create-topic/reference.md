# vibe-create-topic · API 参考

## Base URL

默认远程：`http://159.75.116.187`（Nginx 反代到 Node `3001`）。

覆盖：`export VIBE_BASE_URL=https://your-domain.example`

## 鉴权

```http
POST /api/auth/login
Content-Type: application/json

{"username":"admin","password":"admin123456"}
```

响应含 `token`。后续：

```http
Authorization: Bearer <token>
```

仅 `role=admin` 可写 `build-config`。

## 构建配置

```http
GET  /api/build-config          # 公开，仅启用中的场景/话题/工具
GET  /api/admin/build-config    # 完整配置
PUT  /api/admin/build-config    # 整包覆盖 scenes + tools
```

PUT 示例：

```json
{
  "scenes": [
    {
      "id": "campus",
      "emoji": "🎓",
      "name": "校园",
      "enabled": true,
      "sort": 1,
      "topics": [
        { "id": "", "name": "校园二手书买卖", "enabled": true, "sort": 1 }
      ]
    }
  ],
  "tools": []
}
```

写入时 **必须回传现有 `tools`**，否则可能被空数组覆盖。脚本会先 GET 再合并 PUT。

## 与「社区话题」的区别

| 类型 | 路径 | 用途 |
|------|------|------|
| 构建场景话题 | `build-config.scenes[].topics` | 「我要构建」选场景后的选题 |
| 社区话题 | `/api/topics` | 广场话题帖，不是本 Skill 范围 |

## 场景 id 速查（默认）

| id | 名称 |
|----|------|
| campus | 校园 |
| social | 社交 |
| charity | 公益 |
| fitness | 健身 |
| outdoor | 户外 |

远程可能增减；以 `list` 为准。
