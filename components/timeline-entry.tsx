import { createRoot, type Root } from "react-dom/client";
import { flushSync } from "react-dom";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Timeline, { type JourneyItem } from "@/components/ui/timeline";
import HalftoneNebula from "@/components/ui/halftone-nebula";
export { mountSharedFooter } from "./footer-entry";
export { mountPhotographyShowcase } from "./photography-entry";

export function mountHeroNebula(host: HTMLElement) {
  const root = createRoot(host);
  root.render(
    <HalftoneNebula
      height="100%"
      preset="solar"
      interactive
      maxDpr={1.25}
      className="hero-nebula-canvas"
      params={{ pixel: 5, planet: true, planetX: 0.78, planetY: 0.32, planetRadius: 0.065, speed: 0.45, grain: 0.018, vignette: 0.62, bandAngle: -0.42, bandOffset: 0.62, band: 0.82 }}
    />,
  );
  return () => root.unmount();
}

const host = document.querySelector<HTMLElement>("[data-timeline-react]");
const fallback = document.querySelector<HTMLElement>("#timeline-fallback");

if (host && fallback) {
  // Keep the drawn timeline on the same frame as the smoothed native position.
  addEventListener("portfolio:smooth-scroll", () => ScrollTrigger.update());
  // The HTML remains the owner's single content source and the no-JS fallback.
  const items: JourneyItem[] = [...fallback.querySelectorAll(".timeline-entry")].map((entry, index) => ({
    id: `background-${index + 1}`,
    closing: entry.hasAttribute("data-timeline-closing"),
    year: entry.hasAttribute("data-timeline-closing") ? "" : entry.querySelector(".timeline-date")?.textContent?.trim() ?? "",
    content: entry.hasAttribute("data-timeline-closing") ? entry.querySelector(".timeline-title")?.textContent?.trim() ?? "" : [
      entry.querySelector(".timeline-summary .eyebrow")?.textContent?.trim(),
      entry.querySelector(".timeline-title")?.textContent?.trim(),
      entry.querySelector(".timeline-organization")?.textContent?.trim(),
    ].filter(Boolean).join(" · "),
  }));
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let root: Root | undefined;
  let currentWidth = 0;
  let frame = 0;
  let initialNavigation = true;
  const initialHash = location.hash;
  const userNavigated = () => { initialNavigation = false; };
  const inputs = ["wheel", "touchstart", "pointerdown", "keydown"] as const;
  inputs.forEach(type => addEventListener(type, userNavigated, { passive: true, once: true }));

  const render = () => {
    frame = 0;
    const listMode = motion.matches || parseFloat(getComputedStyle(document.documentElement).fontSize) > 20;
    if (listMode) {
      root?.unmount();
      root = undefined;
      host.hidden = true;
      fallback.hidden = false;
      host.removeAttribute("data-ready");
      currentWidth = 0;
      return;
    }
    if (root && currentWidth === innerWidth) return;
    currentWidth = innerWidth;
    fallback.hidden = true;
    host.hidden = false;
    root ??= createRoot(host);
    try {
      flushSync(() => root!.render(
        <Timeline
          key={currentWidth}
          title="Background"
          eyebrow="02 / Background"
          headingId="background-title"
          items={items}
          textColor="var(--text)"
          mutedTextColor="var(--muted)"
          activeColor="#ff5f00"
          backgroundColor="var(--background)"
          duration={0.45}
        />,
      ));
      host.dataset.ready = "true";
      ScrollTrigger.refresh();
    } catch (error) {
      console.error("Timeline could not start; the readable list remains available.", error);
      root?.unmount();
      root = undefined;
      host.hidden = true;
      fallback.hidden = false;
      host.removeAttribute("data-ready");
    }
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(render); };
  const loaded = document.readyState === "complete" ? Promise.resolve() : new Promise(resolve => addEventListener("load", resolve, { once: true }));
  Promise.all([document.fonts.ready, loaded]).then(() => {
    render();
    // Adding the component changes the height before Projects and Connect.
    if (initialHash && initialNavigation && location.hash === initialHash) {
      try { document.getElementById(decodeURIComponent(initialHash.slice(1)))?.scrollIntoView({ behavior: "instant" }); }
      catch { /* Ignore malformed URL fragments. */ }
    }
    inputs.forEach(type => removeEventListener(type, userNavigated));
  });
  addEventListener("resize", schedule, { passive: true });
  motion.addEventListener("change", schedule);
  new ResizeObserver(schedule).observe(document.documentElement);
}
