#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量替换 1024 第二批作品的封面（用本机重新生成的 封面.png）。

流程（每个作品）：登录其上传账号 → 读取作品现有信息 → 上传新封面 → PUT 回写 imageUrl
（其余字段原样回填，审核状态不变）

用法：
  python3 update-covers-1024.py --plan          # 只看计划
  python3 update-covers-1024.py --only 数字猜心   # 单个联调
  python3 update-covers-1024.py                 # 全部（已成功自动跳过）
"""
import argparse
import json
import os
import time

import requests

BASE = "https://vb.csdn.net"
API = BASE + "/api"
APP_DIR = "/Users/lidiwen/Desktop/CSDN工作相关文件/外部广告项目/1024/生成应用"
BATCH = "2026-10-21-第二批"
ACCOUNT_FILE = "/Users/lidiwen/Desktop/CSDN工作相关文件/账号清单-50个.txt"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_RESULT = os.path.join(SCRIPT_DIR, "upload-1024-result-2026-10-21-第二批.json")
OUT_FILE = os.path.join(SCRIPT_DIR, "update-covers-result-2026-10-21-第二批.json")

S = requests.Session()
S.trust_env = False  # 绕开本地 HTTP_PROXY
S.headers.update({"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"})


def load_accounts():
    out = {}
    with open(ACCOUNT_FILE, encoding="utf-8") as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) >= 2:
                out[parts[0]] = {"username": parts[0], "password": parts[1],
                                 "nickname": " ".join(parts[2:])}
    return out


_tokens = {}


def auth(acc):
    key = acc["username"]
    if key not in _tokens:
        r = S.post(API + "/auth/login",
                   json={"username": acc["username"], "password": acc["password"]}, timeout=25)
        data = r.json()
        if r.status_code != 200 or not data.get("token"):
            raise RuntimeError(f"登录失败 {acc['username']}：{data.get('error') or data}")
        _tokens[key] = data["token"]
        time.sleep(0.2)
    return {"Authorization": "Bearer " + _tokens[key]}


def get_product(acc, pid):
    r = S.get(f"{API}/products/{pid}", headers=auth(acc), timeout=30)
    data = r.json()
    if r.status_code != 200:
        raise RuntimeError(f"读取作品失败：{data.get('error') or data}")
    return data


def upload_cover(acc, path):
    with open(path, "rb") as f:
        content = f.read()
    r = S.post(API + "/upload", headers=auth(acc),
               files={"image": ("cover.png", content, "image/png")}, timeout=90)
    data = r.json()
    if r.status_code != 200 or not data.get("url"):
        raise RuntimeError(f"封面上传失败：{data.get('error') or data}")
    return data["url"]


def update_product(acc, pid, detail, image_url):
    payload = {
        "name": detail.get("name", ""),
        "tagline": detail.get("tagline", ""),
        "description": detail.get("description", ""),
        "url": detail.get("url", ""),
        "category": detail.get("category", ""),
        "categories": detail.get("categories") or [detail.get("category", "")],
        "campaign": detail.get("campaign", ""),
        "appPlatform": detail.get("appPlatform", ""),
        "imageUrl": image_url,
    }
    if detail.get("topicId"):
        payload["topicId"] = detail["topicId"]
    if detail.get("price") is not None:
        payload["price"] = detail.get("price")
        payload["originalPrice"] = detail.get("originalPrice", "")
        payload["buyUrl"] = detail.get("buyUrl", "")
        payload["purchaseNote"] = detail.get("purchaseNote", "")
    r = S.put(f"{API}/products/{pid}", headers=auth(acc), json=payload, timeout=45)
    data = r.json()
    if r.status_code != 200 or not data.get("product"):
        raise RuntimeError(f"更新失败：{data.get('error') or data}")
    return data["product"], data.get("message", "")


def load_rows():
    with open(SRC_RESULT, encoding="utf-8") as f:
        return json.load(f)


def load_done():
    if os.path.exists(OUT_FILE):
        with open(OUT_FILE, encoding="utf-8") as f:
            rows = json.load(f)
        return {r["dir"]: r for r in rows if r.get("newImage")}, rows
    return {}, []


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--plan", action="store_true")
    ap.add_argument("--only")
    ap.add_argument("--force", action="store_true", help="忽略已成功记录，全部重跑")
    args = ap.parse_args()

    accounts = load_accounts()
    src = [r for r in load_rows() if r.get("productId")]
    done, rows = load_done()
    if args.only:
        src = [r for r in src if r["dir"] == args.only]
    todo = [r for r in src if args.force or r["dir"] not in done]

    if args.plan:
        print(f"作品 {len(src)} 个，待处理 {len(todo)} 个\n")
        for r in todo:
            print(f"  {r['cat']:<3} {r['name']:<12} {r['productId']}  ← {r['account']}({r['nickname']})")
        return

    print(f"待替换封面 {len(todo)} 个\n")
    for i, r in enumerate(todo, 1):
        name = r["dir"]
        folder = os.path.join(APP_DIR, BATCH, name)
        cover = os.path.join(folder, "封面.png")
        acc = accounts.get(r["account"])
        row = dict(r)
        print(f"[{i}/{len(todo)}] {r['name']}  ({r['nickname']})")
        try:
            if not acc:
                raise RuntimeError(f"账号清单里找不到 {r['account']}")
            if not os.path.exists(cover):
                raise RuntimeError(f"缺少封面文件 {cover}")
            detail = get_product(acc, r["productId"])
            row["statusBefore"] = detail.get("status")
            row["oldImage"] = detail.get("imageUrl", "")
            new_image = upload_cover(acc, cover)
            prod, msg = update_product(acc, r["productId"], detail, new_image)
            row.update({
                "newImage": new_image,
                "status": prod.get("status"),
                "message": msg,
            })
            print(f"    封面 {row['oldImage']} → {new_image}")
            print(f"    状态 {row['statusBefore']} → {prod.get('status')}  {msg}")
        except Exception as e:
            row["error"] = str(e)
            print(f"    ✗ {e}")
        rows = [x for x in rows if x["dir"] != name] + [row]
        with open(OUT_FILE, "w", encoding="utf-8") as f:
            json.dump(rows, f, ensure_ascii=False, indent=2)
        time.sleep(0.35)

    ok = [x for x in rows if x.get("newImage")]
    bad = [x for x in rows if x.get("error") and not x.get("newImage")]
    print(f"\n===== 成功 {len(ok)} / 失败 {len(bad)} =====")
    for x in bad:
        print(f"  ✗ {x['name']}：{x['error']}")


if __name__ == "__main__":
    main()
