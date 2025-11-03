// js/map.js
window.addEventListener('load', () => {
  // 1) 初始化地图到东非
  const map = L.map('map', { zoomControl: true, preferCanvas: true })
    .setView([-1.29, 36.82], 6); // Nairobi 作为初始视角

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  // 2) 画一个“测试点”，确认地图正常显示
  L.circleMarker([-1.29, 36.82], {
    radius: 6, color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.8
  }).addTo(map).bindTooltip('Test: Nairobi');

  // 3) 一个小工具：加载 GeoJSON 并加到地图，带错误提示
  const LAYERS = {};
  function addPointLayer(id, url, color) {
    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error(`[${r.status}] ${r.statusText} : ${url}`);
        return r.json();
      })
      .then(gj => {
        const layer = L.geoJSON(gj, {
          pointToLayer: (f, latlng) => L.circleMarker(latlng, {
            radius: 2, color, weight: 1, opacity: 0.8, fillColor: color, fillOpacity: 0.6
          })
        }).addTo(map);
        LAYERS[id] = layer;
        console.log(`✅ Loaded: ${id} <- ${url}  (features: ${gj.features?.length ?? 'unknown'})`);
      })
      .catch(err => {
        console.error(`❌ GeoJSON load failed: ${id} <- ${url}\n`, err);
      });
  }
  function addLineLayer(id, url, color) {
    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error(`[${r.status}] ${r.statusText} : ${url}`);
        return r.json();
      })
      .then(gj => {
        const layer = L.geoJSON(gj, { style: { color, weight: 1, opacity: 0.7 } }).addTo(map);
        LAYERS[id] = layer;
        console.log(`✅ Loaded: ${id} <- ${url}  (features: ${gj.features?.length ?? 'unknown'})`);
      })
      .catch(err => console.error(`❌ GeoJSON load failed: ${id} <- ${url}\n`, err));
  }

  // 4) 加载你的数据（路径以 index.html 为基准）
  addPointLayer("Wildebeest_Dry",        "data/wildebeest_mara_dry_season_points.geojson",   "#2563eb");
  addPointLayer("Wildebeest_ShortRains", "data/wildebeest_mara_short_rains_points.geojson",  "#1d4ed8");
  addPointLayer("Wildebeest_Wet",        "data/wildebeest_mara_wet_season_points.geojson",   "#0ea5e9");
  addLineLayer ("Wildebeest_Tracks",     "data/wildebeest_mara_2017_2021_tracks.geojson",    "#0ea5e9");

  addPointLayer("Tsavo_Lion",            "data/tsavo_lion_points.geojson",                   "#ef4444");
  addPointLayer("Wildebeest_Tanzania_BG","data/wildebeest_tanzania_points_sampled.geojson",  "#94a3b8");

  // 5) 暴露给 app.js 的章节切换函数
  function setOpacity(layerId, opacity) {
    const layer = LAYERS[layerId];
    if (!layer) return;
    layer.eachLayer(l => {
      if (l.setStyle) l.setStyle({ opacity, fillOpacity: opacity });
    });
  }

  window.applyChapter = function applyChapter(chapterId) {
    const chapter = window.storyConfig?.chapters?.find(c => c.id === chapterId);
    if (!chapter) return;

    const { center, zoom } = chapter.location;
    map.flyTo([center[1], center[0]], zoom, { duration: 1.0 });

    (chapter.onChapterEnter || []).forEach(({ layer, opacity }) => setOpacity(layer, opacity));
    (chapter.onChapterExit  || []).forEach(({ layer, opacity }) => setOpacity(layer, opacity));
  };
});
