import { useEffect, useState } from "react";
import { fetchNavs } from "../api";

/** 运营端「导航管理」配置的站点外链，展示在顶栏 */
export default function SiteCmsNav() {
  const [navs, setNavs] = useState([]);

  useEffect(() => {
    let ignore = false;
    fetchNavs()
      .then((list) => {
        if (!ignore) setNavs(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!ignore) setNavs([]);
      });
    return () => {
      ignore = true;
    };
  }, []);

  if (!navs.length) return null;

  return (
    <nav className="ph-cms-nav" aria-label="站点导航">
      {navs.map((item) => (
        <a
          key={item.id}
          href={item.url}
          className="ph-cms-nav-link"
          target="_blank"
          rel="noreferrer noopener"
        >
          {item.title}
        </a>
      ))}
    </nav>
  );
}
