
(function () {
  const bar = document.getElementById("readingProgress");
  if (!bar) return;

  function updateProgress() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;

    const percent = docHeight > 0
      ? (scrollTop / docHeight) * 100
      : 0;

    bar.style.width = percent + "%";
  }

  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();
})();