import { projects, photos, projectContexts, photoCategories } from "./content.js";
import { setupSmoothScroll, pauseSmoothScroll, resumeSmoothScroll } from "./smooth-scroll.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const element = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

function missingImage(img) {
  const fallback = element("div", "media-fallback");
  fallback.setAttribute("role", "img");
  fallback.setAttribute("aria-label", img.alt || "Image unavailable");
  fallback.append(element("span", "mono", "IMAGE UNAVAILABLE"), element("p", "", "This image couldn’t be loaded."));
  if (img.width && img.height) fallback.style.aspectRatio = `${img.width} / ${img.height}`;
  img.replaceWith(fallback);
}

function image(record, { className = "", sizes = "100vw", eager = false } = {}) {
  const img = element("img", className);
  img.alt = record.alt || "";
  img.width = record.width;
  img.height = record.height;
  img.loading = eager ? "eager" : "lazy";
  img.decoding = "async";
  img.addEventListener("error", () => missingImage(img), { once: true });
  if (record.variants?.length) {
    img.srcset = record.variants.map(variant => `${variant.src} ${variant.width}w`).join(", ");
    img.sizes = sizes;
  }
  img.src = record.src;
  return img;
}

// The content module is local, but links still accept only ordinary web URLs.
function externalLink(record) {
  try {
    const url = new URL(record.href, window.location.href);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    const link = element("a", "button button-outline", `${record.label} ↗`);
    link.href = url.href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    return link;
  } catch { return null; }
}

function tags(values = []) {
  const list = element("ul", "tag-list");
  for (const value of values) list.append(element("li", "tag", value));
  return list;
}

function filters(container, options, onSelect) {
  let selected = "all";
  const buttons = Object.entries({ all: "All", ...options }).map(([id, label]) => {
    const button = element("button", "filter-button", label);
    button.type = "button";
    button.dataset.filter = id;
    button.setAttribute("aria-pressed", String(id === selected));
    button.addEventListener("click", () => {
      if (selected === id) return;
      selected = id;
      buttons.forEach(item => item.setAttribute("aria-pressed", String(item.dataset.filter === id)));
      onSelect(id);
    });
    return button;
  });
  container.replaceChildren(...buttons);
}

// Navigation enhances ordinary links on both pages.
function setupNavigation() {
  const header = $(".site-header");
  const button = $(".menu-toggle");
  const nav = $(".main-nav");
  if (!header || !button || !nav) return;
  const compact = window.matchMedia("(max-width: 999px)");
  const setOpen = open => {
    header.classList.toggle("menu-open", open);
    button.setAttribute("aria-expanded", String(open));
  };
  document.body.classList.add("nav-ready");
  button.addEventListener("click", () => setOpen(button.getAttribute("aria-expanded") !== "true"));
  nav.addEventListener("click", event => { if (event.target.closest("a")) setOpen(false); });
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape" || button.getAttribute("aria-expanded") !== "true") return;
    setOpen(false);
    button.focus();
  });
  document.addEventListener("click", event => { if (!header.contains(event.target)) setOpen(false); });
  header.addEventListener("focusout", event => {
    if (event.relatedTarget && !header.contains(event.relatedTarget)) setOpen(false);
  });
  compact.addEventListener("change", () => {
    const focusWasInNav = nav.contains(document.activeElement);
    setOpen(false);
    if (compact.matches && focusWasInNav) button.focus();
  });
  const syncHeight = () => {
    if (!header.classList.contains("menu-open")) document.documentElement.style.setProperty("--header-height", `${Math.ceil(header.getBoundingClientRect().height)}px`);
  };
  syncHeight();
  if ("ResizeObserver" in window) new ResizeObserver(syncHeight).observe(header);
  else window.addEventListener("resize", syncHeight, { passive: true });

  if (document.body.classList.contains("portfolio-page") && "IntersectionObserver" in window) {
    const links = $$("a[href^='#']", nav);
    const observer = new IntersectionObserver(entries => {
      const entry = entries.find(item => item.isIntersecting);
      if (!entry) return;
      for (const link of links) {
        if (link.hash === `#${entry.target.id}`) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      }
    }, { rootMargin: "-20% 0px -65% 0px" });
    $$("main > section[id]").forEach(section => observer.observe(section));
  }
}

// Content remains visible if JavaScript, animation, or observation is unavailable.
let revealObserver;
function setupReveals(root = document) {
  if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  revealObserver ||= new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("reveal-enter");
      revealObserver.unobserve(entry.target);
    }
  }, { threshold: 0.08 });
  $$("[data-reveal], .project-card, .photo-preview", root).forEach(node => {
    if (!node.classList.contains("reveal-enter")) revealObserver.observe(node);
  });
}

function setupPhotographyPreview() {
  const grid = $("#featured-photos");
  if (!grid) return;
  // Prefer authentic work, then fall back to explicitly labelled placeholders.
  const selected = [
    ...photos.filter(photo => !photo.placeholder && photo.featured),
    ...photos.filter(photo => !photo.placeholder && !photo.featured),
    ...photos.filter(photo => photo.placeholder && photo.featured),
    ...photos.filter(photo => photo.placeholder && !photo.featured),
  ];
  if (!selected.length) {
    grid.append(element("p", "empty-state", "The photography collection is taking shape. Original photographs are coming soon."));
    return;
  }
  for (const photo of selected.slice(0, 3)) {
    const link = element("a", "photo-preview");
    link.href = "photography.html#collection";
    link.setAttribute("aria-label", `View ${photo.title} in the photography collection`);
    link.append(image(photo.image, { sizes: "(max-width: 639px) calc(100vw - 40px), (max-width: 999px) 45vw, 358px" }));
    if (photo.placeholder) link.append(element("p", "photo-placeholder-note", "PLACEHOLDER ARTWORK"));
    grid.append(link);
  }
  const host = $("[data-photography-react]");
  if (!host || !("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    // Reuse the timeline's React runtime and load the showcase near this section.
    const slides = selected.map(photo => {
      const variants = [...(photo.image.variants || [])].sort((a, b) => a.width - b.width);
      const variant = variants.find(record => record.width >= 960) || variants.at(-1);
      return { image: variant?.src || photo.image.src, alt: photo.image.alt, title: photo.title,
        caption: photo.caption, href: "photography.html#collection" };
    });
    import("../assets/vendor/timeline.js").then(module => {
      module.mountPhotographyShowcase(host, slides);
    }).catch(() => { /* Preview links and the details page remain available. */ });
  }, { rootMargin: "300px" });
  observer.observe(host.parentElement);
}


function prepareDialog(dialog, cleanup = () => {}) {
  dialog.setAttribute("data-lenis-prevent", "");
  let trigger;
  let scrollY = 0;
  $("[data-close-dialog]", dialog).addEventListener("click", () => dialog.close());
  dialog.addEventListener("keydown", event => {
    if (event.key !== "Tab") return;
    const focusable = $$("button, a[href], [tabindex]", dialog).filter(node => !node.disabled && node.tabIndex >= 0 && node.getClientRects().length);
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first?.focus();
    }
  });
  // A backdrop click should close only if both ends of the gesture are outside.
  let startedOutside = false;
  const outside = event => {
    const rect = dialog.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  };
  dialog.addEventListener("pointerdown", event => { startedOutside = event.target === dialog && outside(event); });
  dialog.addEventListener("click", event => {
    if (startedOutside && event.target === dialog && outside(event)) dialog.close();
    startedOutside = false;
  });
  dialog.addEventListener("close", () => {
    cleanup();
    document.body.classList.remove("dialog-open");
    document.body.style.top = "";
    window.scrollTo({ top: scrollY, behavior: "instant" });
    resumeSmoothScroll();
    trigger?.focus({ preventScroll: true });
  });
  return opener => {
    trigger = opener;
    pauseSmoothScroll();
    scrollY = window.scrollY;
    document.body.style.top = `-${scrollY}px`;
    document.body.classList.add("dialog-open");
    dialog.showModal();
    $("[data-close-dialog]", dialog).focus({ preventScroll: true });
  };
}

let viewerImport;
function importViewer() {
  // This file and the model stay off the network until the visitor asks for 3D.
  viewerImport ||= import("../assets/vendor/model-viewer.min.js").catch(error => {
    viewerImport = undefined;
    throw error;
  });
  return viewerImport;
}

function modelSection(model, cover) {
  const section = element("section", "model-section");
  section.append(element("h3", "", "Explore the design"));
  const stage = element("div", "model-stage");
  const posterRecord = model.poster || cover;
  stage.append(image(posterRecord, { className: "model-poster", sizes: "(max-width: 600px) 90vw, 800px" }));
  const button = element("button", "button button-outline", "Explore 3D model ↗");
  button.type = "button";
  const status = element("p", "model-status", "Rotate and zoom to take a closer look. The model loads when you ask for it.");
  status.setAttribute("role", "status");
  section.append(stage, button, status);
  let disposed = false;
  let timer;
  let viewer;
  let failed = false;
  let attempt = 0;
  const fail = currentAttempt => {
    if (disposed || currentAttempt !== attempt) return;
    failed = true;
    clearTimeout(timer);
    viewer?.remove();
    status.textContent = "The 3D view is unavailable. You can still explore the project images, or try again.";
    button.disabled = false;
    button.textContent = "Try loading the model again";
  };
  button.addEventListener("click", async () => {
    const currentAttempt = ++attempt;
    failed = false;
    button.disabled = true;
    status.textContent = "Loading the interactive model…";
    timer = window.setTimeout(() => fail(currentAttempt), 25000);
    try {
      await importViewer();
      if (disposed || failed || currentAttempt !== attempt) return;
      viewer = document.createElement("model-viewer");
      viewer.setAttribute("alt", model.alt || "Interactive 3D design. Drag to rotate; pinch or scroll to zoom.");
      viewer.setAttribute("camera-controls", "");
      viewer.setAttribute("touch-action", "pan-y");
      viewer.setAttribute("loading", "eager");
      viewer.setAttribute("interaction-prompt", "none");
      viewer.setAttribute("shadow-intensity", "0.5");
      viewer.addEventListener("error", () => fail(currentAttempt), { once: true });
      viewer.addEventListener("load", () => {
        if (disposed || failed || currentAttempt !== attempt) return;
        clearTimeout(timer);
        viewer.classList.add("loaded");
        status.textContent = "Drag or use the arrow keys to rotate. Pinch or scroll to zoom.";
        button.hidden = true;
      }, { once: true });
      viewer.setAttribute("src", model.src);
      stage.append(viewer);
    } catch { fail(currentAttempt); }
  });
  return { section, dispose: () => { disposed = true; clearTimeout(timer); viewer?.remove(); } };
}

function setupProjects() {
  const grid = $("#project-grid");
  if (!grid) return;
  const dialog = $("#project-dialog");
  const detail = $("#project-detail");
  let disposeModel = () => {};
  const open = prepareDialog(dialog, () => { disposeModel(); detail.replaceChildren(); });
  const markLastProjectRow = () => {
    const cards = $$(".project-card", grid);
    cards.forEach(card => card.removeAttribute("data-scroll-pause-end"));
    if (!cards.length) return;
    const lastRowTop = cards.at(-1).offsetTop;
    const firstInLastRow = cards.find(card => Math.abs(card.offsetTop - lastRowTop) < 2);
    firstInLastRow?.setAttribute("data-scroll-pause-end", "section");
  };
  const projectGridResize = new ResizeObserver(markLastProjectRow);
  projectGridResize.observe(grid);
  function openProject(project, opener) {
    disposeModel();
    disposeModel = () => {};
    detail.replaceChildren();
    const meta = element("p", "eyebrow", [projectContexts[project.context] || project.context, project.organization, project.date].filter(Boolean).join(" / "));
    const heading = element("h2", "", project.title);
    heading.id = "project-dialog-title";
    detail.append(meta, heading);
    if (project.placeholder) detail.append(element("span", "placeholder-label", "Project placeholder · Details coming soon"));
    detail.append(image(project.cover, { className: "project-detail-cover", sizes: "(max-width: 600px) 90vw, 800px", eager: true }));
    if (project.overview) detail.append(element("p", "project-lead", project.overview));
    if (project.tags?.length) detail.append(tags(project.tags));
    const sections = element("div", "detail-sections");
    for (const [label, text] of [["My contribution", project.contribution], ["The approach", project.approach], ["Results & lessons", project.outcome]]) {
      if (!text) continue;
      const block = element("section", "detail-section");
      block.append(element("h3", "", label), element("p", "", text));
      sections.append(block);
    }
    detail.append(sections);
    for (const record of project.images || []) {
      const figure = element("figure", "detail-image");
      figure.append(image(record, { sizes: "(max-width: 600px) 90vw, 800px" }));
      if (record.caption) figure.append(element("figcaption", "", record.caption));
      detail.append(figure);
    }
    if (project.model?.src) {
      const model = modelSection(project.model, project.cover);
      detail.append(model.section);
      disposeModel = model.dispose;
    }
    const links = (project.links || []).map(externalLink).filter(Boolean);
    if (links.length) {
      const row = element("div", "project-links");
      row.append(...links);
      detail.append(row);
    }
    open(opener);
    dialog.scrollTop = 0;
  }
  function render(context) {
    const visible = projects.filter(project => context === "all" || project.context === context);
    $("#project-count").textContent = `${String(visible.length).padStart(2, "0")} ${visible.length === 1 ? "PROJECT" : "PROJECTS"}`;
    // Filters replace cards; release old observations before watching the new set.
    $$(".project-card", grid).forEach(card => revealObserver?.unobserve(card));
    grid.replaceChildren();
    if (!visible.length) grid.append(element("p", "empty-state", "Projects in this collection are coming soon."));
    visible.forEach((project, index) => {
      const article = element("article", "project-card");
      const button = element("button", "project-card-button");
      button.type = "button";
      button.setAttribute("aria-haspopup", "dialog");
      button.setAttribute("aria-label", `View ${project.title}`);
      const cover = element("div", "project-cover");
      cover.append(image(project.cover, { sizes: "(max-width: 639px) calc(100vw - 40px), (max-width: 1183px) calc((100vw - 96px) / 2), 544px" }));
      if (project.placeholder) cover.append(element("span", "cover-label", "PROJECT PLACEHOLDER"));
      const body = element("div", "project-card-body");
      const meta = element("div", "card-meta");
      meta.append(element("span", "", projectContexts[project.context] || project.context), element("span", "", `0${index + 1} ↗`));
      body.append(meta, element("h3", "", project.title), element("p", "project-summary", project.summary));
      if (project.organization) body.append(element("p", "project-organization", project.organization));
      if (project.tags?.length) body.append(tags(project.tags));
      const action = element("span", "card-action");
      action.append(element("span", "", "Take a closer look"), element("span", "", "↗"));
      body.append(action);
      button.append(cover, body);
      button.addEventListener("click", () => openProject(project, button));
      article.append(button);
      grid.append(article);
    });
    setupReveals(grid);
    markLastProjectRow();
    const note = $(".work-section .preview-note");
    if (note) note.hidden = !projects.some(project => project.placeholder);
  }
  filters($("#project-filters"), projectContexts, render);
  render("all");
}

function setupFeaturedPhotograph() {
  const figure = $("#featured-photograph");
  if (!figure) return;
  // Prefer real featured material; preserve manual order within each group.
  const featured = photos.filter(photo => photo.featured);
  const photo = featured.find(photo => !photo.placeholder) || featured[0];
  if (!photo) return; // The static, labelled empty state remains useful without content.
  const link = element("a", "featured-photo-link");
  link.href = `#${encodeURIComponent(photo.id)}`;
  link.setAttribute("aria-label", `Find ${photo.title} in the collection`);
  const img = image(photo.image, { sizes: "(max-width: 639px) calc(100vw - 40px), (max-width: 1312px) 42vw, 510px", eager: true });
  img.fetchPriority = "high";
  link.append(img);
  const caption = element("figcaption", "");
  caption.append(element("span", "", photo.title), element("span", "mono", photo.placeholder ? "Placeholder study" : "Featured photograph"));
  figure.replaceChildren(link, caption);
  link.addEventListener("click", () => {
    // A previously selected category may hide this photograph. Reveal it first.
    $('#photo-filters [data-filter="all"]')?.click();
  });
}

function setupGallery() {
  const grid = $("#photo-grid");
  if (!grid) return;
  const dialog = $("#photo-dialog");
  const stage = $("#lightbox-stage");
  const open = prepareDialog(dialog, () => stage.replaceChildren());
  const previous = $("#photo-previous");
  const next = $("#photo-next");
  let visible = [...photos];
  let index = 0;
  function showPhoto() {
    const photo = visible[index];
    if (!photo) return;
    stage.replaceChildren(image(photo.image, { sizes: "(max-width: 600px) 96vw, 90vw", eager: true }));
    $("#lightbox-title").textContent = photo.title;
    $("#lightbox-caption").textContent = photo.caption || "";
    $("#lightbox-position").textContent = `${String(index + 1).padStart(2, "0")} / ${String(visible.length).padStart(2, "0")}`;
    previous.disabled = index === 0;
    next.disabled = index === visible.length - 1;
  }
  const move = direction => {
    const target = index + direction;
    if (target < 0 || target >= visible.length) return;
    index = target;
    showPhoto();
  };
  previous.addEventListener("click", () => move(-1));
  next.addEventListener("click", () => move(1));
  dialog.addEventListener("keydown", event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      move(event.key === "ArrowLeft" ? -1 : 1);
    }
  });
  let touchStart;
  stage.addEventListener("touchstart", event => {
    touchStart = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
  }, { passive: true });
  stage.addEventListener("touchcancel", () => { touchStart = null; }, { passive: true });
  stage.addEventListener("touchend", event => {
    if (!touchStart || !event.changedTouches.length || event.touches.length) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && (window.visualViewport?.scale || 1) === 1) move(dx < 0 ? 1 : -1);
    touchStart = null;
  }, { passive: true });
  function render(category) {
    visible = photos.filter(photo => category === "all" || photo.categories.includes(category));
    $("#photo-count").textContent = `${String(visible.length).padStart(2, "0")} ${visible.length === 1 ? "IMAGE" : "IMAGES"}`;
    grid.replaceChildren();
    if (!visible.length) grid.append(element("p", "empty-state", "This collection is still taking shape. Check back soon."));
    visible.forEach((photo, photoIndex) => {
      const article = element("article", "photo-card");
      article.id = photo.id;
      const button = element("button", "photo-button");
      button.type = "button";
      button.setAttribute("aria-label", `Enlarge ${photo.title}`);
      button.setAttribute("aria-haspopup", "dialog");
      const wrap = element("div", "photo-image-wrap");
      wrap.append(image(photo.image, { sizes: "(max-width: 639px) calc(100vw - 40px), (max-width: 999px) calc(50vw - 44px), (max-width: 1312px) calc(33vw - 54px), 384px" }));
      const arrow = element("span", "photo-open", "↗");
      arrow.setAttribute("aria-hidden", "true");
      wrap.append(arrow);
      const caption = element("div", "photo-caption");
      caption.append(element("h3", "", photo.title), element("span", "mono", photo.categories.map(category => photoCategories[category] || category).join(" / ")));
      button.append(wrap, caption);
      if (photo.placeholder) button.append(element("p", "photo-placeholder-note", "PLACEHOLDER ARTWORK"));
      button.addEventListener("click", () => { index = photoIndex; showPhoto(); open(button); });
      article.append(button);
      grid.append(article);
    });
    const note = $(".gallery-section .preview-note");
    if (note) note.hidden = !photos.some(photo => photo.placeholder);
  }
  const represented = [...new Set(photos.flatMap(photo => photo.categories))];
  const categories = Object.fromEntries(represented.map(id => [id, photoCategories[id] || id]));
  filters($("#photo-filters"), categories, render);
  render("all");
  // Direct image links arrive at the matching card, without forcing an overlay.
  if (location.hash) {
    try { document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({ behavior: "instant", block: "center" }); } catch { /* Ignore malformed URL fragments. */ }
  }
}

function setupFooter() {
  const host = $("[data-footer-react]");
  if (!host || !("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    import("../assets/vendor/timeline.js").then(module => module.mountSharedFooter(host))
      .catch(() => { /* The native footer remains visible if the artwork cannot load. */ });
  }, { rootMargin: "300px" });
  observer.observe(host.parentElement);
}

function setupHeroNebula() {
  const host = $("[data-hero-nebula]");
  if (!host) return;
  import("../assets/vendor/timeline.js").then(module => {
    host.hidden = false;
    module.mountHeroNebula(host);
  }).catch(error => {
    console.warn("The hero background could not load; the plain background remains available.", error);
  });
}

function setupTopHeader() {
  if (!$(".portfolio-page #home")) return;
  const update = () => document.body.classList.toggle("home-at-top", scrollY <= 4);
  update();
  addEventListener("scroll", update, { passive: true });
}

function setupSmallDetails() {
  $$("[data-year]").forEach(node => { node.textContent = new Date().getFullYear(); });
  $("#copy-email")?.addEventListener("click", async event => {
    const email = event.currentTarget.dataset.email;
    try {
      await navigator.clipboard.writeText(email);
      $("#copy-status").textContent = "Email address copied.";
    } catch {
      $("#copy-status").textContent = "Copy isn’t available here. Select the email address above to copy it.";
    }
  });
  $$('img').forEach(img => {
    if (img.complete && !img.naturalWidth) missingImage(img);
    else img.addEventListener("error", () => missingImage(img), { once: true });
  });
}

setupNavigation();
setupHeroNebula();
setupTopHeader();
setupSmallDetails();
setupFooter();
setupProjects();
setupFeaturedPhotograph();
setupGallery();
setupPhotographyPreview();
setupReveals();
setupSmoothScroll();
