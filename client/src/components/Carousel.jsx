import { useEffect, useRef, useState } from "react";
import { fetchBanners } from "../api";
import CachedImage from "./CachedImage";

const AUTOPLAY_MS = 3000;

export default function Carousel() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = banners.length;
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetchBanners()
      .then((data) => {
        if (cancelled) return;
        setBanners(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setBanners([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const goTo = (next) => {
    if (total === 0) return;
    setIndex(((next % total) + total) % total);
  };

  // 3 秒自动轮播，鼠标悬停时暂停
  useEffect(() => {
    if (paused || total === 0) return undefined;
    timerRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % total);
    }, AUTOPLAY_MS);
    return () => clearInterval(timerRef.current);
  }, [paused, total]);

  if (loading) {
    return (
      <section className="ph-carousel" aria-hidden="true">
        <div className="ph-carousel-skeleton" />
      </section>
    );
  }

  if (total === 0) return null;

  return (
    <section
      className="ph-carousel"
      aria-roledescription="carousel"
      aria-label="首页轮播图"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="ph-carousel-viewport">
        {banners.map((banner, i) => {
          const active = i === index;
          const inner = (
            <>
              <CachedImage
                className="ph-carousel-img"
                src={banner.imageUrl}
                alt={banner.title}
                loading={i === 0 ? "eager" : "lazy"}
              />
              <div className="ph-carousel-overlay" />
              <div className="ph-carousel-inner">
                <h2 className="ph-carousel-title">{banner.title}</h2>
                {banner.subtitle && (
                  <p className="ph-carousel-desc">{banner.subtitle}</p>
                )}
                {banner.linkUrl && (
                  <span className="ph-carousel-link">了解更多 →</span>
                )}
              </div>
            </>
          );

          return (
            <div
              key={banner.id}
              className={active ? "ph-carousel-slide active" : "ph-carousel-slide"}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${total}`}
              aria-hidden={!active}
            >
              {banner.linkUrl ? (
                <a
                  className="ph-carousel-link-wrap"
                  href={banner.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={active ? 0 : -1}
                >
                  {inner}
                </a>
              ) : (
                inner
              )}
            </div>
          );
        })}
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            className="ph-carousel-arrow left"
            onClick={() => goTo(index - 1)}
            aria-label="上一张"
          >
            ‹
          </button>
          <button
            type="button"
            className="ph-carousel-arrow right"
            onClick={() => goTo(index + 1)}
            aria-label="下一张"
          >
            ›
          </button>

          <div className="ph-carousel-dots">
            {banners.map((banner, i) => (
              <button
                key={banner.id}
                type="button"
                className={
                  i === index ? "ph-carousel-dot active" : "ph-carousel-dot"
                }
                onClick={() => goTo(i)}
                aria-label={`切换到第 ${i + 1} 张`}
                aria-current={i === index}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
