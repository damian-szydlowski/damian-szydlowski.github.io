import * as React from "react";
import { createRoot, type Root } from "react-dom/client";
import FocusPullCarousel, { type Slide } from "@/components/ui/focus-pull-carousel";

class ShowcaseBoundary extends React.Component<React.PropsWithChildren<{ onFailure: () => void }>, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function PhotographyShowcase({ slides, onReady }: {
  slides: Slide[]; onReady: () => void;
}) {
  const [paused, setPaused] = React.useState(false);
  return (
    <div className="photography-carousel">
      <FocusPullCarousel slides={slides} height="auto" cardWidth="min(86vw, 679px, calc(100vw - 64px))" showDetails={false} controlsPosition="top"
        background="var(--background)" ink="var(--text)" autoplay={paused ? 0 : 3000}
        ariaLabel="Photography showcase" onReady={onReady}
        controls={<button className="fp-btn" type="button" data-fp-autoplay="" aria-label={paused ? "Play slideshow" : "Pause slideshow"}
          title={paused ? "Play slideshow" : "Pause slideshow"} aria-pressed={paused} onClick={() => setPaused(value => !value)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            {paused ? <path d="m5 3 8 5-8 5Z" /> : <path d="M4 3h3v10H4zM9 3h3v10H9z" />}
          </svg>
        </button>} />
    </div>
  );
}

export function mountPhotographyShowcase(host: HTMLElement, slides: Slide[]) {
  const fallback = document.getElementById("featured-photos");
  if (!fallback || !slides.length) return;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let root: Root | undefined;
  let failed = false;
  const showFallback = () => {
    host.hidden = true;
    fallback.hidden = false;
    delete host.dataset.ready;
  };
  const fail = () => { failed = true; showFallback(); };
  const ready = () => { if (!failed) { fallback.hidden = true; host.dataset.ready = "true"; } };
  const render = () => {
    if (motion.matches || parseFloat(getComputedStyle(document.documentElement).fontSize) > 20) {
      root?.unmount(); root = undefined; showFallback(); return;
    }
    if (root || failed) return;
    host.hidden = false;
    root = createRoot(host);
    root.render(<ShowcaseBoundary onFailure={fail}><PhotographyShowcase slides={slides} onReady={ready} /></ShowcaseBoundary>);
  };
  render();
  motion.addEventListener("change", render);
  // Enlarging text keeps the ordinary, naturally sized preview links available.
  new ResizeObserver(render).observe(document.documentElement);
}
