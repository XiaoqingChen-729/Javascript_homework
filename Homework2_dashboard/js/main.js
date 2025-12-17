// main.js —— 使用 GeoJSON 画所有公园，用 CSV 提供所有公园的信息

// ===== 一些小工具函数 =====
function iso3ToCountryName(iso3) {
  const map = {
    TZA: "Tanzania",
    KEN: "Kenya",
    UGA: "Uganda",
    RWA: "Rwanda",
    BDI: "Burundi",
    ETH: "Ethiopia",
    ZAF: "South Africa",
    NAM: "Namibia",
    BWA: "Botswana",
    ZMB: "Zambia",
    ZWE: "Zimbabwe",
    MOZ: "Mozambique",
    AGO: "Angola"
  };
  return map[iso3] || iso3 || "Unknown";
}

// 从 WDPA CSV 生成所有公园的 meta 列表
function buildParksMetaFromCsv(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length <= 1) return [];

  const headers = lines[0].split(",");
  const headerIndex = {};
  headers.forEach((h, i) => {
    headerIndex[h.replace(/^\uFEFF/, "").trim()] = i; // 去 BOM
  });

  // 如果还保留 9 个重点公园的 parks-data.js，这里合并“加料”信息；没有也没关系
  const customBySiteId = new Map();
  if (typeof PARKS_META !== "undefined") {
    PARKS_META.forEach((m) => {
      if (m.wdpa_site_id != null) {
        customBySiteId.set(String(m.wdpa_site_id), m);
      }
    });
  }

  // 和你在 mapshaper 里用的一样的“可旅游公园”筛选规则
  const tourismRegex =
    /National Park|National Reserve|Nature Reserve|Wildlife Reserve|Game Reserve|Conservation Area|Conservancy/i;

  function parseLine(line) {
    const cells = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
    const obj = {};
    Object.keys(headerIndex).forEach((key) => {
      const idx = headerIndex[key];
      const raw = cells[idx] || "";
      obj[key] = raw.replace(/^"|"$/g, "");
    });
    return obj;
  }

  const metaList = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseLine(lines[i]);
    const desig = row.DESIG_ENG || "";
    const cat = row.IUCN_CAT || "";

    // 按 type + IUCN 做一次筛选（和 GeoJSON 保持一致）
    if (!tourismRegex.test(desig)) continue;
    if (cat === "Ia" || cat === "Ib") continue;

    const siteId = String(row.SITE_ID);
    const iso3 = row.ISO3;

    const baseMeta = {
      id: siteId, // 以后全部用这个 id
      name: row.NAME_ENG || row.NAME || "(Unnamed)",
      localName: row.NAME || "",
      country: iso3ToCountryName(iso3),
      countryISO3: iso3,
      desigEng: desig,
      iucnCat: cat,
      area_km2: row.REP_AREA ? Number(row.REP_AREA) : null,
      statusYear: row.STATUS_YR ? Number(row.STATUS_YR) : null,

      // 下面这些是给 9 个重点公园“加料”的字段，其它公园默认值即可
      visitors_2024: 0,
      predator_index: 0,
      has_big_five: false,
      in_migration_route: false,
      main_species: [],
      storymap_url: ""
    };

    const custom = customBySiteId.get(siteId);
    if (custom) {
      baseMeta.visitors_2024 = custom.visitors_2024 || 0;
      baseMeta.predator_index = custom.predator_index || 0;
      baseMeta.has_big_five = !!custom.has_big_five;
      baseMeta.in_migration_route = !!custom.in_migration_route;
      baseMeta.main_species = custom.main_species || [];
      baseMeta.storymap_url = custom.storymap_url || "";
    }

    metaList.push(baseMeta);
  }

  // 列表按国家 + 名称排序
  metaList.sort(
    (a, b) =>
      a.country.localeCompare(b.country) || a.name.localeCompare(b.name)
  );

  return metaList;
}

// ===== 页面入口：同时载入 GeoJSON + CSV =====
window.addEventListener("load", () => {
  const map = L.map("map", {
    zoomControl: true,
    preferCanvas: true
  }).setView([-2.1, 35.1], 7);

  L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      "© OpenStreetMap contributors, style by HOT, tiles by OSM France"
  }).addTo(map);

  map.whenReady(() => map.invalidateSize());
  window.addEventListener("resize", () => map.invalidateSize());

  Promise.all([
    fetch("./data/parks.json").then((r) => r.json()), // 你的 GeoJSON（517 个公园）
    fetch("./data/WDPA_Dec2025_Public_AF_csv.csv").then((r) =>
      r.text()
    )
  ])
    .then(([parksGeojson, csvText]) => {
      const parksMeta = buildParksMetaFromCsv(csvText);
      initDashboard(map, parksGeojson, parksMeta);
    })
    .catch((err) => {
      console.error("Failed to load data:", err);
    });
});

// ===== Dashboard 主逻辑 =====
function initDashboard(map, parksGeojson, parksMeta) {
  const parksMetaById = new Map(parksMeta.map((m) => [m.id, m]));
  const parkLayersById = new Map();
  const parkCardElementsById = new Map();
  let activeParkId = null;
  let parksLayer;

  // DOM
  const parkListEl = document.getElementById("parkList");
  const parkDetailEl = document.getElementById("parkDetail");
  const searchInput = document.getElementById("searchInput");
  const filterRadios = document.querySelectorAll('input[name="filterMode"]');
  let currentFilterMode = "country";

  // ---- 选中公园（列表 + 地图联动）----
  function setActivePark(parkId) {
    if (activeParkId === parkId) return;

    // 1. 取消旧高亮
    if (activeParkId) {
      const oldLayer = parkLayersById.get(activeParkId);
      if (oldLayer && parksLayer) {
        parksLayer.resetStyle(oldLayer);
      }
      const oldCard = parkCardElementsById.get(activeParkId);
      if (oldCard) {
        oldCard.classList.remove("active");
      }
    }

    activeParkId = parkId;

    if (parkId) {
      const newLayer = parkLayersById.get(parkId);
      if (newLayer) {
        newLayer.setStyle({
          color: "#F4A261",
          weight: 3,
          opacity: 1,
          fillColor: "#f5b581ff",
          fillOpacity: 0.40
        });
        map.fitBounds(newLayer.getBounds(), { maxZoom: 8 });
      }

      const newCard = parkCardElementsById.get(parkId);
      if (newCard) {
        newCard.classList.add("active");
        newCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }

      const meta = parksMetaById.get(parkId);
      renderParkDetail(meta);
    } else {
      renderParkDetail(null);
    }
  }

  // ---- 2.1 画所有公园多边形 ----
  parksLayer = L.geoJSON(parksGeojson, {
    style: {
      color: "#F47D85",
      weight: 1,
      opacity: 0.7,
      fillColor: "#F7D8DF",
      fillOpacity: 0.35
    },
    onEachFeature: (feature, layer) => {
      const siteId = feature.properties.SITE_ID;
      if (!siteId) return;
      const parkId = String(siteId);

      // 只保留在 CSV meta 里出现过的公园（保证两边能匹配上）
      if (!parksMetaById.has(parkId)) return;

      feature.properties.id = parkId;
      parkLayersById.set(parkId, layer);

      layer.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        setActivePark(parkId);
      });
    }
  }).addTo(map);

  // ---- 2.2 给有“加料信息”的公园画圆（如果你保留 parks-data.js）----
  parksMeta.forEach((meta) => {
    const layer = parkLayersById.get(meta.id);
    if (!layer) return;
    if (!meta.visitors_2024 || !meta.predator_index) return; // 只对 9 个重点公园画圆

    const center = layer.getBounds().getCenter();
    const radius = scaleVisitors(meta.visitors_2024);
    const fillColor = scalePredator(meta.predator_index);

    const circle = L.circleMarker(center, {
      radius,
      fillColor,
      color: fillColor,
      weight: 1,
      opacity: 0.8,
      fillOpacity: 0.6
    }).addTo(map);

    circle.on("click", (e) => {
      L.DomEvent.stopPropagation(e);
      setActivePark(meta.id);
    });

    circle.bindPopup(
      `<b>${meta.name}</b><br>` +
        (meta.visitors_2024
          ? `Visitors (2024): ${meta.visitors_2024.toLocaleString()}<br>`
          : "") +
        (meta.predator_index
          ? `Predator Index: ${meta.predator_index}/5`
          : "")
    );
  });

  // ---- 3. 右侧列表 + 详情面板 ----
  function createParkCardHtml(meta) {
    const tags = (meta.main_species || [])
      .map((s) => `<span class="tag">${s}</span>`)
      .join("");

    return `
      <div class="park-card" data-park-id="${meta.id}">
        <div class="park-card-title">${meta.name}</div>
        <div class="park-card-subtitle">
          ${meta.country} · ${meta.desigEng || ""}
        </div>
        <div class="tag-list">${tags}</div>
      </div>
    `;
  }

  function matchFilter(meta, mode, keyword) {
    if (!keyword) return true;
    keyword = keyword.toLowerCase();

    if (mode === "country") {
      return (meta.country || "").toLowerCase().includes(keyword);
    }
    if (mode === "park") {
      return (meta.name || "").toLowerCase().includes(keyword);
    }
    if (mode === "animal") {
      return (meta.main_species || [])
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    }
    return true;
  }

  function renderParkList() {
    parkListEl.innerHTML = "";
    parkCardElementsById.clear();

    const keyword = searchInput.value.toLowerCase().trim();
    const filtered = parksMeta.filter((m) =>
      matchFilter(m, currentFilterMode, keyword)
    );

    if (!filtered.length) {
      parkListEl.innerHTML = "<p>No parks found with current filter.</p>";
      return;
    }

    filtered.forEach((meta) => {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = createParkCardHtml(meta).trim();
      const cardElement = tempDiv.firstChild;

      parkCardElementsById.set(meta.id, cardElement);

      cardElement.addEventListener("click", () => {
        setActivePark(meta.id);
      });

      if (meta.id === activeParkId) {
        cardElement.classList.add("active");
      }

      parkListEl.appendChild(cardElement);
    });
  }

  function renderParkDetail(meta) {
    if (!meta) {
      parkDetailEl.innerHTML =
        "<p>Select a park on the map or from the list.</p>";
      return;
    }

    const migrationTag = meta.in_migration_route
      ? '<span class="tag">On Migration Route</span>'
      : "";
    const bigFiveTag = meta.has_big_five
      ? '<span class="tag">Big Five Area</span>'
      : "";
    const mainSpecies = (meta.main_species || []).join(", ");

    parkDetailEl.innerHTML = `
      <h3>${meta.name}</h3>
      <p class="detail-subtitle">${meta.country}</p>
      <div class="tag-list detail-tags">
        ${migrationTag}
        ${bigFiveTag}
      </div>

      <div class="detail-stats">
        <p><strong>Type:</strong> ${meta.desigEng || "N/A"} (IUCN ${
      meta.iucnCat || "N/A"
    })</p>
        <p><strong>Reported area:</strong> ${
          meta.area_km2 ? meta.area_km2.toLocaleString() + " km²" : "N/A"
        }</p>
        <p><strong>Year established:</strong> ${
          meta.statusYear || "N/A"
        }</p>
        ${
          meta.visitors_2024
            ? `<p><strong>Visitors (2024):</strong> ${meta.visitors_2024.toLocaleString()}</p>`
            : ""
        }
        ${
          meta.predator_index
            ? `<p><strong>Predator Index:</strong> ${meta.predator_index} / 5</p>`
            : ""
        }
        ${
          mainSpecies
            ? `<p><strong>Key Species:</strong> ${mainSpecies}</p>`
            : ""
        }
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

  // ---- 4. 事件绑定 ----
  searchInput.addEventListener("input", renderParkList);
  filterRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      currentFilterMode = radio.value;
      renderParkList();
    });
  });

  renderParkList();
}

// ======== 原来的两个映射函数保留 ========
// 游客数 -> 圆半径（只对有 visitors_2024 的公园生效）
function scaleVisitors(v) {
  if (!v) return 0;
  const maxVisitors = 600000; // 可以根据需要改
  const minRadius = 5;
  const maxRadius = 15;
  const normalized = Math.min(v / maxVisitors, 1);
  return minRadius + normalized * (maxRadius - minRadius);
}

// 捕食者指数 -> 颜色
function scalePredator(p) {
  if (!p) return "#ccc";
  const colorMap = {
    1: "#b7d6a5",
    2: "#8bb96d",
    3: "#d0893b",
    4: "#b56930",
    5: "#9b5a2c"
  };
  return colorMap[p] || "#ccc";
}
