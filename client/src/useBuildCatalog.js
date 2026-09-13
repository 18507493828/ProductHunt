import { useEffect, useState } from "react";
import {
  getBuildScenes,
  getBuildTools,
  subscribeBuildCatalog,
} from "./buildConfig";

/** 订阅运营后台下发的场景 / 工具目录（界面结构不变） */
export default function useBuildCatalog() {
  const [catalog, setCatalog] = useState(() => ({
    scenes: getBuildScenes(),
    tools: getBuildTools(),
  }));

  useEffect(() => subscribeBuildCatalog(setCatalog), []);

  return catalog;
}
