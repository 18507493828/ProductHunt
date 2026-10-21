#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""按账号清单批量注册 vb.csdn.net 账号（手机号 / 密码 / 昵称）

用法：
  python3 register-accounts.py [账号文件] [接口地址]
默认读取 /Users/lidiwen/Desktop/CSDN工作相关文件/账号清单-50个.txt
"""
import json
import sys
import urllib.request
import urllib.error

SRC = sys.argv[1] if len(sys.argv) > 1 else (
    "/Users/lidiwen/Desktop/CSDN工作相关文件/账号清单-50个.txt"
)
API = sys.argv[2] if len(sys.argv) > 2 else "https://vb.csdn.net/api/auth/register"

# 不走本地代理
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def post(payload):
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        API, data=data,
        headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"},
        method="POST",
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


def main():
    rows = []
    with open(SRC, encoding="utf-8") as f:
        for i, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            parts = line.split()
            if len(parts) < 3:
                rows.append((i, None, None, None, "行格式异常"))
                continue
            rows.append((i, parts[0], parts[1], " ".join(parts[2:]), None))

    ok, dup, fail = [], [], []
    for idx, user, pwd, nick, err in rows:
        if err:
            fail.append((idx, user, err))
            print(f"[{idx}] 跳过：{err}  原始行异常")
            continue
        status, body = post({"username": user, "nickname": nick, "password": pwd})
        if status == 200 and body.get("token"):
            ok.append((user, nick))
            print(f"[{idx}] ✅ 注册成功  {user} / {nick}")
        elif body.get("error") == "该登录账号已被注册":
            dup.append((user, nick))
            print(f"[{idx}] ⚠️  已存在    {user} / {nick}")
        else:
            fail.append((idx, user, body.get("error") or body))
            print(f"[{idx}] ❌ 失败      {user} / {nick}  →  {body.get('error') or body}")

    print("\n===== 汇总 =====")
    print(f"成功 {len(ok)}  已存在 {len(dup)}  失败 {len(fail)}  合计 {len(rows)}")
    if fail:
        print("失败明细：")
        for f_ in fail:
            print("  ", f_)


if __name__ == "__main__":
    main()
