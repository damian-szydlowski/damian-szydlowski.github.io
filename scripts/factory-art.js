/** Original Canvas2D interpretation of the supplied HandArt hexdump recipe.
 * This is a focused hero renderer, not a multi-mode image editor.
 * All image sampling is cached; animation only composites and changes a few glyphs.
 */
export const factoryRecipe = {
  renderMode: "hexdump", bgMode: "solid", background: "#0b0d0f", bgBlur: 12, bgOpacity: 100,
  cellSize: 12, coverage: 93, invert: false, density: 0, edgeEmphasis: 40,
  brightness: 0, contrast: 105, saturation: 100, grayscale: 0,
  tint: "#dc653a", tintOpacity: 18, overlayBlend: "overlay", styleBlend: "source-over",
  animated: true, animStyle: "flicker", animSpeed: 100, animIntensity: 60,
  pfx: { vignette: 15, scanLines: 8, chromatic: 0, bloom: 22, filmGrain: 0, glitch: 0 },
};

const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const makeLayer = size => {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas2D unavailable");
  return { canvas, ctx };
};

export async function setupFactoryArt() {
  const host = document.querySelector("[data-factory-art]");
  if (!host) return;
  const canvas = host.querySelector("canvas");
  const button = host.querySelector("button");
  const ctx = canvas.getContext("2d");
  if (!ctx) return; // The exported still is also the no-JavaScript fallback.
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const source = new Image();
  source.src = host.dataset.source;
  try { await source.decode(); } catch { return; }
  const recipe = factoryRecipe;
  let frame = 0, lastFrame = -Infinity, visible = true, paused = false, scene;

  function build() {
    // Fixed logical resolution keeps the 12px character cells consistent on
    // phones and Retina screens, without multiplying glyph work by device DPI.
    const size = 768;
    canvas.width = canvas.height = size;
    const photo = makeLayer(size);
    photo.ctx.drawImage(source, 0, 0, size, size);
    const pixels = photo.ctx.getImageData(0, 0, size, size).data;
    const cells = [], step = recipe.cellSize, count = size / step;
    for (let row = 0; row < count; row++) for (let col = 0; col < count; col++) {
      let r = 0, g = 0, b = 0;
      for (let y = row * step; y < (row + 1) * step; y++) for (let x = col * step; x < (col + 1) * step; x++) {
        const at = (y * size + x) * 4;
        r += pixels[at]; g += pixels[at + 1]; b += pixels[at + 2];
      }
      const area = step * step;
      r /= area; g /= area; b /= area;
      cells.push({ x: col * step + step / 2, y: row * step + step / 2,
        lum: (.2126 * r + .7152 * g + .0722 * b) / 255, r, g, b, seed: row * count + col });
    }
    const glyphs = makeLayer(size);
    glyphs.ctx.textAlign = "center"; glyphs.ctx.textBaseline = "middle";
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const right = cells[i % count === count - 1 ? i : i + 1];
      const below = cells[Math.min(cells.length - 1, i + count)];
      const edge = Math.abs(cell.lum - right.lum) + Math.abs(cell.lum - below.lum);
      let lum = clamp(cell.lum + edge * recipe.edgeEmphasis / 100);
      if (recipe.invert) lum = 1 - lum;
      cell.lum = lum;
      cell.show = lum > .085 && hash(i + 17) <= recipe.coverage / 100;
      if (!cell.show) continue;
      // Flat, separated silhouettes survive the grid better than photographic
      // shading. Preserve cream joints and orange arms as distinct ink colours.
      const warm = clamp((cell.r - cell.g - 12) / 100);
      const strength = clamp(.28 + lum * 1.3);
      const rgb = [237 - warm * 17, 232 - warm * 131, 220 - warm * 162].map(c => Math.round(c * strength));
      cell.color = `rgb(${rgb.join(",")})`;
      cell.glyph = "0123456789ABCDEF"[Math.floor(hash(i + 73) * 16)];
      cell.font = `600 ${step * .95}px Consolas, monospace`;
      glyphs.ctx.font = cell.font; glyphs.ctx.fillStyle = cell.color;
      glyphs.ctx.fillText(cell.glyph, cell.x, cell.y);
    }
    const adjusted = makeLayer(size);
    // Color adjustment order matches the recipe, then warm overlay tint.
    adjusted.ctx.filter = `brightness(${100 + recipe.brightness}%) contrast(${recipe.contrast}%) saturate(${recipe.saturation}%) grayscale(${recipe.grayscale}%)`;
    adjusted.ctx.drawImage(glyphs.canvas, 0, 0); adjusted.ctx.filter = "none";
    adjusted.ctx.globalCompositeOperation = recipe.overlayBlend;
    adjusted.ctx.globalAlpha = recipe.tintOpacity / 100;
    adjusted.ctx.fillStyle = recipe.tint; adjusted.ctx.fillRect(0, 0, size, size);
    adjusted.ctx.globalAlpha = 1;
    adjusted.ctx.globalCompositeOperation = "destination-in";
    adjusted.ctx.drawImage(glyphs.canvas, 0, 0);
    adjusted.ctx.globalCompositeOperation = "source-over";

    const finished = makeLayer(size), out = finished.ctx;
    out.fillStyle = recipe.background; out.fillRect(0, 0, size, size);
    if (recipe.bgMode === "original" || recipe.bgMode === "blurred") {
      out.globalAlpha = recipe.bgOpacity / 100;
      out.filter = recipe.bgMode === "blurred" ? `blur(${recipe.bgBlur}px)` : "none";
      out.drawImage(photo.canvas, 0, 0); out.filter = "none"; out.globalAlpha = 1;
    }
    // Restrained warm chromatic separation, rather than the green RGB split.
    out.globalCompositeOperation = "screen";
    out.globalAlpha = recipe.pfx.chromatic / 100 * .15;
    out.drawImage(adjusted.canvas, -1, 0); out.drawImage(adjusted.canvas, 1, 0);
    out.globalAlpha = recipe.pfx.bloom / 100 * .48;
    out.filter = "blur(3px)"; out.drawImage(adjusted.canvas, 0, 0); out.filter = "none";
    out.globalAlpha = 1; out.globalCompositeOperation = recipe.styleBlend;
    out.drawImage(adjusted.canvas, 0, 0);
    out.fillStyle = `rgba(0,0,0,${recipe.pfx.scanLines / 100 * .16})`;
    for (let y = 0; y < size; y += 4) out.fillRect(0, y, size, 1);
    const vignette = out.createRadialGradient(size / 2, size / 2, size * .24, size / 2, size / 2, size * .65);
    vignette.addColorStop(0, "transparent"); vignette.addColorStop(1, `rgba(11,13,15,${recipe.pfx.vignette / 100})`);
    out.fillStyle = vignette; out.fillRect(0, 0, size, size);
    // A repeatable grain texture prevents temporal noise and whole-frame flashes.
    for (let i = 0; i < 1200; i++) {
      out.fillStyle = `rgba(237,232,220,${hash(i + 70) * recipe.pfx.filmGrain / 100 * .045})`;
      out.fillRect(hash(i) * size, hash(i + 13) * size, 1, 1);
    }
    scene = { base: finished.canvas, cells, size };
    host.dataset.ready = "true";
    render(0);
  }

  function render(time) {
    if (!scene) return;
    const { base, cells, size } = scene;
    ctx.globalAlpha = 1; ctx.drawImage(base, 0, 0);
    if (paused || motion.matches || !recipe.animated) return;
    // Only a few characters change per beat. The factory silhouette stays put.
    const beat = Math.floor(time / 240 * recipe.animSpeed / 100);
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (const cell of cells) {
      if (!cell.show || hash(cell.seed + beat * 7) < .985) continue;
      ctx.fillStyle = recipe.background;
      ctx.fillRect(cell.x - 6, cell.y - 6, 12, 12);
      ctx.font = cell.font; ctx.fillStyle = cell.color;
      ctx.globalAlpha = .85 + .15 * hash(cell.seed + beat);
      ctx.fillText("0123456789ABCDEF"[(cell.seed + beat) % 16], cell.x, cell.y);
    }
    ctx.globalAlpha = 1;
    // A faint, infrequent shifted row interprets glitch without flashing.
    if (recipe.pfx.glitch && beat % 19 === 0) {
      const y = Math.floor(hash(beat) * (size - 12));
      ctx.globalAlpha = .08 * recipe.animIntensity / 100;
      ctx.drawImage(base, 0, y, size - 2, 2, 2, y, size - 2, 2); ctx.globalAlpha = 1;
    }
  }
  function tick(time) {
    frame = 0;
    if (time - lastFrame > 1000 / 12) { render(time); lastFrame = time; }
    schedule();
  }
  function schedule() {
    const active = visible && !document.hidden && !paused && !motion.matches && recipe.animated;
    host.dataset.animating = String(active);
    if (active && !frame) frame = requestAnimationFrame(tick);
    else if (!active && frame) { cancelAnimationFrame(frame); frame = 0; }
  }
  function syncMotion() {
    button.hidden = motion.matches;
    render(0); schedule();
  }
  button.addEventListener("click", () => {
    paused = !paused;
    button.textContent = paused ? "Play animation" : "Pause animation";
    button.setAttribute("aria-label", paused ? "Play factory artwork animation" : "Pause factory artwork animation");
    render(0); schedule();
  });
  motion.addEventListener("change", syncMotion);
  document.addEventListener("visibilitychange", schedule);
  if ("IntersectionObserver" in window) new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting; schedule();
  }).observe(host);
  try { build(); button.hidden = motion.matches; schedule(); }
  catch { delete host.dataset.ready; button.hidden = true; }
}
