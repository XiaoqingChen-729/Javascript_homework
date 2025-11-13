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
  let currentChapterId = null;

  function focusOnLayers(layerIds, focusOptions = {}) {
    if (!Array.isArray(layerIds) || layerIds.length === 0) return false;

    let combinedBounds = null;
    layerIds.forEach(id => {
      const layer = LAYERS[id];
      if (!layer || typeof layer.getBounds !== 'function') return;
      const layerBounds = layer.getBounds();
      if (!layerBounds || !layerBounds.isValid?.()) return;
      combinedBounds = combinedBounds ? combinedBounds.extend(layerBounds) : layerBounds;
    });

    if (!combinedBounds) return false;

    const padding = focusOptions.padding;
    const paddingValue = Array.isArray(padding)
      ? L.point(padding[0], padding[1])
      : padding;

    map.flyToBounds(combinedBounds, {
      padding: paddingValue ?? L.point(60, 60),
      maxZoom: focusOptions.maxZoom ?? 9,
      duration: focusOptions.duration ?? 1.0
    });

    return true;
  }

  function reapplyFocusIfNeeded(layerId) {
    if (!currentChapterId) return;
    const chapter = window.storyConfig?.chapters?.find(c => c.id === currentChapterId);
    if (!chapter) return;
    if (!Array.isArray(chapter.focusLayers)) return;
    if (!chapter.focusLayers.includes(layerId)) return;
    focusOnLayers(chapter.focusLayers, {
      padding: chapter.focusPadding,
      maxZoom: chapter.focusMaxZoom,
      duration: chapter.focusDuration
    });
  }
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
        reapplyFocusIfNeeded(id);
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
        reapplyFocusIfNeeded(id);
      })
      .catch(err => console.error(`❌ GeoJSON load failed: ${id} <- ${url}\n`, err));
  }

  // 4) 加载你的数据（路径以 index.html 为基准）
  addPointLayer("Wildebeest_Dry",        "data/wildebeest_mara_dry_season_points.geojson",   "#2563eb");
  addPointLayer("Wildebeest_ShortRains", "data/wildebeest_mara_short_rains_points.geojson",  "#1d4ed8");
  addPointLayer("Wildebeest_Wet",        "data/wildebeest_mara_wet_season_points.geojson",   "#0ea5e9");
  addLineLayer ("Wildebeest_Tracks",     "data/wildebeest_mara_2017_2021_tracks.geojson",    "#0ea5e9");

  addPointLayer("Tsavo_Lion",            "data/tsavo_lion_points.geojson",                   "#ef4444");
  addLineLayer ("Tsavo_Lion_Tracks",     "data/tsavo_lion_tracks.geojson",                   "#f87171");
  addPointLayer("Wildebeest_Tanzania_BG","data/wildebeest_tanzania_points_sampled.geojson",  "#94a3b8");

  fetch('data/wildebeest_mara_2017_2021_points.geojson')
  .then(r => r.json())
  .then(gj => {
    const F = gj.features;
    const eatMonth = ts => {
      const t = new Date(ts || (typeof ts === 'number' ? ts : 0));
      const eat = new Date(t.getTime() + 3 * 3600 * 1000);
      return eat.getUTCMonth() + 1; // 1-12
    };

    const makeSeasonLayer = (id, predicate, color) => {
      const subset = {
        type: 'FeatureCollection',
        features: F.filter(f => {
          const time =
            f.properties.timestamp || f.properties.time || f.properties['timestamp'];
          const ok = predicate(f, time);
          return !!ok;
        })
      };
      const layer = L.geoJSON(subset, {
        pointToLayer: (_, latlng) =>
          L.circleMarker(latlng, {
            radius: 2,
            color,
            weight: 0.8,
            fillColor: color,
            fillOpacity: 0.6
          })
      }).addTo(map);
      LAYERS[id] = layer;
      console.log(`season layer: ${id} -> ${subset.features.length} pts`);
      reapplyFocusIfNeeded(id);
    };

    const wet = (f, t) => {
      const m = eatMonth(t);
      const lat = f.geometry.coordinates[1];
      return [12, 1, 2].includes(m) && lat < -1;
    };

    const shortRains = (_, t) => [10, 11].includes(eatMonth(t));
    const aprMay = (_, t) => [4, 5].includes(eatMonth(t));
    const dry =   (_, t) => [6, 7, 8, 9].includes(eatMonth(t));

    makeSeasonLayer('Wildebeest_Wet_clean',        wet,        '#0a73a3ff');
    makeSeasonLayer('Wildebeest_Short_clean',      shortRains, '#60a4f8ff');
    makeSeasonLayer('Wildebeest_AprMay',           aprMay,     '#f59e0b');
    makeSeasonLayer('Wildebeest_Dry_clean',        dry,        '#f08b07bb');

    // 也可把轨迹线淡化叠加，增强“连贯感”
    if (LAYERS['Wildebeest_Tracks']) {
      LAYERS['Wildebeest_Tracks'].setStyle({ opacity: 0.25 });
    }
  })
  .catch(e => console.error('load master points failed:', e));
  
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

    currentChapterId = chapterId;

    const focusDidRun = focusOnLayers(chapter.focusLayers, {
      padding: chapter.focusPadding,
      maxZoom: chapter.focusMaxZoom,
      duration: chapter.focusDuration
    });

    const { center, zoom, bounds, padding } = chapter.location;
    if (bounds) {
      const [[minLng, minLat], [maxLng, maxLat]] = bounds;
      const sw = [minLat, minLng];
      const ne = [maxLat, maxLng];
      map.flyToBounds([sw, ne], {
        duration: 1.0,
        padding: padding || [20, 20]
      });
    } else if (center && zoom) {
      map.flyTo([center[1], center[0]], zoom, { duration: 1.0 });
    }

    (chapter.onChapterEnter || []).forEach(({ layer, opacity }) => setOpacity(layer, opacity));
    (chapter.onChapterExit  || []).forEach(({ layer, opacity }) => setOpacity(layer, opacity));
  };
});
