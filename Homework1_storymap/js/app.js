document.addEventListener('DOMContentLoaded', () => {
  const chapters = Array.from(document.querySelectorAll('section.chapter'));
  const opts = { root: null, threshold: 0.55 };

  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const id = en.target.id;
      // 视觉高亮
      chapters.forEach(c => c.classList.remove('active'));
      en.target.classList.add('active');
      // 执行地图逻辑
      if (window.applyChapter) window.applyChapter(id);
    });
  }, opts);

  chapters.forEach(sec => io.observe(sec));
});
