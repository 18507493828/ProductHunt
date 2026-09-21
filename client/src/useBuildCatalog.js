import { useShallow } from "zustand/react/shallow";
import { useBuildCatalogStore } from "./stores/buildCatalogStore";
import "./buildConfig";

/** 订阅运营后台下发的场景 / 工具 / 云部署目录（界面结构不变） */
export default function useBuildCatalog() {
  return useBuildCatalogStore(
    useShallow((state) => ({
      scenes: state.scenes,
      tools: state.tools,
      deploys: state.deploys,
    })),
  );
}
