// js/main.js

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

  // 2) 载入公园边界 GeoJSON
  fetch("./data/parks.geojson")
    .then((resp) => resp.json())
    .then((geojson) => {
      initDashboard(map, geojson);
    })
    .catch((err) => {
      console.error("Failed to load parks.geojson", err);
    });
});

function initDashboard(map, parksGeojson) {
  // 为了在点击公园时高亮，可以保存一个 layer 引用
  const parkLayersById = new Map();
  let activeParkId = null;

  // 2.1 画公园多边形
  const parksLayer = L.geoJSON(parksGeojson, {
    style: {
      color: "#2e8b57",
      weight: 1,
      fillColor: "#2e8b57",
      fillOpacity: 0.2
    },
    onEachFeature: (feature, layer) => {
      const id = feature.properties.id;
      if (id) {
        parkLayersById.set(id, layer);
      }
    }
  }).addTo(map);

  // 2.2 在公园中心画 circleMarker（游客量 + 捕食者指数）
  const markerLayerGroup = L.layerGroup().addTo(map);
  const bounds = [];

  PARKS_META.forEach((meta) => {
    const layer = parkLayersById.get(meta.id);
    if (!layer) return;

    // 求 polygon 中心
    const center = layer.getBounds().getCenter();
    bounds.push(center);

    const radius = scaleVisitors(meta.visitors_2024);
    const color = scalePredatorColor(meta.predator_index);

    const marker = L.circleMarker(center, {
      radius,
      fillColor: color,
      color: "#555",
      weight: 1,
      fillOpacity: 0.9
    }).addTo(markerLayerGroup);

    marker.on("click", () => {
      setActivePark(meta.id, meta, layer);
    });
  });

  if (bounds.length > 0) {
    map.fitBounds(L.latLngBounds(bounds));
  }

  // 3) 构建右侧列表 & 搜索
  const parkListEl = document.getElementById("parkList");
  const detailEl = document.getElementById("parkDetail");
  const searchInput = document.getElementById("searchInput");
  const filterRadios = document.querySelectorAll("input[name='filterMode']");

  let currentFilterMode = "country";

  function renderParkList() {
    const keyword = searchInput.value.toLowerCase().trim();
    parkListEl.innerHTML = "";

    PARKS_META.forEach((meta) => {
      if (!matchFilter(meta, currentFilterMode, keyword)) return;

      const card = document.createElement("div");
      card.className =
        "park-card" + (meta.id === activeParkId ? " active" : "");
      card.dataset.id = meta.id;

      card.innerHTML = `
        <div class="park-card-title">${meta.name}</div>
        <div class="park-card-subtitle">${meta.country}</div>
        <div class="tag-list">
          ${meta.has_big_five ? '<span class="tag">Big Five</span>' : ""}
          ${
            meta.in_migration_route
              ? '<span class="tag">Migration Route</span>'
              : ""
          }
          ${
            meta.predator_index >= 4
              ? '<span class="tag">Predator Hotspot</span>'
              : ""
          }
        </div>
      `;

      card.addEventListener("click", () => {
        const layer = parkLayersById.get(meta.id);
        if (layer) {
          map.fitBounds(layer.getBounds(), { maxZoom: 10 });
        }
        setActivePark(meta.id, meta, layer);
      });

      parkListEl.appendChild(card);
    });
  }

  function setActivePark(id, meta, layer) {
    activeParkId = id;

    // 高亮 polygon
    parksLayer.setStyle({
      color: "#2e8b57",
      weight: 1
    });
    if (layer) {
      layer.setStyle({
        color: "#d0893b",
        weight: 2
      });
    }

    // 更新详情面板
    detailEl.innerHTML = `
      <h3>${meta.name}</h3>
      <p><strong>Country:</strong> ${meta.country}</p>
      <p><strong>Visitors (2024):</strong> ${meta.visitors_2024.toLocaleString()}</p>
      <p><strong>Predator index:</strong> ${meta.predator_index} / 5</p>
      <p><strong>Main species:</strong> ${meta.main_species.join(", ")}</p>
      ${
        meta.in_migration_route
          ? "<p>This park lies on or near the Great Migration route.</p>"
          : ""
      }
      <button class="storymap-btn" ${
        meta.storymap_url ? "" : "disabled"
      } onclick="${
      meta.storymap_url ? `window.open('${meta.storymap_url}', '_blank')` : ""
    }">
        ${meta.storymap_url ? "Open Story Map" : "Story Map Unavailable"}
      </button>
    `;

    renderParkList();
  }

  function matchFilter(meta, mode, keyword) {
    if (!keyword) return true;

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
function scaleVisitors(v) {
  if (!v || v <= 0) return 4;
  if (v > 800000) return 20;
  if (v > 400000) return 16;
  if (v > 200000) return 12;
  if (v > 100000) return 10;
  return 6;
}

function scalePredatorColor(index) {
  // index 1~5
  const colors = ["#f1f2d6", "#f5e2b9", "#f0c98b", "#e6b86c", "#b34b32"];
  const i = Math.max(1, Math.min(5, index)) - 1;
  return colors[i];
}
