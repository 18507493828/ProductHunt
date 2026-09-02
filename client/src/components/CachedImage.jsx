import { useEffect, useState } from "react";

/** 会话内已成功加载过的地址，避免列表反复挂载时重复闪烁 */
const loadedSrcs = new Set();

/**
 * 统一图片展示：懒加载 + 会话缓存标记。
 * 跨刷新的磁盘缓存由服务端 /uploads 的 Cache-Control 负责。
 */
export default function CachedImage({
  src,
  alt = "",
  className = "",
  loading = "lazy",
  decoding = "async",
  onLoad,
  onError,
  ...rest
}) {
  const [loaded, setLoaded] = useState(() => Boolean(src && loadedSrcs.has(src)));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    setLoaded(Boolean(src && loadedSrcs.has(src)));
  }, [src]);

  if (!src || failed) return null;

  return (
    <img
      src={src}
      alt={alt}
      className={
        className + (loaded ? " ph-cached-image is-loaded" : " ph-cached-image")
      }
      loading={loading}
      decoding={decoding}
      onLoad={(e) => {
        loadedSrcs.add(src);
        setLoaded(true);
        onLoad?.(e);
      }}
      onError={(e) => {
        setFailed(true);
        onError?.(e);
      }}
      {...rest}
    />
  );
}
