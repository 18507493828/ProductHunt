#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把 1024/生成应用 下的应用上传到 vb.csdn.net 的 1024 活动。

流程（每个应用）：登录账号 → 上传 HTML 发布站内页 → 上传封面 → 创建作品（campaign=1024）

用法：
  1) 先看分配计划：      python3 upload-apps-1024.py --plan
  2) 单应用联调：        python3 upload-apps-1024.py --only 课堂点名摇号器
  3) 全部上传：          python3 upload-apps-1024.py
  4) 断点续跑（跳过已完成）：python3 upload-apps-1024.py --resume
"""
import argparse
import json
import os
import re
import sys
import time

import requests

BASE = "https://vb.csdn.net"
API = BASE + "/api"
APP_DIR = "/Users/lidiwen/Desktop/CSDN工作相关文件/外部广告项目/1024/生成应用"
ACCOUNT_FILE = "/Users/lidiwen/Desktop/CSDN工作相关文件/账号清单-50个.txt"
CAMPAIGN = "1024"
RESULT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "upload-1024-result.json")

# 英文 slug（用于站内页面地址 /apps/<slug>-xxxx/）与平台标注
META = {
    "课堂点名摇号器": ("ketang-dianming-yaohao", "pc"),
    "图书馆空座雷达": ("tushuguan-kongzuo-leida", "pc"),
    "社团招新集市": ("shetuan-zhaoxin-jishi", "pc"),
    "匿名树洞信箱": ("niming-shudong-xinxiang", "h5"),
    "老乡同乡圈": ("laoxiang-tongxiang-quan", "h5"),
    "桌游拼局台": ("zhuoyou-pinju-tai", "pc"),
    "光盘打卡行动": ("guangpan-daka-xingdong", "h5"),
    "献血提醒助手": ("xianxue-tixing-zhushou", "h5"),
    "旧书漂流角": ("jiushu-piaoliu-jiao", "pc"),
    "引体向上计数器": ("yinti-xiangshang-jishuqi", "h5"),
    "深蹲节拍器": ("shendun-jiepaiqi", "h5"),
    "久坐拉伸闹钟": ("jiuzuo-lashen-naozhong", "h5"),
    "观星条件指数": ("guanxing-tiaojian-zhishu", "pc"),
    "钓鱼天气窗口": ("diaoyu-tianqi-chuangkou", "pc"),
    "日出日落计划": ("richu-riluo-jihua", "pc"),
    "口算出题机": ("kousuan-chutiji", "h5"),
    "乘法口诀闯关": ("chengfa-koujue-chuangguan", "h5"),
    "拼音拼读卡": ("pinyin-pinduka", "h5"),
    "数字华容道": ("shuzi-huarongdao", "h5"),
    "成语接龙竞技场": ("chengyu-jielong-jingjichang", "pc"),
    "打气球手速赛": ("daqiuqi-shoususai", "h5"),
    "冰箱菜谱翻牌": ("bingxiang-caipu-fanpai", "pc"),
    "合租账单分摊": ("hezu-zhangdan-fentan", "pc"),
    "快递取件码卡片": ("kuaidi-qujianma-kapian", "h5"),
    # ===== 2026-10-21 批（50 个）=====
    "推箱子": ("tuixiangzi", "h5"),
    "迷宫寻路": ("migong-xunlu", "h5"),
    "诗词飞花令": ("shici-feihualing", "h5"),
    "文献引用格式生成": ("wenxian-yinyong-geshi", "pc"),
    "小组作业分工板": ("xiaozu-zuoye-fengongban", "pc"),
    "艾宾浩斯复习卡": ("aibinhaosi-fuxika", "h5"),
    "衣柜穿搭日历": ("yigui-chuanda-rili", "pc"),
    "家庭药箱管家": ("jiating-yaoxiang-guanjia", "pc"),
    "旅行打包清单": ("lvxing-dabao-qingdan", "h5"),
    "平板支撑挑战": ("pingban-zhicheng-tiaozhan", "h5"),
    "每日饮水计划": ("meiri-yinshui-jihua", "h5"),
    "跳绳间歇训练": ("tiaosheng-jianxie-xunlian", "h5"),
    "生日礼物灵感": ("shengri-liwu-linggan", "pc"),
    "聚会破冰抽签": ("juhui-pobing-chouqian", "h5"),
    "拼车同行板": ("pinche-tongxingban", "pc"),
    "赶海潮汐表": ("ganhai-chaoxibiao", "pc"),
    "Citywalk路线灵感": ("citywalk-luxian-linggan", "pc"),
    "自然探索任务单": ("ziran-tansuo-renwudan", "h5"),
    "无障碍设施标注": ("wuzhangai-sheshi-biaozhu", "pc"),
    "社区互助黑板": ("shequ-huzhu-heiban", "pc"),
    "旧衣回收指南": ("jiuyi-huihou-zhinan", "h5"),
    "古诗背诵填空": ("gushi-beisong-tiankong", "h5"),
    "英语单词听写本": ("yingyu-danci-tingxieben", "h5"),
    "几何面积练习": ("jihe-mianji-lianxi", "h5"),
    "数字连线": ("shuzi-lianxian", "h5"),
    "黑白棋对战": ("heibaiqi-duizhan", "h5"),
    "数织": ("shuzhi", "h5"),
    "24点挑战": ("24dian-tiaozhan", "h5"),
    "课表空档表": ("kebiao-kongdangbiao", "pc"),
    "实验数据拟合": ("shiyan-shuju-nihe", "pc"),
    "演讲提词计时": ("yanjiang-tici-jishi", "pc"),
    "家电保修提醒": ("jiadian-baoxiu-tixing", "pc"),
    "一周菜单排程": ("yizhou-caidan-paicheng", "pc"),
    "宠物喂养日程": ("chongwu-weiye-richeng", "h5"),
    "配速区间": ("peisu-qujian", "h5"),
    "哑铃训练计划": ("yaling-xunlian-jihua", "h5"),
    "体态自测": ("titai-zice", "h5"),
    "聚餐分账": ("jucan-fenzhang", "h5"),
    "礼物交换抽签": ("liwu-jiaohuan-chouqian", "h5"),
    "群活动投票": ("qunhuodong-toupiao", "h5"),
    "紫外线防晒": ("ziwaixian-fangshai", "h5"),
    "海拔剖面": ("haiba-poumian", "pc"),
    "户外急救速查": ("huwai-jijiu-sucha", "h5"),
    "AED急救地图": ("aed-jijiu-ditu", "pc"),
    "家庭碳足迹": ("jiating-tanzuji", "pc"),
    "垃圾分类速查": ("laji-fenlei-sucha", "h5"),
    "竖式计算": ("shushi-jisuan", "h5"),
    "分数运算": ("fenshu-yunsuan", "h5"),
    "元素周期表速记": ("yuansu-zhouqibiao-suji", "h5"),
    "英语时态练习": ("yingyu-shitai-lianxi", "h5"),
}

# 分类顺序（决定轮流分配时的搭配，同账号尽量跨分类）
CAT_ORDER = ["校园", "社交", "公益", "健身", "户外", "K12", "游戏", "生活"]

S = requests.Session()
S.trust_env = False  # 绕开本地 HTTP_PROXY
S.headers.update({"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"})


# ---------------- 读取应用资料 ----------------

def parse_intro(path):
    with open(path, encoding="utf-8") as f:
        text = f.read()
    lines = [ln.rstrip() for ln in text.splitlines()]

    def field(prefix):
        for ln in lines:
            if ln.startswith(prefix):
                return ln[len(prefix):].strip()
        return ""

    name = field("应用名称：")
    cat = field("所属分类：")
    tagline = field("一句话介绍：")

    intro, features = [], []
    mode = ""
    for ln in lines:
        s = ln.strip()
        if s == "应用简介":
            mode = "intro"
            continue
        if s == "核心功能":
            mode = "feat"
            continue
        if s == "文件说明":
            mode = ""
            continue
        if not s:
            continue
        if mode == "intro":
            intro.append(s)
        elif mode == "feat":
            features.append(re.sub(r"^\d+[.、]\s*", "", s))
    return name, cat, tagline, "".join(intro), features


def build_plan(batch=None):
    base = os.path.join(APP_DIR, batch) if batch else APP_DIR
    names = sorted(os.listdir(base))
    apps = []
    for d in names:
        folder = os.path.join(base, d)
        if not os.path.isdir(folder) or re.match(r"^\d{4}-\d{2}-\d{2}$", d):
            continue
        html = os.path.join(folder, d + ".html")
        cover = os.path.join(folder, "封面.png")
        intro = os.path.join(folder, "介绍.txt")
        if not (os.path.exists(html) and os.path.exists(cover) and os.path.exists(intro)):
            print(f"  ! 跳过（文件不全）：{d}")
            continue
        name, cat, tagline, desc_intro, feats = parse_intro(intro)
        slug, platform = META.get(d, ("app-" + str(len(apps)), "h5"))
        apps.append({
            "dir": d,
            "name": name or d,
            "cat": cat,
            "tagline": tagline,
            "intro": desc_intro,
            "features": feats,
            "slug": slug,
            "platform": platform,
            "html": html,
            "cover": cover,
        })

    apps.sort(key=lambda a: (CAT_ORDER.index(a["cat"]) if a["cat"] in CAT_ORDER else 99, a["name"]))
    accounts = load_accounts()
    for i, app in enumerate(apps):
        app["account"] = accounts[i % len(accounts)]
    return apps, accounts


def load_accounts():
    out = []
    with open(ACCOUNT_FILE, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            parts = line.split()
            if len(parts) < 3:
                continue
            out.append({"username": parts[0], "password": parts[1], "nickname": " ".join(parts[2:])})
    return out


def build_description(app):
    blocks = [app["intro"]]
    if app["features"]:
        blocks.append("核心功能\n" + "\n".join(f"{i}. {t}" for i, t in enumerate(app["features"], 1)))
    blocks.append("单文件网页应用，打开即用，数据保存在本地浏览器，无需登录与后端。")
    return "\n\n".join(b for b in blocks if b)


# ---------------- 接口调用 ----------------

_tokens = {}


def login(acc):
    key = acc["username"]
    if key in _tokens:
        return _tokens[key]
    r = S.post(API + "/auth/login", json={"username": acc["username"], "password": acc["password"]}, timeout=25)
    data = r.json()
    if r.status_code != 200 or not data.get("token"):
        raise RuntimeError(f"登录失败 {acc['username']}：{data.get('error') or data}")
    _tokens[key] = data["token"]
    return data["token"]


def auth(acc):
    return {"Authorization": "Bearer " + login(acc)}


def upload_page(acc, app):
    with open(app["html"], "rb") as f:
        content = f.read()
    r = S.post(
        API + "/upload-page",
        headers=auth(acc),
        files={"page": (app["slug"] + ".html", content, "text/html")},
        timeout=60,
    )
    data = r.json()
    if r.status_code != 200 or not data.get("url"):
        raise RuntimeError(f"页面上传失败：{data.get('error') or data}")
    return data


def upload_cover(acc, app):
    with open(app["cover"], "rb") as f:
        content = f.read()
    r = S.post(
        API + "/upload",
        headers=auth(acc),
        files={"image": ("cover.png", content, "image/png")},
        timeout=60,
    )
    data = r.json()
    if r.status_code != 200 or not data.get("url"):
        raise RuntimeError(f"封面上传失败：{data.get('error') or data}")
    return data["url"]


def create_product(acc, app, page_url, image_url):
    payload = {
        "name": app["name"],
        "tagline": app["tagline"],
        "url": page_url,
        "sceneName": app["cat"],
        "category": app["cat"],
        "categories": [app["cat"]],
        "description": build_description(app),
        "imageUrl": image_url,
        "campaign": CAMPAIGN,
        "appPlatform": app["platform"],
    }
    r = S.post(API + "/products", headers=auth(acc), json=payload, timeout=40)
    data = r.json()
    if r.status_code != 200 or not data.get("product"):
        raise RuntimeError(f"发布失败：{data.get('error') or data}")
    return data


# ---------------- 主流程 ----------------

def show_plan(apps, accounts):
    print(f"共 {len(apps)} 个应用，{len(accounts)} 个账号\n")
    by_acc = {}
    for a in apps:
        by_acc.setdefault(a["account"]["username"], []).append(a)
    for acc in accounts:
        items = by_acc.get(acc["username"], [])
        print(f"{acc['username']}（{acc['nickname']}） {len(items)} 个")
        for it in items:
            print(f"    {it['cat']:<3} {it['name']:<10} {it['tagline']}")
    print("\n分配合计：", {k: len(v) for k, v in by_acc.items()})


def load_results():
    if os.path.exists(RESULT_FILE):
        with open(RESULT_FILE, encoding="utf-8") as f:
            return json.load(f)
    return []


def save_results(rows):
    with open(RESULT_FILE, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=2)


def run(apps, only=None, resume=False):
    rows = load_results()
    done = {r["dir"] for r in rows if r.get("productId")} if resume else set()
    targets = [a for a in apps if (not only or a["dir"] == only) and a["dir"] not in done]
    print(f"待上传 {len(targets)} 个\n")
    for i, app in enumerate(targets, 1):
        acc = app["account"]
        print(f"[{i}/{len(targets)}] {app['name']}  ←  {acc['username']}({acc['nickname']})/{app['cat']}")
        row = {
            "dir": app["dir"],
            "name": app["name"],
            "cat": app["cat"],
            "tagline": app["tagline"],
            "slug": app["slug"],
            "account": acc["username"],
            "nickname": acc["nickname"],
        }
        try:
            page = upload_page(acc, app)
            print(f"    页面：{page['url']}")
            image = upload_cover(acc, app)
            print(f"    封面：{image}")
            created = create_product(acc, app, page["url"], image)
            p = created["product"]
            row.update({
                "pageUrl": page["url"],
                "imageUrl": image,
                "productId": p.get("id"),
                "status": p.get("status"),
                "message": created.get("message"),
            })
            print(f"    作品：{p.get('id')}  状态={p.get('status')}  {created.get('message')}")
        except Exception as e:
            row["error"] = str(e)
            print(f"    ✗ {e}")
        rows = [r for r in rows if r["dir"] != app["dir"]] + [row]
        save_results(rows)
        time.sleep(0.4)

    ok = [r for r in rows if r.get("productId")]
    bad = [r for r in rows if r.get("error")]
    print(f"\n===== 汇总：成功 {len(ok)} / 失败 {len(bad)} =====")
    for r in bad:
        print(f"  ✗ {r['name']}：{r['error']}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--plan", action="store_true", help="只打印分配计划")
    ap.add_argument("--only", help="只上传指定应用（文件夹名）")
    ap.add_argument("--resume", action="store_true", help="跳过已成功上传的应用")
    ap.add_argument("--batch", help="只上传某个日期批次，如 2026-10-21")
    args = ap.parse_args()

    apps, accounts = build_plan(batch=args.batch)
    if args.plan:
        show_plan(apps, accounts)
        return
    run(apps, only=args.only, resume=args.resume)


if __name__ == "__main__":
    main()
