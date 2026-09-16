/**
 * 分享唤起：优先打开本机 App（移动端 URL Scheme），失败则新标签打开网页。
 * 绝不使用 location.href，避免把主站当前页顶掉。
 */

function isMobileUa(ua = navigator.userAgent || "") {
  return /Android|iPhone|iPad|iPod|Mobile|HarmonyOS|OpenHarmony/i.test(ua);
}

function isIOS(ua = navigator.userAgent || "") {
  return /iPhone|iPad|iPod/i.test(ua);
}

function isAndroid(ua = navigator.userAgent || "") {
  return /Android/i.test(ua);
}

/** 各平台：App 协议 + PC / 移动网页兜底 */
export const SHARE_LAUNCH_TARGETS = {
  xiaohongshu: {
    name: "小红书",
    schemes: [
      "xhsdiscover://post",
      "xhsdiscover://post_note",
      "xhsdiscover://home",
    ],
    androidIntent:
      "intent://home#Intent;scheme=xhsdiscover;package=com.xingin.xhs;end",
    mobileWeb: "https://www.xiaohongshu.com/?fromSource=CSDNsmc",
    pcWeb: "https://creator.xiaohongshu.com/publish/publish?fromSource=CSDNsmc",
  },
  douyin: {
    name: "抖音",
    schemes: ["snssdk1128://aweme/create", "snssdk1128://"],
    androidIntent:
      "intent://aweme/create#Intent;scheme=snssdk1128;package=com.ss.android.ugc.aweme;end",
    mobileWeb: "https://www.douyin.com/?fromSource=CSDNsmc",
    pcWeb: "https://www.douyin.com/?fromSource=CSDNsmc",
  },
  wechat: {
    name: "微信",
    schemes: ["weixin://"],
    androidIntent:
      "intent://#Intent;scheme=weixin;package=com.tencent.mm;end",
    mobileWeb: "",
    pcWeb: "",
  },
  csdn: {
    name: "CSDN",
    schemes: ["csdn://blog/edit"],
    androidIntent: "",
    mobileWeb:
      "https://mp.csdn.net/mp_blog/creation/editor?fromSource=CSDNsmc",
    pcWeb: "https://editor.csdn.net/md/?fromSource=CSDNsmc",
  },
  weibo: {
    name: "微博",
    schemes: ["sinaweibo://compose"],
    androidIntent:
      "intent://compose#Intent;scheme=sinaweibo;package=com.sina.weibo;end",
    mobileWeb: "https://m.weibo.cn/compose?fromSource=CSDNsmc",
    pcWeb: "https://weibo.com/?fromSource=CSDNsmc",
  },
  bilibili: {
    name: "B站",
    schemes: ["bilibili://"],
    androidIntent: "",
    mobileWeb: "https://m.bilibili.com/?fromSource=CSDNsmc",
    pcWeb: "https://member.bilibili.com/platform/upload/text/edit?fromSource=CSDNsmc",
  },
  link: {
    name: "链接",
    schemes: [],
    androidIntent: "",
    mobileWeb: "",
    pcWeb: "",
  },
};

/** 始终新标签打开；弹窗被拦截时也不改写当前页 */
function openInNewTab(url) {
  if (!url) return false;
  const win = window.open(url, "_blank", "noopener,noreferrer");
  return Boolean(win);
}

/** 仅用隐藏 iframe 尝试唤起 App，绝不跳转当前页 */
function tryScheme(url) {
  if (!url) return;
  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "display:none;width:0;height:0;border:0;position:fixed;left:-9999px;top:-9999px";
  iframe.setAttribute("aria-hidden", "true");
  iframe.src = url;
  document.body.appendChild(iframe);
  window.setTimeout(() => {
    try {
      iframe.remove();
    } catch {
      /* ignore */
    }
  }, 2500);
}

/**
 * 唤起平台 App；未安装则在超时后新标签打开网页。
 * @returns {{ launched: boolean, mode: 'app'|'web'|'none'|'copy-only', label: string, tip?: string }}
 */
export function launchShareDestination(platformId) {
  const target = SHARE_LAUNCH_TARGETS[platformId];
  if (!target || platformId === "link") {
    return { launched: false, mode: "copy-only", label: "链接" };
  }

  const mobile = isMobileUa();
  const webFallback = mobile ? target.mobileWeb : target.pcWeb;
  const label = target.name;

  // PC：网页一律新标签；微信桌面仅 iframe 唤起
  if (!mobile) {
    if (platformId === "wechat") {
      tryScheme("weixin://");
      return {
        launched: true,
        mode: "app",
        label,
        tip: "已尝试打开微信，请到朋友圈粘贴发布",
      };
    }
    if (webFallback) {
      const opened = openInNewTab(webFallback);
      return {
        launched: opened,
        mode: "web",
        label,
        tip: opened
          ? `已在新标签打开${label}，请粘贴刚才复制的内容发布`
          : `文案已复制；请允许弹窗后重试，或手动打开${label}`,
      };
    }
    return { launched: false, mode: "none", label };
  }

  // 移动端：iframe 唤起 App；仍停留在本页则新标签打开 H5
  const start = Date.now();
  let cancelled = false;
  const onHide = () => {
    cancelled = true;
  };
  document.addEventListener("visibilitychange", onHide);
  window.addEventListener("pagehide", onHide);
  window.addEventListener("blur", onHide);

  const schemes = [...(target.schemes || [])];
  if (isAndroid() && target.androidIntent) {
    schemes.unshift(target.androidIntent);
  }

  if (schemes.length) {
    tryScheme(schemes[0]);
    if (schemes[1]) {
      window.setTimeout(() => {
        if (!cancelled && document.visibilityState === "visible") {
          tryScheme(schemes[1]);
        }
      }, 400);
    }
  }

  if (webFallback) {
    window.setTimeout(() => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("blur", onHide);
      if (cancelled || document.visibilityState !== "visible") return;
      if (Date.now() - start < 2800) {
        openInNewTab(webFallback);
      }
    }, isIOS() ? 1800 : 1500);
  }

  return {
    launched: true,
    mode: schemes.length ? "app" : "web",
    label,
    tip: webFallback
      ? `已复制文案，正在唤起${label}；若未安装将新标签打开网页`
      : `已复制文案，正在唤起${label}`,
  };
}

export function getShareLaunchTip(platformId) {
  const target = SHARE_LAUNCH_TARGETS[platformId];
  if (!target || platformId === "link") return "仅复制链接";
  if (isMobileUa()) {
    if (platformId === "wechat") {
      return "复制后唤起微信，请到朋友圈粘贴";
    }
    return `复制后唤起${target.name} App（无 App 则新标签打开网页）`;
  }
  if (platformId === "wechat") {
    return "复制后尝试打开电脑微信，到朋友圈粘贴";
  }
  return `复制后在新标签打开${target.name}网页创作入口`;
}
