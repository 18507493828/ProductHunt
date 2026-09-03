import { Link } from "react-router-dom";
import { bareTopicName, buildTopicHomePath, findTopicMentions } from "../topicUtils";

/**
 * 渲染纯文本，并将 #话题名 转为可点击链接，跳转话题详情。
 * topics: [{ id, name }]，有则精确匹配；无则按 #片段 匹配并用 topicName 深链。
 */
export default function TopicRichText({
  text = "",
  topics = [],
  className,
  as: Component = "div",
}) {
  const source = text || "";
  const mentions = findTopicMentions(source, topics);
  const topicByName = new Map(
    (topics || []).map((t) => [bareTopicName(t.name), t]),
  );

  if (!source) return null;
  if (mentions.length === 0) {
    return <Component className={className}>{source}</Component>;
  }

  const nodes = [];
  let cursor = 0;
  mentions.forEach((mention, index) => {
    if (mention.start > cursor) {
      nodes.push(source.slice(cursor, mention.start));
    }
    const topic = topicByName.get(mention.name);
    const to = buildTopicHomePath({
      topicId: topic?.id || "",
      topicName: mention.name,
    });
    nodes.push(
      <Link
        key={`topic-mention-${mention.start}-${index}`}
        to={to}
        className="topic-mention"
        onClick={(e) => e.stopPropagation()}
      >
        {`#${mention.name}`}
      </Link>,
    );
    cursor = mention.end;
  });
  if (cursor < source.length) {
    nodes.push(source.slice(cursor));
  }

  return <Component className={className}>{nodes}</Component>;
}
