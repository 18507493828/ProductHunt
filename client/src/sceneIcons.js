import {
  Dumbbell,
  GraduationCap,
  HeartHandshake,
  MessagesSquare,
  Mountain,
  Pin,
} from "lucide-react";

/** 场景分类图标：与首页「注册开发者 / 累计浏览量」同款 Lucide 线框风格 */
export const SCENE_ICONS = {
  campus: GraduationCap,
  social: MessagesSquare,
  charity: HeartHandshake,
  fitness: Dumbbell,
  outdoor: Mountain,
};

const SCENE_ICONS_BY_NAME = {
  校园: GraduationCap,
  社交: MessagesSquare,
  公益: HeartHandshake,
  健身: Dumbbell,
  户外: Mountain,
};

export function getSceneIcon(sceneIdOrName) {
  const key = String(sceneIdOrName || "").trim();
  return SCENE_ICONS[key] || SCENE_ICONS_BY_NAME[key] || Pin;
}
