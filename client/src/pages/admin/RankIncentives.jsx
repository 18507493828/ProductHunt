import { useState } from "react";
import Rankings from "./Rankings";
import Incentives from "./Incentives";

const TABS = [
  { id: "rankings", label: "榜单管理" },
  { id: "incentives", label: "激励配置" },
];

export default function RankIncentives() {
  const [tab, setTab] = useState("rankings");

  return (
    <div className="admin-rank-incentives">
      <div className="admin-period-tabs" role="tablist" aria-label="榜单与激励">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={
              "admin-period-tab" + (tab === item.id ? " is-active" : "")
            }
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {tab === "rankings" ? <Rankings /> : <Incentives />}
    </div>
  );
}
