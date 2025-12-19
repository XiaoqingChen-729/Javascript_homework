// js/map.js

let map;
let designLayer; // 专门放用户设计的设施
let parkBoundaryLayer; // Mara–Serengeti 边界（可选）

async function initMap() {
  // 创建地图，锁定 Mara–Serengeti 区域
  map = L.map("map", {
    zoomControl: true,
    preferCanvas: true
  }).setView([-2.1, 35.1], 7); // 你现在 dashboard 用的视角

  // 底图（和你 dashboard 一样）
  L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      "© OpenStreetMap contributors · style by HOT · tiles by OSM France"
  }).addTo(map);

  // 用户设计的设施层
  designLayer = L.layerGroup().addTo(map);

  // 可选：加载 Mara–Serengeti 边界（以后你把 geojson 放到 data/ 目录）
  try {
    const resp = await fetch("./data/mara-serengeti.geojson");
    if (resp.ok) {
      const geojson = await resp.json();
      parkBoundaryLayer = L.geoJSON(geojson, {
        style: {
          color: "#f47d85",
          weight: 2,
          fillColor: "#f9d8d8",
          fillOpacity: 0.18
        }
      }).addTo(map);

      // 调整视野以适应边界
      map.fitBounds(parkBoundaryLayer.getBounds().pad(0.1));
    }
  } catch (err) {
    console.warn("Could not load mara-serengeti.geojson:", err);
  }

  return map;
}

// 提供给 design.js 使用：往 designLayer 里加设施
function addDesignMarker(lat, lng, color) {
  return L.circleMarker([lat, lng], {
    radius: 6,
    color,
    weight: 2,
    fillColor: color,
    fillOpacity: 0.85
  }).addTo(designLayer);
}

function clearDesignMarkers() {
  if (designLayer) designLayer.clearLayers();
}

// 暴露给其他脚本
window.MapModule = {
  initMap,
  addDesignMarker,
  clearDesignMarkers,
  getMap: () => map
};
