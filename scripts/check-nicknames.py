#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""检查账号清单里的昵称在 vb.csdn.net 线上是否已被占用。

公开接口拿不到完整用户表，只能用管理员接口 /api/admin/users?q= 精确查。
两种用法：

  1) 用管理员账号密码（脚本自己换 token）
     VIBE_ADMIN_USER=admin VIBE_ADMIN_PASSWORD=xxx \
       python3 scripts/check-nicknames.py [账号文件]

  2) 已有 token（浏览器登录管理员后从 localStorage / 请求头取）
     VIBE_TOKEN=eyJhbGci... python3 scripts/check-nicknames.py [账号文件]

不传账号文件时默认读 桌面/CSDN工作相关文件/账号清单-50个.txt。
只读操作：只查不改，不会注册、不会修改任何用户。
"""
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE = os.environ.get("VIBE_BASE", "https://vb.csdn.net")
DEFAULT_SRC = "/Users/lidiwen/Desktop/CSDN工作相关文件/账号清单-50个.txt"
SRC = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SRC

opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def call(path, payload=None, token=None, method=None):
    headers = {"User-Agent": "Mozilla/5.0"}
    data = None
    if payload is not None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(
        BASE + path, data=data, headers=headers, method=method or ("POST" if data else "GET")
    )
    try:
        with opener.open(req, timeout=25) as r:
            return r.status, json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"raw": body}


def get_token():
    token = os.environ.get("VIBE_TOKEN", "").strip()
    if token:
        return token
    user = os.environ.get("VIBE_ADMIN_USER", "").strip()
    pwd = os.environ.get("VIBE_ADMIN_PASSWORD", "")
    if not user or not pwd:
        sys.exit(
            "缺少凭据：设置 VIBE_TOKEN，或同时设置 VIBE_ADMIN_USER 与 VIBE_ADMIN_PASSWORD"
        )
    status, body = call("/api/auth/login", {"username": user, "password": pwd})
    if status != 200 or not body.get("token"):
        sys.exit(f"管理员登录失败：{status} {body.get('error') or body}")
    return body["token"]


def load_rows(path):
    rows = []
    with open(path, encoding="utf-8") as f:
        for i, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            parts = line.split()
            if len(parts) < 3:
                continue
            rows.append((i, parts[0], " ".join(parts[2:])))
    return rows


def main():
    token = get_token()
    rows = load_rows(SRC)
    dup, ok, err = [], [], []

    for idx, phone, nick in rows:
        status, body = call(f"/api/admin/users?q={urllib.parse.quote(nick)}", token=token)
        if status != 200:
            err.append((nick, status, body.get("error") or body))
            print(f"[{idx}] ⚠️  查询失败 {nick} → {status} {body.get('error') or body}")
            continue
        items = body.get("items") or []
        # 服务端 q 可能是模糊匹配，这里再按昵称精确比对一次
        hits = [u for u in items if (u.get("nickname") or "").strip() == nick]
        if hits:
            dup.append((nick, [(u.get("username"), u.get("role"), u.get("createdAt")) for u in hits]))
            for u in hits:
                print(f"[{idx}] ❌ 昵称已存在 {nick} → 账号 {u.get('username')} / {u.get('role')} / {u.get('createdAt')}")
        else:
            ok.append(nick)
            print(f"[{idx}] ✅ 可用 {nick}" + (f"（模糊命中 {len(items)} 条，无精确同名）" if items else ""))

    print("\n===== 汇总 =====")
    print(f"可用 {len(ok)}   已占用 {len(dup)}   查询失败 {len(err)}   合计 {len(rows)}")
    if dup:
        print("已占用明细：")
        for nick, hits in dup:
            print(f"  {nick}: {hits}")


if __name__ == "__main__":
    main()
