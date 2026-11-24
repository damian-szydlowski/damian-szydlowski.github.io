let scroller;
let resetSectionPause = () => {};

// A larger wheel fling settles near the next section; gentle scrolling stays free.
const sectionPause = { releaseDelay: 20 };
const timelineWheelMultiplier = 0.35;

function createSectionPauses(instance, keepNative) {
  const sections = [...document.querySelectorAll("main > section:not(#background)")];
  let pause;
  let releaseTimer;
  const scheduleRelease = () => {
    clearTimeout(releaseTimer);
    const startedAt = performance.now();
    const releaseWhenSettled = () => {
      if (!pause) return;
      const settled = Math.abs(instance.animatedScroll - pause.position) <= 2;
      const timedOut = performance.now() - startedAt >= 1600;
      if (settled || timedOut) {
        pause = undefined;
        return;
      }
      releaseTimer = setTimeout(releaseWhenSettled, 50);
    };
    // Wait for a brief pause in wheel input, then keep the target clamped until
    // Lenis reaches it. A fling's remaining momentum cannot pass the section.
    releaseTimer = setTimeout(releaseWhenSettled, sectionPause.releaseDelay);
  };
  return {
    reset: () => { pause = undefined; clearTimeout(releaseTimer); },
    filter(data) {
      const { event } = data;
      if (event.type !== "wheel" || event.ctrlKey || event.metaKey || event.shiftKey || !data.deltaY || Math.abs(data.deltaX) > Math.abs(data.deltaY)) return true;
      if (instance.isStopped || instance.isLocked || event.composedPath().some(node => node instanceof HTMLElement && (
        keepNative(node) || node.hasAttribute("data-lenis-prevent") || node.hasAttribute("data-lenis-prevent-wheel") || node.hasAttribute("data-lenis-prevent-vertical")
      ))) return true;

      // These sections have either a long scroll-driven animation or a large
      // project grid. Reduce each wheel delta so one fling cannot race through.
      const directionBeforeScaling = Math.sign(data.deltaY);
      const overTimeline = event.composedPath().some(node => node instanceof HTMLElement && node.closest("#background"));
      // Small touchpad deltas can arrive in a long, smooth stream. Reduce them
      // locally so the scrubbed timeline advances deliberately without slowing
      // normal page scrolling elsewhere.
      if (overTimeline && (!pause || directionBeforeScaling !== pause.direction)) {
        data.deltaY *= timelineWheelMultiplier;
      }
      const direction = Math.sign(data.deltaY);
      if (direction < 0) {
        pause = undefined;
        clearTimeout(releaseTimer);
        return true;
      }
      if (pause && direction !== pause.direction) {
        pause = undefined;
        clearTimeout(releaseTimer);
      }
      if (pause) {
        data.deltaY = pause.position - instance.targetScroll;
        scheduleRelease();
      } else {
        const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
        const target = instance.targetScroll;
        const proposed = target + data.deltaY;
        const positions = sections.map(section => {
          const margin = parseFloat(getComputedStyle(section).scrollMarginTop) || 0;
          // Tuck the Me section a little farther below the fold so the landing
          // artwork does not remain visible behind the sticky header.
          const extraInset = section.id === "about" ? 40 : 0;
          return Math.max(0, Math.min(instance.limit, section.getBoundingClientRect().top + scrollY - padding - margin + extraInset));
        });
        for (const marker of document.querySelectorAll("[data-scroll-pause-start], [data-scroll-pause-end]")) {
          if (marker.hasAttribute("data-scroll-pause-start")) {
            const offset = Number(marker.dataset.scrollPauseStart);
            if (Number.isFinite(offset)) positions.push(Math.max(0, Math.min(instance.limit, marker.getBoundingClientRect().top + scrollY + offset)));
          }
          if (!marker.hasAttribute("data-scroll-pause-end")) continue;
          if (marker.dataset.scrollPauseEnd === "section") {
            const markerMargin = parseFloat(getComputedStyle(marker).scrollMarginTop) || 0;
            positions.push(Math.max(0, Math.min(instance.limit, marker.getBoundingClientRect().top + scrollY - padding - markerMargin)));
          } else {
            const offset = Number(marker.dataset.scrollPauseEnd);
            if (Number.isFinite(offset)) positions.push(Math.max(0, Math.min(instance.limit, marker.getBoundingClientRect().top + scrollY + offset)));
          }
        }
        const next = positions
          .filter(position => direction * (position - target) > 8 && direction * (proposed - position) >= 0)
          .sort((a, b) => direction * (a - b))[0];
        if (next === undefined) return true;
        pause = { position: next, direction };
        data.deltaY = next - target;
        scheduleRelease();
      }
      if (Math.abs(data.deltaY) < 0.5) {
        if (event.cancelable) event.preventDefault();
        return false;
      }
      return true;
    },
  };
}

export function pauseSmoothScroll() {
  resetSectionPause();
  scroller?.stop();
}

export function resumeSmoothScroll() {
  resetSectionPause();
  if (!scroller) return;
  scroller.start();
  scroller.resize();
}

export async function setupSmoothScroll() {
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const root = document.documentElement;
  const loaded = document.readyState === "complete" ? Promise.resolve() : new Promise(resolve => addEventListener("load", resolve, { once: true }));
  try {
    // Load independently: gallery controls and content still work if this
    // optional enhancement fails. Wait for initial fonts and timeline sizing.
    const [{ default: Lenis }] = await Promise.all([
      import("../assets/vendor/lenis.js"), document.fonts.ready, loaded,
    ]);
    await new Promise(requestAnimationFrame);
    const configure = () => {
      resetSectionPause();
      scroller?.destroy();
      scroller = undefined;
      root.dataset.smoothScroll = motion.matches ? "off" : "ready";
      if (motion.matches) return;
      const keepNative = node => node.matches("dialog, model-viewer, textarea, select, .menu-open .main-nav");
      let pauses;
      scroller = new Lenis({
        autoRaf: true,
        smoothWheel: true,
        syncTouch: false,
        lerp: 0.1,
        wheelMultiplier: 1,
        prevent: keepNative,
        virtualScroll: data => pauses?.filter(data),
      });
      pauses = createSectionPauses(scroller, keepNative);
      resetSectionPause = pauses.reset;
      scroller.on("scroll", () => dispatchEvent(new Event("portfolio:smooth-scroll")));
      if (document.querySelector("dialog[open]")) scroller.stop();
    };
    configure();
    motion.addEventListener("change", configure);

    // Keyboard, touch, scrollbar dragging and browser history take over
    // immediately instead of fighting any remaining wheel momentum.
    const cancelMomentum = () => { resetSectionPause(); scroller?.reset(); };
    addEventListener("keydown", event => {
      if (["Tab", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) cancelMomentum();
    }, { capture: true });
    addEventListener("pointerdown", cancelMomentum, { passive: true, capture: true });
    addEventListener("touchstart", cancelMomentum, { passive: true, capture: true });
    addEventListener("popstate", cancelMomentum);
    addEventListener("hashchange", cancelMomentum);
    addEventListener("resize", () => resetSectionPause(), { passive: true });
    addEventListener("pageshow", () => scroller?.resize());
    addEventListener("scroll", () => {
      // Browser focus, scrollIntoView and other scripts can move the page.
      // Accept their position rather than pulling back to an old wheel target.
      if (scroller?.isScrolling === "smooth" && Math.abs(scroller.actualScroll - scroller.animatedScroll) > 2) cancelMomentum();
    }, { passive: true });

    document.addEventListener("click", event => {
      if (!scroller || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest("a[href]");
      if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search || !url.hash) return;
      let target;
      try { target = document.getElementById(decodeURIComponent(url.hash.slice(1))); }
      catch { return; }
      if (!target) return;
      event.preventDefault();
      resetSectionPause();
      // Match the Background link to the pinned timeline frame; other anchors
      // use the shared CSS scroll-padding, including the sticky header height.
      if (location.hash !== url.hash) history.pushState(null, "", url.hash);
      const timelineStart = target.id === "background"
        ? target.querySelector("[data-scroll-pause-start]")
        : null;
      const startOffset = Number(timelineStart?.dataset.scrollPauseStart);
      const destination = timelineStart && Number.isFinite(startOffset)
        ? timelineStart.getBoundingClientRect().top + scrollY + startOffset
        : target;
      scroller.scrollTo(destination, {
        duration: 0.85,
        onComplete: () => {
          const needsTabindex = target.tabIndex < 0 && !target.hasAttribute("tabindex");
          if (needsTabindex) target.setAttribute("tabindex", "-1");
          target.focus({ preventScroll: true });
          if (needsTabindex) target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
        },
      });
    });
  } catch (error) {
    root.dataset.smoothScroll = "unavailable";
    console.warn("Smooth scrolling is unavailable; browser scrolling remains enabled.", error);
  }
}
