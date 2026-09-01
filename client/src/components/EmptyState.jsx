import { Inbox } from "lucide-react";

/**
 * 通用空视图组件：图标在上、文案在下。
 * 用于各类"暂无数据"场景，保证视觉统一。
 */
export default function EmptyState({ icon = <Inbox />, title, description, action, compact }) {
  return (
    <div className={"ph-empty-state" + (compact ? " ph-empty-state--compact" : "")}>
      <span className="ph-empty-icon-wrap">{icon}</span>
      <h3 className="ph-empty-state-title">{title}</h3>
      {description && <p className="ph-empty-state-desc">{description}</p>}
      {action && <div className="ph-empty-state-action">{action}</div>}
    </div>
  );
}
