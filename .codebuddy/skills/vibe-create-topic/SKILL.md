---
name: vibe-create-topic
description: >-
  通过对话为码上创（ProductHunt / vibe-building）远程运营后台创建「构建场景话题」。
  Use when the user wants to add build scene topics, 创建话题, 运营话题,
  WorkBuddy 对话建话题, or operate remote VIBE_BASE_URL / 159.75.116.187 build-config.
allowed-tools: Bash, Read, Write
---

# 码上创 · 远程对话创建构建话题

在 **WorkBuddy 对话**里帮用户设计并写入远程站点的「我要构建」场景话题（`build-config.scenes[].topics`）。

## 远程地址（默认）

| 变量 | 默认 | 说明 |
|------|------|------|
| `VIBE_BASE_URL` | `http://159.75.116.187` | 远程站点根地址（不要带尾斜杠） |
| `VIBE_ADMIN_USER` | `admin` | 运营管理员 |
| `VIBE_ADMIN_PASSWORD` | `admin123456` | 运营密码；用户另给则以用户为准 |

脚本目录：`${CODEBUDDY_SKILL_DIR}/scripts`（Cursor 下同路径相对本 Skill）。

用户如果说「用本地」，临时设：

```bash
export VIBE_BASE_URL=http://127.0.0.1:3001
```

## 对话工作流（必须遵守）

1. **先拉清单**：执行 `list`，告诉用户现有场景与话题，避免重名。
2. **对话澄清**（缺什么问什么，一次问清）：
   - 挂到哪个场景？（校园 / 社交 / 公益 / 健身 / 户外，或 id）
   - 话题名称（可多个；短、可落地、偏「能做出一个小应用」）
   - 是否立刻写入远程？（默认先给候选，用户确认后再写）
3. **起名规范**：
   - 6～16 字为宜；名词/动宾短语；避免空泛词（「AI 助手」「管理系统」）
   - 同场景不重复；与已有话题语义明显重复时主动提示
4. **确认后写入**：调用 `add`（可一次多个）。
5. **回执**：场景名、新增列表、跳过列表、远程地址。

禁止：未确认就写远程；编造不存在的场景；用社区 `/api/topics`（那是另一套内容话题，不是构建场景话题）。

## 命令

```bash
# 查看远程场景 + 话题
node "${CODEBUDDY_SKILL_DIR}/scripts/add-topic.mjs" list

# 追加一个
node "${CODEBUDDY_SKILL_DIR}/scripts/add-topic.mjs" add \
  --scene campus --topic "校园自习搭子"

# 追加多个（中英文逗号均可）
node "${CODEBUDDY_SKILL_DIR}/scripts/add-topic.mjs" add \
  --scene 校园 --topics "校园跑腿互助,宿舍垃圾分类打卡"

# 只预览不写
node "${CODEBUDDY_SKILL_DIR}/scripts/add-topic.mjs" add \
  --scene social --topic "周末饭搭子" --dry-run
```

Cursor / 非 CodeBuddy 环境若无 `${CODEBUDDY_SKILL_DIR}`，改用本文件所在目录下的 `scripts/add-topic.mjs` 绝对路径。

## 示例对话

**用户**：给校园加两个话题，远程那个站

**助手**：
1. `list` 看校园现有话题
2. 提议：`校园自习搭子`、`宿舍快递代取`
3. 用户说「写」→ `add --scene campus --topics "校园自习搭子,宿舍快递代取"`
4. 回报写入结果

## API 要点

- 读公开：`GET {BASE}/api/build-config`
- 读完整 / 写：`GET|PUT {BASE}/api/admin/build-config`（需 admin Bearer）
- 登录：`POST {BASE}/api/auth/login` → `{ username, password }` → `token`
- PUT body 必须带完整 `scenes` + `tools`（脚本已处理）
- 话题对象：`{ id:"", name, enabled:true, sort }`

细节见 [reference.md](reference.md)。
