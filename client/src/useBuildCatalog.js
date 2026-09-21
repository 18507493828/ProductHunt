import { useBuildCatalogStore } from "./stores/buildCatalogStore";
import "./buildConfig";

/** 订阅运营后台下发的场景 / 工具 / 云部署目录（界面结构不变） */
export default function useBuildCatalog() {
  const scenes = useBuildCatalogStore((state) => state.scenes);
  const tools = useBuildCatalogStore((state) => state.tools);
  const deploys = useBuildCatalogStore((state) => state.deploys);
  return { scenes, tools, deploys };
}
