import { useEffect, useState } from "react";
import {
  getBuildDeploys,
  getBuildScenes,
  getBuildTools,
  subscribeBuildCatalog,
} from "./buildConfig";

/** 订阅运营后台下发的场景 / 工具 / 云部署目录（界面结构不变） */
export default function useBuildCatalog() {
  const [catalog, setCatalog] = useState(() => ({
    scenes: getBuildScenes(),
    tools: getBuildTools(),
    deploys: getBuildDeploys(),
  }));

  useEffect(() => subscribeBuildCatalog(setCatalog), []);

  return catalog;
}
