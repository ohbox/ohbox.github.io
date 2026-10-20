(() => {
  const factor = (token) => {
    if (token === "center") return 0.5;
    if (token === "right" || token === "bottom") return 1;
    if (token === "left" || token === "top") return 0;
    const value = Number.parseFloat(token);
    return Number.isFinite(value) ? value / 100 : 0;
  };
  const place = () => document.querySelectorAll("[data-gopublics-screen]").forEach((screen) => {
    const frame = screen.parentElement;
    const overlay = frame.querySelector("[data-gopublics-logo]");
    if (!screen.naturalWidth || !overlay) return;
    const rect = frame.getBoundingClientRect();
    const style = getComputedStyle(screen);
    const scale = style.objectFit === "contain"
      ? Math.min(rect.width / screen.naturalWidth, rect.height / screen.naturalHeight)
      : Math.max(rect.width / screen.naturalWidth, rect.height / screen.naturalHeight);
    const renderedWidth = screen.naturalWidth * scale;
    const renderedHeight = screen.naturalHeight * scale;
    const positions = style.objectPosition.split(" ").filter(Boolean);
    const xPosition = positions[0] || "center";
    const yPosition = positions[1] || "center";
    const parts = overlay.dataset.gopublicsLogo.split(",").map(Number);
    const x = parts[0], y = parts[1], width = parts[2], height = parts[3];
    const left = (rect.width - renderedWidth) * factor(xPosition) + x * scale;
    const top = (rect.height - renderedHeight) * factor(yPosition) + y * scale;
    overlay.style.transform = "translate(" + left + "px, " + top + "px)";
    overlay.style.width = width * scale + "px";
    overlay.style.height = height * scale + "px";
  });
  document.querySelectorAll("[data-gopublics-screen]").forEach((screen) => {
    screen.addEventListener("load", place);
    if (screen.complete) place();
  });
  window.addEventListener("resize", place, { passive: true });
  place();
})();