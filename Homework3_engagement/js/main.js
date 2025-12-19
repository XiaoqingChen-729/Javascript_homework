let map;              
let currentTool = ""; // 以后画旅馆 / 停车场 / 观景区用

// ================================
// 1. 初始化地图
// ================================
async function initMap() {
  map = L.map("map", {
    zoomControl: true,
    preferCanvas: true
  }).setView([-2.1, 35.1], 7); 

  L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      "© OpenStreetMap contributors · style by HOT · tiles by OSM France"
  }).addTo(map);

  // 地图准备好之后，再初始化工具和交互
  initDesignTools();
  initScorePanel();
}

// ================================
// 2. 左下角“工具栏”交互（只是示例）
// ================================
function initDesignTools() {
  const lodgeBtn   = document.getElementById("tool-lodge");
  const parkingBtn = document.getElementById("tool-parking");
  const viewBtn    = document.getElementById("tool-view");

  function setActiveTool(toolName) {
    currentTool = toolName;

    // 切换按钮高亮
    [lodgeBtn, parkingBtn, viewBtn].forEach((btn) =>
      btn.classList.remove("is-active")
    );
    if (toolName === "lodge")   lodgeBtn.classList.add("is-active");
    if (toolName === "parking") parkingBtn.classList.add("is-active");
    if (toolName === "view")    viewBtn.classList.add("is-active");
  }

  lodgeBtn.addEventListener("click", () => setActiveTool("lodge"));
  parkingBtn.addEventListener("click", () => setActiveTool("parking"));
  viewBtn.addEventListener("click", () => setActiveTool("view"));

  // 在地图上点一下，根据当前工具在那里“放”一个标记（先做一个最简单版本）
  map.on("click", (e) => {
    if (!currentTool) return;

    let color = "#f47d85";
    let label = "";

    if (currentTool === "lodge") {
      label = "Lodge";
      color = "#f47d85";
    } else if (currentTool === "parking") {
      label = "Parking";
      color = "#8c8c8c";
    } else if (currentTool === "view") {
      label = "View";
      color = "#4c8bf5";
    }

    L.circleMarker(e.latlng, {
      radius: 8,
      color,
      weight: 2,
      fillColor: color,
      fillOpacity: 0.7
    })
      .addTo(map)
      .bindTooltip(label, { permanent: false, direction: "top" });
  });
}

// ================================
// 3. 右侧“得分”区域示例
// ================================
function initScorePanel() {
  const scoreText = document.getElementById("score-text");
  const btnCalc   = document.getElementById("btn-calc-score");

  btnCalc.addEventListener("click", () => {
    // 现在先写死一个假分数，后面你可以根据用户设计来算
    scoreText.textContent = "Your design score: 72 / 100 (demo)";
  });
}

// ================================
// 4. 页面加载完之后启动
// ================================
document.addEventListener("DOMContentLoaded", () => {
  initMap().catch((err) => console.error(err));
});
