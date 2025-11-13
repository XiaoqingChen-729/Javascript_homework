// js/map.js
window.addEventListener('load', () => {
  // 1) 初始化地图到东非
  const map = L.map('map', { zoomControl: true, preferCanvas: true })
    .setView([-2.1, 35.1], 7);  // Mara-Serengeti 作为初始视角

  L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors, style by HOT, tiles by OSM France'
}).addTo(map);

  // 2) 画一个“测试点”，确认地图正常显示
  L.circleMarker([-1.29, 36.82], {
    radius: 6, color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.8
  }).addTo(map).bindTooltip('Test: Nairobi');

  // 3) 一个小工具：加载 GeoJSON 并加到地图，带错误提示
  const LAYERS = {};
  let currentChapterId = null;

  // Mara-Serengeti 范围界限图层（用于引导页聚焦区域）
   const maraSerengetiBoundary = L.circle([-2.2, 35.15], {
    radius: 190000,
    color: '#16a34a',
    weight: 2,
    opacity: 0.9,
    fillColor: '#16a34a',
    fillOpacity: 0.25
  }).addTo(map);
  maraSerengetiBoundary.__baseOpacity = maraSerengetiBoundary.options.opacity ?? 1;
  maraSerengetiBoundary.__baseFillOpacity = maraSerengetiBoundary.options.fillOpacity ?? 1;
  LAYERS['Mara_Serengeti_Boundary'] = maraSerengetiBoundary;

  function setLayerOpacity(layerId, opacity) {
  const layer = LAYERS[layerId];
  if (!layer) return;

  const apply = (l) => {
    // 向量要素（Path 类型）优先用 setStyle
    if (typeof l.setStyle === 'function') {
      l.setStyle({ opacity, fillOpacity: opacity });
    } else if (typeof l.setOpacity === 'function') {
      // 个别插件/瓦片图层可能只有 setOpacity
      l.setOpacity(opacity);
    }
  };

  if (typeof layer.eachLayer === 'function') {
    // FeatureGroup / GeoJSON
    layer.eachLayer(apply);
  } else {
    // Circle / Marker / Polygon 等单图层
    apply(layer);
  }
}
  const trackFeaturesBySource = new Map();
  let trackLayer = null;
  let requestedTrackSource = 'ALL';

  function ensureTrackLayer() {
    if (trackLayer) return trackLayer;
    trackLayer = L.geoJSON({
      type: 'FeatureCollection',
      features: []
    }, {
      style: { color: '#0ea5e9', weight: 1.2, opacity: 0.6 }
    }).addTo(map);

    LAYERS['Wildebeest_Tracks'] = trackLayer;
    return trackLayer;
  }

  function setTrackLayerData(features) {
    const layer = ensureTrackLayer();
    layer.clearLayers();
    if (Array.isArray(features) && features.length > 0) {
      layer.addData({
        type: 'FeatureCollection',
        features
      });
    }
    reapplyFocusIfNeeded('Wildebeest_Tracks');
  }

  function updateTrackLayerFor(pointLayerId) {
    requestedTrackSource = pointLayerId ?? 'ALL';
    if (!trackFeaturesBySource.size) return;

    const features =
      trackFeaturesBySource.get(requestedTrackSource) ||
      trackFeaturesBySource.get('ALL') ||
      [];

    setTrackLayerData(features);
  }


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
        console.error(`GeoJSON load failed: ${id} <- ${url}\n`, err);
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
      .catch(err => console.error(`GeoJSON load failed: ${id} <- ${url}\n`, err));
  }

  // 4) 加载你的数据（路径以 index.html 为基准）
  addPointLayer("Tsavo_Lion",            "data/tsavo_lion_points.geojson",                   "#ef4444");
  addLineLayer ("Tsavo_Lion_Tracks",     "data/tsavo_lion_tracks.geojson",                   "#f87171");
  addPointLayer("Wildebeest_Tanzania_BG","data/wildebeest_tanzania_points_sampled.geojson",  "#94a3b8");

  ensureTrackLayer();

  fetch('data/wildebeest_mara_2017_2021_points.geojson')
  .then(r => r.json())
  .then(gj => {
    const F = Array.isArray(gj.features) ? gj.features : [];
    const eatMonth = ts => {
      const t = new Date(ts || (typeof ts === 'number' ? ts : 0));
      const eat = new Date(t.getTime() + 3 * 3600 * 1000);
      return eat.getUTCMonth() + 1; // 1-12
    };

    const allTrackEntries = new Map();

    const collectTrackEntry = (feature, fallbackIndex, targetMap) => {
      if (!feature || feature.geometry?.type !== 'Point') return;

      const coords = feature.geometry?.coordinates;
      if (!Array.isArray(coords) || coords.length < 2) return;

      const properties = feature.properties || {};
      const individualId = properties.individual_id || properties.tag_id || 'unknown';
      const tsRaw = properties.timestamp || properties.time || properties.Timestamp;
      const parsedTs = tsRaw ? Date.parse(tsRaw) : NaN;
      const ts = Number.isFinite(parsedTs) ? parsedTs : fallbackIndex;

      const bucket = targetMap.get(individualId);
      if (bucket) {
        bucket.push({ coords, ts, properties });
      } else {
        targetMap.set(individualId, [{ coords, ts, properties }]);
      }
    };

    const buildTrackFeatures = entryMap => {
      const features = [];
      entryMap.forEach((entries, id) => {
        if (!Array.isArray(entries) || entries.length < 2) return;
        entries.sort((a, b) => a.ts - b.ts);

        const baseProps = entries[0].properties || {};
        features.push({
          type: 'Feature',
          properties: {
            species: baseProps.species || 'Wildebeest',
            individual_id: id,
            study: baseProps.study,
            cleaned: true,
            point_count: entries.length
          },
          geometry: {
            type: 'LineString',
            coordinates: entries.map(e => e.coords)
          }
        });
      });
      return features;
    };

    const makeSeasonLayer = (id, predicate, color) => {
      const subsetFeatures = [];
      const seasonEntries = new Map();

      F.forEach((f, idx) => {
        const time =
          f.properties.timestamp || f.properties.time || f.properties['timestamp'];
        const ok = predicate(f, time);
        if (ok) {
          subsetFeatures.push(f);
          collectTrackEntry(f, idx, seasonEntries);
          collectTrackEntry(f, idx, allTrackEntries);
        }
      });

      const subset = {
        type: 'FeatureCollection',
        features: subsetFeatures
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

      const seasonTracks = buildTrackFeatures(seasonEntries);
      trackFeaturesBySource.set(id, seasonTracks);
      if (requestedTrackSource === id) updateTrackLayerFor(id);
    };

    const wet = (f, t) => {
      const m = eatMonth(t);
      const lat = f.geometry.coordinates[1];
      return [12, 1, 2].includes(m) && lat < -1;
    };

    const shortRains = (_, t) => [10, 11].includes(eatMonth(t));
    const aprMay = (_, t) => [4, 5].includes(eatMonth(t));
    const dry =   (_, t) => [6, 7, 8, 9].includes(eatMonth(t));

    makeSeasonLayer('Wildebeest_Dry_clean',        dry,        '#633a06bb');
    setLayerOpacity('Wildebeest_Dry_clean', 0);
    makeSeasonLayer('Wildebeest_Short_clean',      shortRains, '#60a4f8ff');
    setLayerOpacity('Wildebeest_Short_clean', 0);
    makeSeasonLayer('Wildebeest_Wet_clean',        wet,        '#063d57ff');
    setLayerOpacity('Wildebeest_Wet_clean', 0);
    makeSeasonLayer('Wildebeest_AprMay',           aprMay,     '#f59e0b');
    setLayerOpacity('Wildebeest_AprMay', 0);
    

    trackFeaturesBySource.set('ALL', buildTrackFeatures(allTrackEntries));
    updateTrackLayerFor(requestedTrackSource);
  })
  .catch(e => console.error('load master points failed:', e));
  
  // 5) 暴露给 app.js 的章节切换函数
  window.applyChapter = function applyChapter(chapterId) {
    const chapter = window.storyConfig?.chapters?.find(c => c.id === chapterId);
    if (!chapter) return;

    currentChapterId = chapterId;

    const trackSource = chapter.trackSource ??
      (chapter.focusLayers || []).find(id => trackFeaturesBySource.has(id));
    updateTrackLayerFor(trackSource);

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

    (chapter.onChapterEnter || []).forEach(({ layer, opacity }) => setLayerOpacity(layer, opacity));
    (chapter.onChapterExit  || []).forEach(({ layer, opacity }) => setLayerOpacity(layer, opacity));
  };
});
