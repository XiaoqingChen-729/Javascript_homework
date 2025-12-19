// js/main.js

window.addEventListener("load", async () => {
  // 1. 初始化地图
  const map = await MapModule.initMap();

  // 2. 初始化设计交互
  DesignModule.initDesignInteractions(map);
  DesignModule.updateDesignSummary();

  // 3. 工具按钮切换
  const toolButtons = document.querySelectorAll(".tool-button");
  toolButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tool = btn.dataset.tool;
      DesignModule.setCurrentTool(tool);

      // 切换高亮状态
      toolButtons.forEach((b) =>
        b.classList.toggle("active", b === btn)
      );
    });
  });

  // 4. 清空设计按钮
  const clearBtn = document.getElementById("btn-clear-design");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      DesignModule.clearCurrentDesign();
      toolButtons.forEach((b) => b.classList.remove("active"));
    });
  }

  // 5. 计算评分按钮
  const scoreBtn = document.getElementById("btn-calc-score");
  if (scoreBtn) {
    scoreBtn.addEventListener("click", () => {
      DesignModule.renderScore();
    });
  }
});
