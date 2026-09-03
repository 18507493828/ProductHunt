/** 话题名存裸名；展示与正文提及统一为 #名称 */

export function bareTopicName(name) {
  return (name || "").trim().replace(/^#+|#+$/g, "");
}

export function formatTopicName(name) {
  const n = bareTopicName(name);
  return n ? `#${n}` : "";
}

/**
 * 在文本中找出 #话题名 提及。
 * 若提供 topics，按名称从长到短精确匹配；否则匹配 # 后连续非空白、非 # 字符。
 */
export function findTopicMentions(text, topics = []) {
  const source = text || "";
  if (!source) return [];

  const names = (topics || [])
    .map((t) => bareTopicName(t.name || t))
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  const mentions = [];
  const occupied = new Array(source.length).fill(false);

  function markRange(start, end) {
    for (let i = start; i < end; i += 1) occupied[i] = true;
  }

  function isFree(start, end) {
    for (let i = start; i < end; i += 1) {
      if (occupied[i]) return false;
    }
    return true;
  }

  if (names.length > 0) {
    for (const name of names) {
      const token = `#${name}`;
      let from = 0;
      while (from < source.length) {
        const idx = source.indexOf(token, from);
        if (idx < 0) break;
        const end = idx + token.length;
        const next = source[end];
        const boundaryOk =
          end === source.length ||
          /\s/.test(next) ||
          /[，。！？、；：,.!?;:"'）】》\])]/.test(next);
        if (boundaryOk && isFree(idx, end)) {
          mentions.push({ start: idx, end, name });
          markRange(idx, end);
        }
        from = idx + 1;
      }
    }
  } else {
    const re = /#([^\s#]+)/g;
    let match;
    while ((match = re.exec(source))) {
      mentions.push({
        start: match.index,
        end: match.index + match[0].length,
        name: match[1],
      });
    }
  }

  return mentions.sort((a, b) => a.start - b.start);
}

export function buildTopicHomePath({ topicId = "", topicName = "" } = {}) {
  const params = new URLSearchParams();
  params.set("view", "topics");
  if (topicId) params.set("topic", topicId);
  if (topicName) params.set("topicName", bareTopicName(topicName));
  return `/?${params.toString()}`;
}
