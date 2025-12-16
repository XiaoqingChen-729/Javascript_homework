window.addEventListener("load", () => {
  // 1) 初始化地图到东非（用你原来的底图 URL）
  const map = L.map("map", {
    zoomControl: true,
    preferCanvas: true
  }).setView([-2.1, 35.1], 7); // Mara-Serengeti 作为初始视角

  L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      "© OpenStreetMap contributors, style by HOT, tiles by OSM France"
  }).addTo(map);

  // 让地图在布局渲染后自适应容器尺寸，避免瓦片缺块
  map.whenReady(() => map.invalidateSize());
  window.addEventListener("resize", () => map.invalidateSize());


  // 2) 载入公园边界 GeoJSON
  // 确保 parks-data.js 已经被加载，以便访问 PARKS_META
  fetch("./data/parks.json")
    .then((resp) => resp.json())
    .then((geojson) => {
      // 访问全局变量 PARKS_META
      initDashboard(map, geojson, PARKS_META);
    })
    .catch((err) => {
      console.error("Failed to load parks.json", err);
    });
});

function initDashboard(map, parksGeojson, parksMeta) {
  // 为了在点击公园时高亮，可以保存一个 layer 引用
  const parkLayersById = new Map();
  // 为了在点击列表卡片时高亮，可以保存一个卡片引用
  const parkCardElementsById = new Map();
  let activeParkId = null;

  // 获取 DOM 元素
  const parkListEl = document.getElementById("parkList");
  const parkDetailEl = document.getElementById("parkDetail");
  const searchInput = document.getElementById("searchInput");
  const filterRadios = document.querySelectorAll(
    'input[name="filterMode"]'
  );

  let currentFilterMode = 'country'; // 默认值

  // ----------------------------------------------------------------
  // 核心逻辑：高亮/选中一个公园
  // ----------------------------------------------------------------
  function setActivePark(parkId) {
    if (activeParkId === parkId) return; // 避免重复操作

    // 1. 清除旧的高亮状态
    if (activeParkId) {
      // 清除地图多边形高亮
      const oldLayer = parkLayersById.get(activeParkId);
      if (oldLayer) {
        parksLayer.resetStyle(oldLayer);
      }
      // 清除列表卡片高亮
      const oldCard = parkCardElementsById.get(activeParkId);
      if (oldCard) {
        oldCard.classList.remove("active");
      }
    }

    // 2. 设置新的高亮状态
    activeParkId = parkId;
    if (parkId) {
      // 设置地图多边形高亮
      const newLayer = parkLayersById.get(parkId);
      if (newLayer) {
        newLayer.setStyle({
          color: "#d0893b",
          weight: 3,
          opacity: 1,
          fillOpacity: 0.2
        });
      }
      // 设置列表卡片高亮
      const newCard = parkCardElementsById.get(parkId);
      if (newCard) {
        newCard.classList.add("active");
        // 确保卡片在可视区域内
        newCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }

      // 3. 渲染详情面板
      const parkMeta = parksMeta.find((meta) => meta.id === parkId);
      renderParkDetail(parkMeta);
    } else {
      // 4. 清空详情面板
      renderParkDetail(null);
    }
  }

  // ----------------------------------------------------------------
  // 2.1 画公园多边形 (GeoJSON Layer)
  // ----------------------------------------------------------------
  const parksLayer = L.geoJSON(parksGeojson, {
    style: {
      color: "#2e8b57",
      weight: 1,
      opacity: 0.7,
      fillColor: "#2e8b57",
      fillOpacity: 0.15
    },
    onEachFeature: (feature, layer) => {
      const parkId = feature.properties.id;
      // 存储图层引用
      parkLayersById.set(parkId, layer);

      // 点击多边形时高亮
      layer.on("click", (e) => {
        L.DomEvent.stopPropagation(e); // 阻止事件传播到地图
        setActivePark(parkId);
      });
    }
  }).addTo(map);


  // ----------------------------------------------------------------
  // 2.2 在每个公园的质心添加圆标记 (Circle Marker)
  // ----------------------------------------------------------------
  parksMeta.forEach(meta => {
    const geojsonFeature = parksGeojson.features.find(
      (f) => f.properties.id === meta.id
    );

    if (geojsonFeature) {
      // 计算多边形的中心点（简化处理，实际生产环境可能需要更准确的质心计算）
      const polygonLayer = parkLayersById.get(meta.id);
      if (!polygonLayer) return;

      const center = polygonLayer.getBounds().getCenter();

      // 根据数据计算圆的样式
      const radius = scaleVisitors(meta.visitors_2024);
      const fillColor = scalePredator(meta.predator_index);

      const circle = L.circleMarker(center, {
        radius: radius,
        fillColor: fillColor,
        color: fillColor,
        weight: 1,
        opacity: 0.8,
        fillOpacity: 0.6
      }).addTo(map);

      // Marker 上的点击事件也应触发高亮
      circle.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        setActivePark(meta.id);
      });

      // 绑定 Popup
      circle.bindPopup(
        `<b>${meta.name}</b><br>` +
        `Visitors (2024): ${meta.visitors_2024.toLocaleString()}<br>` +
        `Predator Index: ${meta.predator_index}/5`
      );
    }
  });


  // ----------------------------------------------------------------
  // 3. 侧栏渲染
  // ----------------------------------------------------------------

  // 渲染单个公园的 HTML 卡片
  function createParkCardHtml(meta) {
    const tags = meta.main_species
      .map((species) => `<span class="tag">${species}</span>`)
      .join("");

    return `
      <div class="park-card" data-park-id="${meta.id}">
        <div class="park-card-title">${meta.name}</div>
        <div class="park-card-subtitle">${meta.country}</div>
        <div class="tag-list">${tags}</div>
      </div>
    `;
  }

  // 渲染公园列表
  function renderParkList() {
    parkListEl.innerHTML = "";
    parkCardElementsById.clear(); // 清空旧的卡片引用

    const keyword = searchInput.value.toLowerCase().trim();

    const filteredParks = parksMeta.filter((meta) =>
      matchFilter(meta, currentFilterMode, keyword)
    );

    if (filteredParks.length === 0) {
      parkListEl.innerHTML = "<p>No parks found with current filter.</p>";
      return;
    }

    filteredParks.forEach((meta) => {
      const cardHtml = createParkCardHtml(meta);
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = cardHtml.trim();
      const cardElement = tempDiv.firstChild;

      // 存储卡片引用
      parkCardElementsById.set(meta.id, cardElement);

      // 添加点击事件：点击列表卡片时高亮地图
      cardElement.addEventListener("click", () => {
        setActivePark(meta.id);
      });

      // 恢复当前激活状态
      if (meta.id === activeParkId) {
        cardElement.classList.add("active");
      }

      parkListEl.appendChild(cardElement);
    });
  }

  // 渲染详情面板内容
  function renderParkDetail(meta) {
    if (!meta) {
      parkDetailEl.innerHTML =
        "<p>Select a park on the map or from the list.</p>";
      return;
    }

    const migrationTag = meta.in_migration_route
      ? '<span class="tag">On Migration Route</span>'
      : '';
    const bigFiveTag = meta.has_big_five
      ? '<span class="tag">Big Five Area</span>'
      : '';
    const mainSpecies = meta.main_species.join(", ");

    parkDetailEl.innerHTML = `
      <h3>${meta.name}</h3>
      <p class="detail-subtitle">${meta.country}</p>
      <div class="tag-list detail-tags">
        ${migrationTag}
        ${bigFiveTag}
      </div>

      <div class="detail-stats">
        <p><strong>Visitors (2024):</strong> ${meta.visitors_2024.toLocaleString()}</p>
        <p><strong>Predator Index:</strong> ${meta.predator_index} / 5</p>
        <p><strong>Key Species:</strong> ${mainSpecies}</p>
      </div>

      ${
        meta.storymap_url
          ? `<p class="storymap-link-hint">Check out the interactive story map:</p>`
          : "<p class='storymap-link-hint'>No dedicated story map available.</p>"
      }
      <button class="storymap-btn" ${
        meta.storymap_url ? "" : "disabled"
      } onclick="${
      meta.storymap_url ? `window.open('${meta.storymap_url}', '_blank')` : ""
    }">
        ${meta.storymap_url ? "Open Story Map" : "Story Map Unavailable"}
      </button>
    `;
  }

  function matchFilter(meta, mode, keyword) {
    if (!keyword) return true;
    keyword = keyword.toLowerCase();

    if (mode === "country") {
      return meta.country.toLowerCase().includes(keyword);
    }
    if (mode === "park") {
      return meta.name.toLowerCase().includes(keyword);
    }
    if (mode === "animal") {
      return meta.main_species
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    }
    return true;
  }

  // ----------------------------------------------------------------
  // 4. 事件监听器
  // ----------------------------------------------------------------
  searchInput.addEventListener("input", renderParkList);

  filterRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      currentFilterMode = radio.value;
      renderParkList();
    });
  });

  // 初始渲染列表
  renderParkList();
}

/* ======= 简单的映射函数：可以根据数据再调 ======= */
// 游客数量到圆半径的映射
function scaleVisitors(v) {
  if (!v) return 0;
  // 示例：将游客数映射到 5 到 15 的半径
  // 假设最大游客数约为 600,000 (Serengeti)
  const maxVisitors = 600000;
  const minRadius = 5;
  const maxRadius = 15;
  const normalized = Math.min(v / maxVisitors, 1);
  return minRadius + normalized * (maxRadius - minRadius);
}

// 捕食者指数到颜色的映射
function scalePredator(p) {
  if (!p) return "#ccc";
  // 使用 HSL 颜色，从绿色(低)到深红/棕色(高)
  // 1: 绿色 (#7ED321) -> 5: 深棕色 (#9B5A2C)
  // 简单的色阶，需要和 style.css 中的 legend 对应
  const colorMap = {
    1: "#b7d6a5", // 浅绿
    2: "#8bb96d", // 偏绿
    3: "#d0893b", // 橘黄/棕色
    4: "#b56930", // 棕色
    5: "#9b5a2c" // 深棕色
  };
  return colorMap[p] || "#ccc";
}