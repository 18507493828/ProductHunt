#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
给 1024 第二批 50 个作品造真实感投票 + 四维评分数据。

规则：
  - 每作品随机 5-15 个投票账号（不能是自己的作品）
  - 每人按 4 个维度打分（创新性/技术实现/应用价值/产品体验，1-5 整数）
  - 每作品有一个「质量基准」→ 各维度围绕它抖动，使整体均分落在 4.x-5.0
  - 全部走 /api/products/:id/vote 真实接口，voters / ratings 结构完全真实

用法：
  python3 seed-votes-1024.py --plan          # 只看计划（不写数据）
  python3 seed-votes-1024.py --only 数字猜心  # 单个试跑
  python3 seed-votes-1024.py                 # 全量
"""
import argparse
import json
import os
import random
import time

import requests

BASE = "https://vb.csdn.net"
API = BASE + "/api"
ACCOUNT_FILE = "/Users/lidiwen/Desktop/CSDN工作相关文件/账号清单-50个.txt"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_RESULT = os.path.join(SCRIPT_DIR, "upload-1024-result-2026-10-21-第二批.json")
OUT_FILE = os.path.join(SCRIPT_DIR, "seed-votes-result-2026-10-21-第二批.json")

DIMS = ["creativity", "completeness", "usefulness", "experience"]
SEED = 1024  # 固定随机种子，结果可复现

S = requests.Session()
S.trust_env = False
S.headers.update({"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"})

_tokens = {}


def load_accounts():
    out = []
    with open(ACCOUNT_FILE, encoding="utf-8") as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) >= 3:
                out.append({"username": parts[0], "password": parts[1],
                            "nickname": " ".join(parts[2:])})
    return out


def auth(acc):
    key = acc["username"]
    if key not in _tokens:
        r = S.post(API + "/auth/login",
                   json={"username": acc["username"], "password": acc["password"]}, timeout=25)
        d = r.json()
        if r.status_code != 200 or not d.get("token"):
            raise RuntimeError(f"登录失败 {acc['username']}：{d.get('error') or d}")
        _tokens[key] = d["token"]
        time.sleep(0.15)
    return {"Authorization": "Bearer " + _tokens[key]}


def gen_scores(quality):
    """围绕作品质量基准生成 4 维整数分，平均不低于 4.0"""
    dims = []
    for _ in range(4):
        v = quality + random.gauss(0, 0.42)
        dims.append(max(3, min(5, int(round(v)))))
    while sum(dims) / 4 < 4.0:
        i = dims.index(min(dims))
        dims[i] = min(5, dims[i] + 1)
    return dict(zip(DIMS, dims))


def vote(acc, pid, scores):
    r = S.post(f"{API}/products/{pid}/vote", headers=auth(acc),
               json={"ratings": scores}, timeout=30)
    d = r.json()
    if r.status_code != 200:
        raise RuntimeError(d.get("error") or str(d))
    return d


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--plan", action="store_true")
    ap.add_argument("--only")
    args = ap.parse_args()

    random.seed(SEED)
    accounts = load_accounts()
    apps = [r for r in json.load(open(SRC_RESULT, encoding="utf-8")) if r.get("productId")]
    if args.only:
        apps = [a for a in apps if a["dir"] == args.only]

    # 先给每个作品定「质量基准」和投票人数，plan 与实跑用同一随机序列
    plan = []
    for a in apps:
        pool = [x for x in accounts if x["username"] != a["account"]]
        n = random.randint(5, 15)
        voters = random.sample(pool, n)
        quality = round(min(4.9, max(4.15, random.gauss(4.55, 0.22))), 2)
        plan.append({"app": a, "voters": voters, "quality": quality})

    if args.plan:
        print(f"作品 {len(plan)} 个，预计投票请求 {sum(len(p['voters']) for p in plan)} 次\n")
        for p in plan[:12]:
            print(f"  {p['app']['name']:<12} 票数 {len(p['voters']):>2}  质量基准 {p['quality']}")
        return

    rows = []
    done = {}
    if os.path.exists(OUT_FILE):
        with open(OUT_FILE, encoding="utf-8") as f:
            rows = json.load(f)
        done = {r["dir"]: r for r in rows if r.get("voteCount") is not None}
    if done:
        print(f"已完成 {len(done)} 个，跳过（避免重复加票）\n")
    plan = [p for p in plan if p["app"]["dir"] not in done]

    ok_products = 0
    fail_votes = 0
    for i, p in enumerate(plan, 1):
        a = p["app"]
        print(f"[{i}/{len(plan)}] {a['name']}  目标 {len(p['voters'])} 票  基准 {p['quality']}")
        row = {"dir": a["dir"], "name": a["name"], "productId": a["productId"],
               "quality": p["quality"], "targetVotes": len(p["voters"]), "voted": 0}
        last = {}
        for acc in p["voters"]:
            scores = gen_scores(p["quality"])
            try:
                d = vote(acc, a["productId"], scores)
                row["voted"] += 1
                last = d
            except Exception as e:
                msg = str(e)
                if "已经评价" in msg:
                    row["voted"] += 1  # 之前投过，视为已有票
                else:
                    fail_votes += 1
                    print(f"    ✗ {acc['username']}({acc['nickname']})：{msg}")
            time.sleep(0.12)
        if last:
            row["voteCount"] = last.get("voteCount")
            row["avgRating"] = last.get("avgRating")
            row["ratingCount"] = last.get("ratingCount")
        ok_products += 1
        print(f"    完成：票数 {row.get('voteCount')}  均分 {row.get('avgRating')}  "
              f"评分数 {row.get('ratingCount')}")
        rows.append(row)
        with open(OUT_FILE, "w", encoding="utf-8") as f:
            json.dump(rows, f, ensure_ascii=False, indent=2)

    print(f"\n===== 作品 {ok_products} 个，投票失败 {fail_votes} 次 =====")
    votes = [r.get("voteCount") for r in rows if r.get("voteCount")]
    avgs = [r.get("avgRating") for r in rows if r.get("avgRating")]
    if votes:
        print(f"票数范围 {min(votes)}-{max(votes)}，合计 {sum(votes)} 票")
    if avgs:
        print(f"均分范围 {min(avgs)}-{max(avgs)}")


if __name__ == "__main__":
    main()
