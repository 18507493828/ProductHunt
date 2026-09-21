import { create } from "zustand";

/** 场景 / 工具 / 云部署目录。默认值由 buildConfig 在加载时写入。 */
export const useBuildCatalogStore = create(() => ({
  scenes: [],
  tools: [],
  deploys: [],
}));
