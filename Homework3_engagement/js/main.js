/* Mara-Serengeti Design Studio
   Fixes:
   - Works whether JS is loaded from /js or root
   - Doesn't crash if tool/score DOM ids differ
   - Shows a helpful status message when Leaflet / tiles can't load
*/

let map;
let currentTool = "";
let activeTileLayer = null;

const TILE_SOURCES = [
  {
    name: "OSM HOT",
    url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    options: {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors · style by HOT · tiles by OSM France",
    },
  },
  {
    name: "OSM Standard",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    options: {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors",
    },
  },
  {
    name: "Carto Light",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    options: {
      maxZoom: 19,
      subdomains: "abcd",
      attribution: "© OpenStreetMap contributors · © CARTO",
    },
  },
];

function $(id) {
  return document.getElementById(id);
}

function setMapStatus(text, type = "info") {
  const el = $("mapStatus");
  if (!el) return;
  el.textContent = text;
  el.classList.remove("is-error", "is-ok");
  if (type === "error") el.classList.add("is-error");
  if (type === "ok") el.classList.add("is-ok");
}

function hideMapStatus() {
  const el = $("mapStatus");
  if (!el) return;
  el.style.opacity = "0";
  el.style.transform = "translate(-50%, -50%) scale(0.98)";
  el.style.pointerEvents = "none";
}

async function waitForLeaflet(timeoutMs = 6000) {
  if (window.L) return;
  const started = Date.now();
  await new Promise((resolve, reject) => {
    const t = setInterval(() => {
      if (window.L) {
        clearInterval(t);
        resolve();
        return;
      }
      if (Date.now() - started > timeoutMs) {
        clearInterval(t);
        reject(new Error("Leaflet library not loaded"));
      }
    }, 50);
  });
}

function attachTileHealth(layer, sourceIndex) {
  let errorCount = 0;
  const createdAt = Date.now();

  layer.on("loading", () => {
    setMapStatus(`Loading map tiles… (${TILE_SOURCES[sourceIndex].name})`);
  });

  layer.on("load", () => {
    // Tiles loaded successfully
    hideMapStatus();
  });

  layer.on("tileerror", () => {
    errorCount += 1;

    // If we quickly see many errors, try next tile source.
    const elapsed = Date.now() - createdAt;
    if (elapsed < 8000 && errorCount >= 8) {
      const next = sourceIndex + 1;
      if (next < TILE_SOURCES.length) {
        setMapStatus(
          `Tile load failed (${TILE_SOURCES[sourceIndex].name}). Switching…`,
          "error"
        );
        useTileSource(next);
      } else {
        setMapStatus(
          "Tiles failed to load. If you're offline or your network blocks map CDNs, the canvas will stay in blueprint mode.",
          "error"
        );
      }
    }
  });
}

function useTileSource(index) {
  if (!map) return;
  const src = TILE_SOURCES[index];

  if (activeTileLayer) {
    try {
      map.removeLayer(activeTileLayer);
    } catch (_) {
      // ignore
    }
  }

  activeTileLayer = L.tileLayer(src.url, src.options);
  attachTileHealth(activeTileLayer, index);
  activeTileLayer.addTo(map);
}

function initMap() {
  const mapEl = $("map");
  if (!mapEl) {
    console.error("#map element not found");
    return;
  }

  setMapStatus("Initializing map…");

  // Create map
  map = L.map("map", {
    zoomControl: true,
    preferCanvas: true,
  }).setView([-2.1, 35.1], 7);

  // Try tile sources (with auto fallback)
  useTileSource(0);

  // Fix occasional blank render when container sizes settle after fonts load
  setTimeout(() => map.invalidateSize(), 50);
  window.addEventListener("resize", () => map.invalidateSize());

  initDesignTools();
  initScorePanel();
  initSaveBrief();
  initViewModeChips();
}

function initViewModeChips() {
  const chips = Array.from(document.querySelectorAll('.ghost-chip[data-view]'));
  const mapEl = $("map");
  if (!chips.length || !mapEl) return;

  chips.forEach((btn) => {
    btn.addEventListener("click", () => {
      chips.forEach((b) => b.classList.remove("ghost-chip--active"));
      btn.classList.add("ghost-chip--active");

      const view = btn.getAttribute("data-view");
      mapEl.setAttribute("data-mode", view);

      // Small UX hint
      if (view === "design") setMapStatus("Design view: place facilities on the canvas.", "ok");
      if (view === "habitat") setMapStatus("Habitat view: imagine animal corridors & core zones.", "ok");
      if (view === "traffic") setMapStatus("Traffic view: think about routes & congestion.", "ok");
      setTimeout(hideMapStatus, 900);
    });
  });
}

function initDesignTools() {
  const toolButtons = Array.from(document.querySelectorAll('.tool-button[data-tool]'));

  const setActiveTool = (toolName) => {
    currentTool = toolName;
    toolButtons.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.tool === toolName));
  };

  toolButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      setActiveTool(btn.dataset.tool || "");
    });
  });

  // Place markers on click
  map.on("click", (e) => {
    if (!currentTool) return;

    const spec = {
      lodge: { label: "Lodge", color: "#d86e5b" },
      parking: { label: "Parking", color: "#6f6f6f" },
      restaurant: { label: "Restaurant", color: "#e7a868" },
      view: { label: "Viewpoint", color: "#6aa3d7" },
    };

    const s = spec[currentTool] || { label: currentTool, color: "#7c5b39" };

    L.circleMarker(e.latlng, {
      radius: 8,
      color: s.color,
      weight: 2,
      fillColor: s.color,
      fillOpacity: 0.85,
    })
      .addTo(map)
      .bindTooltip(s.label, { permanent: false, direction: "top" });

    // Light “engagement” feedback
    const scoreText = $("design-score") || $("score-text");
    if (scoreText) {
      scoreText.textContent = `Placed: ${s.label}. Eco↘ / Joy↗ (demo feedback).`;
    }
  });
}

function initScorePanel() {
  const scoreText = $("design-score") || $("score-text");
  const btnCalc = $("btn-calc-score");

  if (!btnCalc) return;

  btnCalc.addEventListener("click", () => {
    if (!scoreText) return;

    // Demo score text (replace with real model later)
    scoreText.textContent =
      "Design brief (demo): You preserved 85% habitat continuity. Visitors have a 90% chance to see a full migration.";
  });
}

function initSaveBrief() {
  const btnSave = $("btn-save-design");
  if (!btnSave) return;

  btnSave.addEventListener("click", () => {
    const modal = $("briefModal");
    if (!modal) return;
    modal.classList.add("is-open");
  });

  const closeBtn = $("briefClose");
  closeBtn?.addEventListener("click", () => {
    $("briefModal")?.classList.remove("is-open");
  });

  $("briefModal")?.addEventListener("click", (e) => {
    if (e.target?.id === "briefModal") {
      $("briefModal")?.classList.remove("is-open");
    }
  });
}

// Boot
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await waitForLeaflet();
    initMap();
  } catch (err) {
    console.error(err);
    setMapStatus(
      "Leaflet failed to load. If your network blocks CDNs, try a different CDN or run with internet access.",
      "error"
    );
  }
});
