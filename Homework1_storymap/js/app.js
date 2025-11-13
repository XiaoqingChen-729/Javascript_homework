document.addEventListener('DOMContentLoaded', () => {
  const chapters = Array.from(document.querySelectorAll('section.chapter'));
  if (!chapters.length) return;

  let activeChapter = null;
  let observer = null;
  const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);
  let resizeTimer = null;

  const narrowScreenQuery = window.matchMedia('(max-width: 680px)');

  function computeRootMargin() {
    if (narrowScreenQuery.matches) {
      // 将观察区域压到屏幕底部，匹配缩小的阅读窗口
      return '-55% 0px -12% 0px';
    }
    return '-40% 0px -40% 0px';
  }

  function setActiveChapter(target) {
    if (!target) return;
    if (activeChapter === target) {
      activeChapter.classList.add('active');
      return;
    }

    if (activeChapter) activeChapter.classList.remove('active');
    activeChapter = target;
    activeChapter.classList.add('active');

    if (window.applyChapter) {
      window.applyChapter(activeChapter.id);
    } else {
      window.__pendingChapterId = activeChapter.id;
    }
  }

  function handleEntries(entries) {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

    if (!visible.length) return;

    setActiveChapter(visible[0].target);
  }

  function setupObserver() {
    if (observer) observer.disconnect();

    observer = new IntersectionObserver(handleEntries, {
      root: null,
      threshold: thresholds,
      rootMargin: computeRootMargin()
    });

    chapters.forEach(chapter => observer.observe(chapter));
  }

  function scheduleObserverRefresh() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      setupObserver();
      setActiveChapter(activeChapter || chapters[0]);
    }, 120);
  }

  setupObserver();
  setActiveChapter(chapters[0]);

  if (typeof narrowScreenQuery.addEventListener === 'function') {
    narrowScreenQuery.addEventListener('change', scheduleObserverRefresh);
  } else if (typeof narrowScreenQuery.addListener === 'function') {
    narrowScreenQuery.addListener(scheduleObserverRefresh);
  }

  window.addEventListener('resize', scheduleObserverRefresh);
});

