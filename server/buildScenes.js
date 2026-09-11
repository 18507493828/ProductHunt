/** 构建场景话题（与前台 buildConfig 对齐） */
export const BUILD_SCENES = [
  {
    id: "campus",
    name: "校园",
    topics: [
      "校园二手书买卖",
      "校园篮球搭子",
      "校园周边餐厅团购",
      "社团活动一键组局",
      "失物招领雷达",
    ],
  },
  {
    id: "social",
    name: "社交",
    topics: [
      "周末饭搭子组局",
      "剧本杀狼人杀组局",
      "同城观影搭子",
      "宠物遛弯社交圈",
    ],
  },
  {
    id: "charity",
    name: "公益",
    topics: [
      "旧物捐赠地图",
      "志愿时长记账本",
      "社区旧物置换角",
      "流浪动物救助台",
      "无障碍出行助手",
    ],
  },
  {
    id: "fitness",
    name: "健身",
    topics: [
      "健身房私教搭子",
      "食堂热量识别",
      "跑步路线推荐",
      "居家跟练打卡",
      "体测满分计划",
    ],
  },
  {
    id: "outdoor",
    name: "户外",
    topics: [
      "周末徒步组队",
      "露营装备清单",
      "城市骑行路线",
      "郊野天气雷达",
      "露营美食菜单",
    ],
  },
];

export function inferSceneName(product, topicName = "") {
  const hay = [
    topicName,
    product?.topicName,
    product?.name,
    product?.tagline,
    product?.description,
  ]
    .filter(Boolean)
    .join("\n");
  for (const scene of BUILD_SCENES) {
    for (const topic of scene.topics) {
      if (hay.includes(topic)) return scene.name;
    }
  }
  for (const scene of BUILD_SCENES) {
    if (hay.includes(scene.name)) return scene.name;
  }
  return "其他";
}
