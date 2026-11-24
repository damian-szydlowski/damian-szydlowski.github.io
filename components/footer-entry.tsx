import * as React from "react";
import { createRoot, type Root } from "react-dom/client";
import HalftoneWordmarkFooter from "@/components/ui/halftone-wordmark-footer";

class FooterBoundary extends React.Component<React.PropsWithChildren<{ onFailure: () => void }>, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export function mountSharedFooter(host: HTMLElement) {
  const region = host.closest<HTMLElement>(".footer-region");
  const fallback = region?.querySelector<HTMLElement>("[data-footer-fallback]");
  if (!region || !fallback) return;
  let root: Root | undefined;
  let failed = false;
  const native = () => {
    host.hidden = true;
    fallback.hidden = false;
    delete host.dataset.ready;
    region.dataset.footerMode = "static";
  };
  const fail = () => { failed = true; native(); };
  const ready = () => { if (!failed) { fallback.hidden = true; host.dataset.ready = "true"; } };
  const render = () => {
    if (failed || parseFloat(getComputedStyle(document.documentElement).fontSize) > 20) {
      root?.unmount(); root = undefined; native(); return;
    }
    if (root) return;
    delete region.dataset.footerMode;
    host.hidden = false;
    root = createRoot(host);
    root.render(<FooterBoundary onFailure={fail}><HalftoneWordmarkFooter
      wordmark="damian" label=""
      meta=""
      columns={[]} backToTop={false} className="portfolio-footer"
      palette={{ background: "#0b0d0f", ink: "#ede8dc", warm: "#dc653a" }}
      fontFamily='"Geist", system-ui, sans-serif' monoFamily='Consolas, "Liberation Mono", monospace'
      height="var(--portfolio-footer-height)" grain={0.25} onReady={ready} onUnavailable={fail}
    /></FooterBoundary>);
  };
  render();
  new ResizeObserver(render).observe(document.documentElement);
}
