import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../scripts/content.js", import.meta.url), "utf8");
async function withContent(page, changes) {
  await page.route("**/scripts/content.js", route => route.fulfill({ contentType: "text/javascript", body: source + "\n" + changes }));
}
const closeProject = page => page.getByRole("button", { name: "Close project", exact: true });
const closePhoto = page => page.getByRole("button", { name: "Close photograph", exact: true });

test("six homepage sections, timeline and photography previews connect the portfolio", async ({ page }) => {
  await page.goto("/");
  expect(await page.locator("main > section").evaluateAll(nodes => nodes.map(node => node.id))).toEqual(["home", "about", "background", "work", "photography", "contact"]);
  await expect(page.locator("#intro-title")).toHaveText("DamianSzydlowski.");
  await expect(page.locator(".timeline-entry")).toHaveCount(5);
  await expect(page.locator(".timeline-entry").first()).toContainText("Work");
  await expect(page.locator(".timeline-entry").nth(1)).toContainText("Education");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("#timeline-fallback")).toBeVisible();
  const firstMilestone = page.locator(".timeline-content").first();
  await firstMilestone.locator("summary").focus();
  await firstMilestone.locator("summary").click();
  await expect(firstMilestone).toHaveAttribute("open", "");
  await expect(firstMilestone).toContainText("Role and company to come");
  await firstMilestone.locator("summary").click();
  await expect(firstMilestone).not.toHaveAttribute("open", "");
  await expect(page.locator("#featured-photos .photo-preview")).toHaveCount(3);
  await page.locator("#photography").getByRole("link", { name: "Photography details", exact: true }).click();
  await expect(page).toHaveURL(/photography\.html$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Photography");
  await expect(page.locator(".main-nav a[aria-current='page']")).toContainText("Photography");
  await page.locator(".main-nav").getByRole("link", { name: "03 Projects", exact: false }).click();
  await expect(page).toHaveURL(/index\.html#work$/);
  await expect(page.locator("#work-title")).toBeInViewport();
});

test("smoothed wheel scrolling preserves distance and section links clear the header", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(700, 400);
  await page.mouse.wheel(0, 150);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(130);
  expect(await page.evaluate(() => scrollY)).toBeLessThan(190);
  await page.mouse.wheel(0, -100);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(80);
  await page.locator(".main-nav").getByRole("link", { name: /Background/ }).click();
  await expect.poll(() => page.locator("#background").evaluate(node => Math.abs(node.getBoundingClientRect().top - document.querySelector(".site-header").getBoundingClientRect().bottom - 20))).toBeLessThan(3);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType)).toBe("none");
  await expect(page.locator("[data-hero-nebula]")).toBeVisible();
  await expect(page.locator(".hero-art")).toHaveCount(0);
});

for (const path of ["/", "/photography.html"]) {
  test(`wheel input eases across frames and preserves distance within a section on ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(path);
    await expect(page.locator("html")).toHaveAttribute("data-smooth-scroll", "ready");
    const samples = await page.evaluate(async () => {
      scrollTo({ top: 0, behavior: "instant" });
      await new Promise(requestAnimationFrame);
      dispatchEvent(new WheelEvent("wheel", { deltaY: 100, bubbles: true, cancelable: true }));
      const positions = [];
      for (let frame = 0; frame < 8; frame++) {
        await new Promise(requestAnimationFrame);
        positions.push(scrollY);
      }
      return positions;
    });
    expect(new Set(samples).size).toBeGreaterThan(3);
    expect(samples.at(-1)).toBeGreaterThan(0);
    expect(samples.at(-1)).toBeLessThan(95);
    expect(samples.every((value, index) => !index || value >= samples[index - 1])).toBe(true);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(97);
    expect(await page.evaluate(() => scrollY)).toBeLessThan(103);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator("html")).toHaveAttribute("data-smooth-scroll", "off");
    await expect(page.locator("html")).not.toHaveClass(/lenis/);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expect(page.locator("html")).toHaveAttribute("data-smooth-scroll", "ready");
  });
}

for (const [path, first, second, contact] of [
  ["/", "home", "about", "contact"],
  ["/photography.html", "collection", "about-photography", "inquire"],
]) {
  test(`fast flings pause at successive sections and links bypass resistance on ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(path);
    await expect(page.locator("html")).toHaveAttribute("data-smooth-scroll", "ready");
    const position = id => page.locator(`#${id}`).evaluate(node => Math.max(0, Math.min(
      document.documentElement.scrollHeight - innerHeight,
      node.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop),
    )));
    const firstStop = await position(first);
    await page.mouse.move(700, 400);
    await page.mouse.wheel(0, 20000);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(firstStop - 3);
    await page.waitForTimeout(250);
    expect(await page.evaluate(() => scrollY)).toBeLessThan(firstStop + 3);
    await page.mouse.wheel(0, 120);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(firstStop + 25);
    expect(await page.evaluate(() => scrollY)).toBeLessThan(firstStop + 34);
    await page.mouse.wheel(0, 120);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(firstStop + 32);
    const secondStop = await position(second);
    await page.mouse.wheel(0, 20000);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(secondStop - 3);
    await page.waitForTimeout(250);
    expect(await page.evaluate(() => scrollY)).toBeLessThan(secondStop + 3);
    await page.locator(".main-nav .nav-connect").click();
    await expect(page).toHaveURL(new RegExp(`#${contact}$`));
    await expect(page.locator(`#${contact} h2`)).toBeInViewport();
  });
}

test("slow scrolling and reversing stay free at a section pause", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-smooth-scroll", "ready");
  const boundary = await page.locator("#about").evaluate(node => node.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop));
  await page.evaluate(top => scrollTo({ top, behavior: "instant" }), boundary - 35);
  await page.mouse.move(700, 400);
  await page.mouse.wheel(0, 60);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(boundary + 22);
  expect(await page.evaluate(() => scrollY)).toBeLessThan(boundary + 28);
  await page.locator(".hero-copy").evaluate(node => scrollTo({ top: node.getBoundingClientRect().top + scrollY, behavior: "instant" }));
  await page.mouse.wheel(0, 20000);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(boundary - 3);
  await page.mouse.wheel(0, -120);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(boundary - 117);
});

for (const [width, height] of [[1533, 691], [768, 900], [390, 844]]) {
  test(`landing keeps compact header spacing on load and navigation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-smooth-scroll", "ready");
    const gap = () => page.locator(".hero-label").evaluate(node => node.getBoundingClientRect().top - document.querySelector(".site-header").getBoundingClientRect().bottom);
    expect(await page.evaluate(() => scrollY)).toBe(0);
    expect(Math.abs(await gap() - 16)).toBeLessThan(1);
    await page.mouse.move(width / 2, height / 2);
    await page.mouse.wheel(0, 20000);
    await expect.poll(async () => Math.abs(await gap() - 16)).toBeLessThan(3);
    const note = await page.locator(".profile-note").boundingBox();
    expect(note.y + note.height).toBeLessThan(height);
    await page.locator("#about").evaluate(node => scrollTo({ top: node.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) - 20, behavior: "instant" }));
    await page.mouse.wheel(0, -20000);
    await expect.poll(async () => Math.abs(await gap() - 16)).toBeLessThan(3);
    await page.locator("#about").evaluate(node => scrollTo({ top: node.getBoundingClientRect().top + scrollY, behavior: "instant" }));
    await page.locator(".site-header .wordmark").click();
    await expect(page).toHaveURL(/#home$/);
    await expect.poll(async () => Math.abs(await gap() - 16)).toBeLessThan(3);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-smooth-scroll", "ready");
    await expect.poll(async () => Math.abs(await gap() - 16)).toBeLessThan(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("smooth scrolling falls back without breaking gallery controls", async ({ page }) => {
  await page.route("**/assets/vendor/lenis.js", route => route.abort());
  await page.goto("/photography.html");
  await expect(page.locator("html")).toHaveAttribute("data-smooth-scroll", "unavailable");
  await page.getByRole("button", { name: "Products", exact: true }).click();
  await expect(page.locator(".photo-card")).toHaveCount(2);
  await page.locator(".photo-button").first().click();
  await expect(page.locator("#photo-dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#photo-dialog")).not.toBeVisible();
});

test("project dialog scrolls natively and resumes page smoothing after closing", async ({ page }) => {
  await withContent(page, 'projects[0].overview = "Long project description. ".repeat(400);');
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-smooth-scroll", "ready");
  await page.locator(".project-card button").first().click();
  const dialog = page.locator("#project-dialog");
  await expect(dialog).toBeVisible();
  await expect(page.locator("html")).toHaveClass(/lenis-stopped/);
  const box = await dialog.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, 350);
  await expect.poll(() => dialog.evaluate(node => node.scrollTop)).toBeGreaterThan(100);
  await page.keyboard.press("Escape");
  await expect(page.locator("html")).not.toHaveClass(/lenis-stopped/);
  const before = await page.evaluate(() => scrollY);
  await page.mouse.move(200, 400);
  await page.mouse.wheel(0, -200);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(before - 180);
});

for (const width of [320, 390, 768, 1440]) {
  test(`integrated timeline and accessible fallback work with keyboard at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/#background");
    await expect(page.locator("[data-timeline-react]")).toHaveAttribute("data-ready", "true");
    await expect(page.locator("#background")).toHaveCSS("padding-top", "0px");
    await expect(page.locator("[data-journey-viewport] .text-link")).toBeInViewport();
    const sizing = await page.locator("[data-journey-track]").evaluate(node => ({ width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height }));
    expect(sizing.width).toBeGreaterThan(width);
    expect(sizing.height).toBeGreaterThan(250);
    expect(sizing.height).toBeLessThan(750);
    await expect(page.locator("[data-timeline-react] img")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Read as a list" })).toHaveCount(0);
    await expect(page.getByText("Learning. Building.", { exact: false })).toHaveCount(0);
    await expect(page.locator("#background-title")).toHaveText("Background");
    const heading = await page.locator("#background-title").boundingBox();
    const firstEntry = await page.locator("[data-journey-item]").first().boundingBox();
    expect(heading.x + heading.width).toBeLessThan(firstEntry.x);
    const origin = await page.locator(".journey-origin").boundingBox();
    expect(origin.x).toBeGreaterThan(heading.x + heading.width);
    expect(Math.abs(origin.y + origin.height / 2 - heading.y - heading.height / 2)).toBeLessThan(1);
    await expect(page.locator("[data-timeline-react] .timeline-content")).toHaveCount(0);
    const borders = await page.locator("[data-journey-item]").evaluateAll(nodes => nodes.map(node => getComputedStyle(node).borderWidth));
    expect(borders.every(value => value === "0px")).toBe(true);
    await page.locator("#journey").evaluate(node => scrollTo({ top: node.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(node.querySelector("[data-journey-viewport]")).top), behavior: "instant" }));
    await page.keyboard.press("PageDown");
    await expect.poll(() => page.locator("[data-journey-track]").evaluate(node => node.getBoundingClientRect().left)).toBeLessThan(-100);
    await page.locator("#journey").evaluate(node => {
      const ending = node.getBoundingClientRect().top + scrollY + Number(node.dataset.scrollPauseEnd);
      scrollTo({ top: ending - 80, behavior: "instant" });
    });
    await page.mouse.move(width / 2, 450);
    await page.mouse.wheel(0, 20000);
    const closing = page.locator('[data-journey-item="background-5"]');
    await expect(closing.locator("h3")).toHaveText("And much more to come!");
    await expect(closing.locator(".journey-copy")).toHaveCSS("opacity", "1");
    // Text fades on its own clock; allow the smoothed rail to reach its endpoint too.
    await expect.poll(() => page.locator(".journey-line").evaluate(node => Math.abs(
      node.getBoundingClientRect().right - document.querySelector('[data-journey-item="background-5"]').getBoundingClientRect().left,
    ))).toBeLessThan(2);
    const ending = await page.locator(".journey-line").evaluate(node => ({
      right: node.getBoundingClientRect().right,
      y: node.getBoundingClientRect().top,
      expected: document.querySelector('[data-journey-item="background-5"]').getBoundingClientRect().left,
    }));
    expect(Math.abs(ending.right - ending.expected)).toBeLessThan(2);
    await expect(closing.locator(".journey-stem, .journey-dot")).toHaveCount(0);
    const closingTitle = await closing.locator("h3").boundingBox();
    const lineHeight = await closing.locator("h3").evaluate(node => parseFloat(getComputedStyle(node).lineHeight));
    expect(Math.abs(closingTitle.height - lineHeight)).toBeLessThan(1);
    expect(Math.abs(closingTitle.y + closingTitle.height / 2 - ending.y)).toBeLessThan(2);
    expect(closingTitle.x).toBeGreaterThan(ending.right + 10);
    expect(closingTitle.x + closingTitle.width).toBeLessThan(width);
    const viewportWidth = await page.locator("[data-journey-viewport]").evaluate(node => node.clientWidth);
    expect(Math.abs(closingTitle.x + closingTitle.width - (viewportWidth - 20))).toBeLessThan(2);
    const closingBox = await closing.boundingBox();
    expect(closingBox.x + closingBox.width / 2).toBeGreaterThan(width / 2);
    const continueLink = page.locator("[data-journey-viewport]").getByRole("link", { name: "Continue to projects" });
    await continueLink.focus();
    await expect(continueLink).toBeInViewport();
    await page.keyboard.press("Enter");
    await expect(page.locator("#work-title")).toBeInViewport();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator("#timeline-fallback")).toBeVisible();
    const first = page.locator(".timeline-summary").first();
    await first.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".timeline-content").first()).toHaveAttribute("open", "");
    for (let i = 1; i < 5; i++) await page.keyboard.press("Tab");
    const last = page.locator(".timeline-summary").last();
    await expect(last).toBeFocused();
    await expect(last).toBeInViewport();
    await page.keyboard.press("Enter");
    await expect(page.locator(".timeline-content").last()).toHaveAttribute("open", "");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("timeline draws from its origin, reveals branches, reverses, and releases into Projects", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#background-timeline");
  await expect(page.locator("[data-timeline-react]")).toHaveAttribute("data-ready", "true");
  await page.locator("#journey").evaluate(node => window.scrollTo({ top: node.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(node.querySelector("[data-journey-viewport]")).top) - 80, behavior: "instant" }));
  const track = page.locator("[data-journey-track]");
  await expect(track).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
  await page.locator("#journey").evaluate(node => window.scrollTo({ top: node.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(node.querySelector("[data-journey-viewport]")).top), behavior: "instant" }));
  const before = await track.evaluate(node => node.getBoundingClientRect().left);
  const rail = page.locator(".journey-line");
  const firstCopy = page.locator('[data-journey-item="background-1"] .journey-copy');
  await expect(rail).toHaveCSS("width", "0px");
  await expect(firstCopy).toHaveCSS("opacity", "0");
  await expect(page.locator(".journey-origin")).toBeInViewport();
  await page.mouse.move(700, 300);
  await page.mouse.wheel(0, 100);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await page.waitForTimeout(150);
  expect(await track.evaluate(node => node.getBoundingClientRect().left)).toBeCloseTo(before, 0);
  await page.mouse.wheel(0, 300);
  await expect.poll(() => rail.evaluate(node => node.getBoundingClientRect().width)).toBeGreaterThan(1);
  expect(await track.evaluate(node => node.getBoundingClientRect().left)).toBeCloseTo(before, 0);
  await expect(firstCopy).toHaveCSS("opacity", "0");
  await page.mouse.wheel(0, 500);
  await expect.poll(() => track.evaluate(node => node.getBoundingClientRect().left)).toBeLessThan(before - 250);
  await expect(firstCopy).toHaveCSS("opacity", "1");
  const firstStem = page.locator('[data-journey-item="background-1"] .journey-stem');
  expect(await firstStem.evaluate(node => new DOMMatrixReadOnly(getComputedStyle(node).transform).m22)).toBeCloseTo(1, 2);
  await expect.poll(() => page.locator("[data-journey-viewport]").evaluate(node => Math.abs(node.getBoundingClientRect().top - document.querySelector(".site-header").getBoundingClientRect().bottom))).toBeLessThan(2);
  const link = await page.locator("[data-journey-viewport] .text-link").boundingBox();
  expect(link.x).toBeGreaterThan(1000);
  expect(link.y).toBeGreaterThan(750);
  await page.mouse.wheel(0, -900);
  await expect.poll(() => track.evaluate(node => node.getBoundingClientRect().left)).toBeCloseTo(before, 0);
  await expect(rail).toHaveCSS("width", "0px");
  await expect(firstCopy).toHaveCSS("opacity", "0");
  await page.locator("#journey").evaluate(node => window.scrollTo({ top: node.getBoundingClientRect().top + scrollY + Number(node.dataset.scrollPauseEnd) - 40, behavior: "instant" }));
  await expect(page.locator('[data-journey-item="background-5"]')).toBeInViewport();
  await expect(page.locator('.title-background-5 > *')).toHaveCount(0);
  await expect(page.locator('[data-journey-item="background-5"] .journey-copy')).toHaveCSS("opacity", "1");
  await page.mouse.move(700, 450);
  await page.mouse.wheel(0, 1000);
  await expect.poll(() => page.locator("#journey").evaluate(node => {
    const ending = node.getBoundingClientRect().top + scrollY + Number(node.dataset.scrollPauseEnd);
    return Math.abs(scrollY - ending);
  })).toBeLessThan(3);
  await expect(page.locator('[data-journey-item="background-5"] .journey-copy')).toHaveCSS("opacity", "1");
  await expect(page.locator('[data-journey-item="background-5"] h3')).toBeInViewport();
  await expect(page.locator("#work-title")).not.toBeInViewport();
  await page.mouse.wheel(0, 140);
  await expect.poll(() => page.locator("#journey").evaluate(node => scrollY - (node.getBoundingClientRect().top + scrollY + Number(node.dataset.scrollPauseEnd)))).toBeGreaterThan(30);
  await page.mouse.wheel(0, 1200);
  await expect(page.locator("#work-title")).toBeInViewport();
});

test("React timeline cleans up when reduced motion, enlarged text, or bundle failure selects the list", async ({ page }) => {
  await page.goto("/#background-timeline");
  await expect(page.locator("[data-timeline-react]")).toHaveAttribute("data-ready", "true");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("#timeline-fallback")).toBeVisible();
  await expect(page.locator(".timeline-title").first()).toHaveCSS("opacity", "1");
  await expect(page.locator("[data-journey-track]")).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 900, height: 500 });
  await expect(page.locator("[data-timeline-react]")).toHaveAttribute("data-ready", "true");
  await page.setViewportSize({ width: 900, height: 900 });
  await expect(page.locator("[data-timeline-react]")).toHaveAttribute("data-ready", "true");
  const enlargedText = await page.addStyleTag({ content: "html { font-size: 200%; }" });
  await expect(page.locator("#timeline-fallback")).toBeVisible();
  await expect(page.locator(".timeline-title").first()).toHaveCSS("opacity", "1");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await enlargedText.evaluate(node => node.remove());
  await expect(page.locator("[data-timeline-react]")).toHaveAttribute("data-ready", "true");
  await page.route("**/assets/vendor/timeline.js", route => route.abort());
  await page.reload();
  await expect(page.locator("#timeline-fallback")).toBeVisible();
  await page.locator(".timeline-summary").last().click();
  await expect(page.locator(".timeline-content").last()).toHaveAttribute("open", "");
});

test("phone swipes advance the pinned timeline without snapping back", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    const page = await context.newPage();
    await page.goto(`${test.info().project.use.baseURL}/#background-timeline`);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator("[data-timeline-react]")).toHaveAttribute("data-ready", "true");
    await page.locator("#journey").evaluate(node => {
      const viewport = node.querySelector("[data-journey-viewport]");
      window.scrollTo({ top: node.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(viewport).top) + Math.min(240, viewport.clientHeight * .28) + Math.min(320, innerWidth * .45), behavior: "instant" });
    });
    const cdp = await context.newCDPSession(page);
    const swipe = async () => {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 180, y: 650 }] });
      for (const y of [600, 550, 500, 450, 400]) {
        await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 180, y }] });
        await page.evaluate(() => new Promise(requestAnimationFrame));
      }
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    };
    await swipe();
    await expect.poll(() => page.locator("[data-journey-track]").evaluate(node => node.getBoundingClientRect().left)).toBeLessThan(-100);
    const x = await page.locator("[data-journey-track]").evaluate(node => node.getBoundingClientRect().left);
    await swipe();
    await expect.poll(() => page.locator("[data-journey-track]").evaluate(node => node.getBoundingClientRect().left)).toBeLessThan(x - 100);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally { await context.close(); }
});

test("mobile menu supports Escape, anchor navigation, and responsive resizing", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const menu = page.getByRole("button", { name: "Menu" });
  const nav = page.getByRole("navigation", { name: "Main navigation", exact: true });
  await expect(nav).not.toBeVisible();
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Tab");
  await expect(nav.getByRole("link", { name: /Me$/ })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(nav).not.toBeVisible();
  await expect(menu).toBeFocused();
  await menu.click();
  await nav.getByRole("link", { name: /Background/ }).click();
  await expect(nav).not.toBeVisible();
  await expect(page.locator("#background-title")).toBeInViewport();
  await expect.poll(() => page.locator("#background").evaluate(node => node.getBoundingClientRect().top - document.querySelector(".site-header").getBoundingClientRect().bottom)).toBeGreaterThanOrEqual(18);
  await menu.click();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(menu).not.toBeVisible();
  await expect(nav).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(nav).not.toBeVisible();
});

test("a phone swipe scrolls the page without jumping sections", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    const page = await context.newPage();
    await page.goto(`${test.info().project.use.baseURL}/`);
    await page.evaluate(() => document.fonts.ready);
    const cdp = await context.newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 180, y: 650 }] });
    for (const y of [600, 550, 500, 450, 400]) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 180, y }] });
      await page.evaluate(() => new Promise(requestAnimationFrame));
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100);
    expect(await page.evaluate(() => scrollY)).toBeLessThan(600);
    await expect(page.locator("#home")).toBeInViewport();
    await expect(page.locator("#about-title")).not.toBeInViewport();
  } finally { await context.close(); }
});

test("homepage previews prefer real photos and link to the photography collection", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await withContent(page, "photos[5].placeholder = false;");
  await page.goto("/");
  const first = page.locator("#featured-photos .photo-preview").first();
  await expect(first).toHaveAttribute("href", "photography.html#collection");
  await expect(first.locator(".photo-placeholder-note")).toHaveCount(0);
  await first.click();
  await expect(page.locator("#collection-title")).toBeInViewport();
  await page.unroute("**/scripts/content.js");
  await withContent(page, "photos.splice(0);");
  await page.goto("/");
  await expect(page.locator("#featured-photos .empty-state")).toBeVisible();
});

for (const width of [320, 390, 768, 1440]) {
  test(`focus-pull photography carousel navigates, resizes, and links at ${width}px`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    const height = width === 320 ? 568 : width === 390 ? 844 : width === 1440 ? 691 : 900;
    await page.setViewportSize({ width, height });
    await page.goto("/#photography");
    const host = page.locator("[data-photography-react]");
    await expect(host).toHaveAttribute("data-ready", "true");
    await expect(page.locator("#featured-photos")).not.toBeVisible();
    await expect(page.locator(".photography-placeholder, .fp-hover-prompt")).toHaveCount(0);
    await expect(page.locator(".photography-intro")).toHaveText("Featured photography, click to view more");
    await expect(page.getByRole("link", { name: "click to view more", exact: true })).toHaveAttribute("href", "photography.html#collection");
    await expect(page.locator(".photography-intro a")).toHaveCSS("color", "rgb(220, 101, 58)");
    const carousel = page.getByRole("region", { name: "Photography showcase" });
    const slides = carousel.locator(".fp-card");
    await expect(page.locator("#photo-preview-title")).toHaveText("Photography.");
    await expect(carousel.locator(".fp-cap, .fp-count, .fp-bar")).toHaveCount(0);
    await expect(carousel.getByRole("link", { name: "Explore photography", exact: true })).toHaveCount(0);
    await expect(page.locator(".photography-carousel")).toHaveCSS("border-width", "0px");
    const navigation = await carousel.locator(".fp-nav").boundingBox();
    const photograph = await slides.first().boundingBox();
    expect(navigation.y + navigation.height).toBeLessThan(photograph.y);
    expect(navigation.x + navigation.width / 2).toBeGreaterThan(width / 2);
    const heading = await page.locator("#photo-preview-title").boundingBox();
    const showcase = await page.locator(".photography-carousel").boundingBox();
    expect(Math.abs(navigation.x + navigation.width - showcase.x - showcase.width)).toBeLessThan(1);
    expect(heading.y).toBeGreaterThan(0);
    expect(photograph.width).toBeGreaterThan(width >= 1000 ? 660 : width * .7);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await slides.evaluateAll(nodes => nodes.every(node => node.getAttribute("href") === "photography.html#collection"))).toBe(true);
    await expect(slides).toHaveCount(6);
    await expect(carousel.locator(".fp-sr")).toContainText("Slide 1 of 6");
    await expect(slides.first()).toHaveCSS("filter", "none");
    expect(await slides.nth(1).evaluate(node => parseFloat(getComputedStyle(node).opacity))).toBeLessThan(.7);
    await page.getByRole("button", { name: "Pause slideshow" }).click();
    await expect(page.getByRole("button", { name: "Play slideshow" })).toHaveAttribute("aria-pressed", "true");
    await carousel.getByRole("button", { name: "Next photograph" }).click();
    await expect(carousel.locator(".fp-sr")).toContainText("Slide 2 of 6");
    await expect(slides.nth(1)).toHaveCSS("filter", "none");
    await carousel.focus();
    await page.keyboard.press("ArrowRight");
    await expect(carousel.locator(".fp-sr")).toContainText("Slide 3 of 6");
    await page.keyboard.press("End");
    await expect(carousel.locator(".fp-sr")).toContainText("Slide 6 of 6");
    await page.keyboard.press("Home");
    await expect(carousel.locator(".fp-sr")).toContainText("Slide 1 of 6");
    await page.setViewportSize({ width: width + 30, height: 800 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(host).not.toBeVisible();
    await expect(page.locator("#featured-photos")).toBeVisible();
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expect(host).toHaveAttribute("data-ready", "true");
    await page.locator('.fp-card[aria-current="true"]').focus();
    const destination = await page.locator('.fp-card[aria-current="true"]').getAttribute("href");
    await page.keyboard.press("Enter");
    await expect.poll(() => page.url()).toContain(destination);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Photography");
    expect(errors).toEqual([]);
  });
}

test("photography carousel leaves preview links when its bundle fails", async ({ page }) => {
  await page.goto("/#photography");
  await expect(page.locator("[data-photography-react]")).toHaveAttribute("data-ready", "true");
  await page.route("**/assets/vendor/timeline.js", route => route.abort());
  await page.reload();
  await expect(page.locator("[data-photography-react]")).not.toBeVisible();
  await expect(page.locator("#featured-photos .photo-preview").first()).toBeVisible();
  await page.getByRole("link", { name: "Photography details", exact: true }).click();
  await expect(page).toHaveURL(/photography\.html$/);
});

test("photography carousel supports dragging and horizontal wheels without capturing vertical scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto("/#photography");
  await expect(page.locator("[data-photography-react]")).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: "Pause slideshow" }).click();
  await page.getByRole("button", { name: "Next photograph", exact: true }).click();
  await expect(page.locator(".fp-sr")).toContainText("Slide 2 of 6");
  const track = page.locator(".fp-track");
  await track.scrollIntoViewIfNeeded();
  await expect(page.locator('.fp-card[aria-current="true"]')).toHaveCSS("filter", "none");
  const box = await track.boundingBox();
  const x = box.x + box.width / 2 + 150;
  const y = box.y + box.height / 2;
  const dragDistance = (await page.locator('.fp-card[aria-current="true"]').boundingBox()).width * .65;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - dragDistance, y, { steps: 18 });
  await page.mouse.up();
  await expect(page.locator(".fp-sr")).toContainText("Slide 3 of 6");
  await expect(page).toHaveURL(/\/#photography$/);
  const scroll = await track.evaluate(node => node.scrollLeft);
  const pageY = await page.evaluate(() => scrollY);
  await page.mouse.wheel(550, 0);
  await expect.poll(() => track.evaluate(node => node.scrollLeft)).toBeGreaterThan(scroll + 200);
  expect(Math.abs(await page.evaluate(() => scrollY) - pageY)).toBeLessThan(3);
  await page.mouse.wheel(0, 100);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(pageY + 50);
});

test("photography carousel accepts native phone swipes", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    const page = await context.newPage();
    await page.goto(`${test.info().project.use.baseURL}/#photography`);
    await expect(page.locator("[data-photography-react]")).toHaveAttribute("data-ready", "true");
    await page.getByRole("button", { name: "Pause slideshow" }).click();
    await page.locator(".fp-track").scrollIntoViewIfNeeded();
    const box = await page.locator(".fp-track").boundingBox();
    const pageY = await page.evaluate(() => scrollY);
    const cdp = await context.newCDPSession(page);
    const y = box.y + box.height / 2;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 300, y }] });
    for (const x of [260, 220, 180, 140, 100, 60]) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y }] });
      await page.evaluate(() => new Promise(requestAnimationFrame));
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(() => page.locator(".fp-track").evaluate(node => node.scrollLeft)).toBeGreaterThan(150);
    await expect(page.locator(".fp-sr")).not.toContainText("Slide 1 of 6");
    expect(Math.abs(await page.evaluate(() => scrollY) - pageY)).toBeLessThan(8);
    await expect(page).toHaveURL(/\/#photography$/);
  } finally { await context.close(); }
});

test("photography soft stop matches its anchor landing below the header", async ({ page }) => {
  await page.setViewportSize({ width: 1533, height: 691 });
  await page.goto("/#photography");
  await expect(page.locator("html")).toHaveAttribute("data-smooth-scroll", "ready");
  await expect(page.locator("[data-photography-react]")).toHaveAttribute("data-ready", "true");
  const gap = () => page.evaluate(() => document.querySelector("#photography .eyebrow").getBoundingClientRect().top - document.querySelector(".site-header").getBoundingClientRect().bottom);
  await expect.poll(async () => Math.abs(await gap() - 12)).toBeLessThan(2);
  const stop = await page.locator("#photography").evaluate(node => node.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) - parseFloat(getComputedStyle(node).scrollMarginTop));
  await page.evaluate(top => scrollTo({ top, behavior: "instant" }), stop - 100);
  await page.mouse.move(5, 200);
  await page.mouse.wheel(0, 20000);
  await expect.poll(async () => Math.abs(await gap() - 12)).toBeLessThan(2);
  await page.mouse.wheel(0, 140);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(stop + 28);
  expect(await page.evaluate(() => scrollY)).toBeLessThan(stop + 36);
  await page.locator('.main-nav a[href="#photography"]').click();
  await expect.poll(async () => Math.abs(await gap() - 12)).toBeLessThan(2);
});

test("photography autoplay returns directly from the last photo at the faster interval", async ({ page }) => {
  await page.goto("/#photography");
  await expect(page.locator("[data-photography-react]")).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: "Pause slideshow" }).click();
  const carousel = page.getByRole("region", { name: "Photography showcase" });
  await carousel.focus();
  await page.keyboard.press("End");
  await expect(page.locator(".fp-sr")).toContainText("Slide 6 of 6");
  await expect(page.locator('.fp-card[aria-current="true"]')).toHaveCSS("filter", "none");
  await page.locator(".fp-track").evaluate(node => {
    window.photoLoopPositions = [];
    node.addEventListener("scroll", () => window.photoLoopPositions.push(node.scrollLeft));
  });
  await page.getByRole("button", { name: "Play slideshow" }).click();
  await page.mouse.move(5, 200);
  await expect(page.locator(".fp-sr")).toContainText("Slide 1 of 6", { timeout: 4500 });
  await expect.poll(() => page.locator(".fp-track").evaluate(node => node.scrollLeft)).toBeLessThan(1);
  expect(await page.evaluate(() => window.photoLoopPositions.every(position => position < 1))).toBe(true);
  await expect(page.locator(".fp-sr")).toContainText("Slide 2 of 6", { timeout: 4500 });
});

test("homepage email can be copied", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/#contact");
  await page.getByRole("button", { name: "Copy email address" }).click();
  await expect(page.locator("#copy-status")).toHaveText("Email address copied.");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("damianszydlowski1000@gmail.com");
});

test("gallery keeps image proportions and row reading order", async ({ page }) => {
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/photography.html");
    const columns = width < 640 ? 1 : width < 1000 ? 2 : 3;
    const cards = await page.locator(".photo-card").all();
    for (let i = 0; i < cards.length; i++) {
      const img = cards[i].locator("img");
      const ratio = await img.evaluate(node => {
        const rect = node.getBoundingClientRect();
        return { actual: rect.width / rect.height, expected: Number(node.getAttribute("width")) / Number(node.getAttribute("height")) };
      });
      expect(Math.abs(ratio.actual - ratio.expected)).toBeLessThan(.01);
      if (i % columns > 0) {
        const previous = await cards[i - 1].boundingBox();
        const current = await cards[i].boundingBox();
        expect(current.x).toBeGreaterThan(previous.x);
        expect(Math.abs(current.y - previous.y)).toBeLessThan(1);
      }
    }
  }
});

test("featured photo reveals its card after filtering and handles empty content", async ({ page }) => {
  await page.goto("/photography.html");
  await page.getByRole("button", { name: "Events", exact: true }).click();
  await page.locator(".featured-photo-link").click();
  await expect(page.locator('#photo-filters [data-filter="all"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#product-study")).toBeInViewport();
  await withContent(page, "photos[5].placeholder = false;");
  await page.goto("/photography.html");
  await expect(page.locator(".featured-photo-link")).toHaveAttribute("href", "#event-light");
  await page.unroute("**/scripts/content.js");
  await withContent(page, "photos.splice(0);");
  await page.reload();
  await expect(page.locator(".feature-empty")).toBeVisible();
  await expect(page.locator("#photo-grid .empty-state")).toBeVisible();
});

for (const width of [320, 390, 768, 1440]) {
  for (const path of ["/", "/photography.html"]) {
    test(`${path} is usable at ${width}px`, async ({ page }) => {
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      await expect(page.locator(path === "/" ? ".project-card" : ".photo-card").first()).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      const filterButtons = await page.locator(".filter-button").all();
      for (const button of filterButtons) {
        const box = await button.boundingBox();
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
      }
      await page.locator(path === "/" ? ".project-card-button" : ".photo-button").first().click();
      await expect(page.locator("dialog")).toBeVisible();
      const dialog = await page.locator("dialog").boundingBox();
      expect(dialog.width).toBeLessThanOrEqual(width);
      expect(dialog.height).toBeLessThanOrEqual(900);
      await expect(path === "/" ? closeProject(page) : closePhoto(page)).toBeInViewport();
      expect(errors).toEqual([]);
    });
  }
}

test("project filters, details, Escape, focus and scroll restoration", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "School", exact: true }).click();
  await expect(page.locator(".project-card")).toHaveCount(2);
  const opener = page.getByRole("button", { name: "View Theory into practice" });
  await opener.scrollIntoViewIfNeeded();
  await opener.evaluate(node => node.addEventListener("pointerdown", () => { window.testOpeningScroll = window.scrollY; }, { once: true }));
  await opener.click();
  await expect(page.getByRole("heading", { name: "Theory into practice", exact: true, level: 2 })).toBeVisible();
  await expect(closeProject(page)).toBeFocused();
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.querySelector("dialog").contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog")).not.toBeVisible();
  await expect(opener).toBeFocused();
  await expect.poll(() => page.evaluate(() => Math.abs(window.scrollY - window.testOpeningScroll))).toBeLessThan(3);
  await expect(page.getByRole("button", { name: "School", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Personal", exact: true }).click();
  await expect(page.locator(".project-card")).toHaveCount(2);
  await page.getByRole("button", { name: "Work", exact: true }).click();
  await expect(page.locator(".project-card")).toHaveCount(2);
  await page.getByRole("button", { name: "All", exact: true }).click();
  await expect(page.locator(".project-card")).toHaveCount(6);
});

test("gallery filters, arrows, lightbox focus, and close", async ({ page }) => {
  await page.goto("/photography.html");
  await page.getByRole("button", { name: "Products", exact: true }).click();
  await expect(page.locator(".photo-card")).toHaveCount(2);
  const opener = page.locator(".photo-button").first();
  await opener.click();
  await expect(page.locator("#lightbox-title")).toHaveText("Objects / 01");
  await expect(page.getByRole("button", { name: "Previous photograph" })).toBeDisabled();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#lightbox-title")).toHaveText("Objects / 02");
  await expect(page.getByRole("button", { name: "Next photograph" })).toBeDisabled();
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("#lightbox-title")).toHaveText("Objects / 01");
  await closePhoto(page).click();
  await expect(opener).toBeFocused();
  await page.getByRole("button", { name: "All", exact: true }).click();
  await expect(page.locator(".photo-card")).toHaveCount(6);
});

test("touch swipe, unchanged photo colours, inquiry email and copy", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/photography.html");
  await page.locator(".photo-button").first().click();
  await page.locator("#lightbox-stage").evaluate(stage => {
    const start = new Touch({ identifier: 1, target: stage, clientX: 280, clientY: 200 });
    const end = new Touch({ identifier: 1, target: stage, clientX: 100, clientY: 205 });
    stage.dispatchEvent(new TouchEvent("touchstart", { touches: [start] }));
    stage.dispatchEvent(new TouchEvent("touchend", { touches: [], changedTouches: [end] }));
  });
  await expect(page.locator("#lightbox-title")).toHaveText("Objects / 01");
  await closePhoto(page).click();
  expect(await page.locator(".photo-image-wrap img").first().evaluate(img => getComputedStyle(img).filter)).toBe("none");
  const href = await page.getByRole("link", { name: "Email about a shoot" }).getAttribute("href");
  expect(decodeURIComponent(href)).toContain("Shoot type:");
  expect(href).toContain("damianszydlowski1000@gmail.com");
  await page.getByRole("button", { name: "Copy email address" }).click();
  await expect(page.locator("#copy-status")).toHaveText("Email address copied.");
});

test("single-photo and empty collections have usable controls", async ({ page }) => {
  await withContent(page, "photos.splice(1); projects.splice(0);");
  await page.goto("/photography.html");
  await expect(page.getByRole("button", { name: "Products", exact: true })).toHaveCount(0);
  await page.locator(".photo-button").click();
  await expect(page.getByRole("button", { name: "Next photograph" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Previous photograph" })).toBeDisabled();
  await page.goto("/");
  await expect(page.locator(".empty-state")).toBeVisible();
});

test("broken photos and long descriptions keep the page usable", async ({ page }) => {
  await withContent(page, 'photos[0].image.src = "assets/missing-image.jpg"; projects[0].overview = "A long project description. ".repeat(300);');
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/photography.html");
  await expect(page.locator(".media-fallback").first()).toBeVisible();
  await page.locator(".photo-button").first().click();
  await expect(page.locator("#lightbox-stage .media-fallback")).toBeVisible();
  await closePhoto(page).click();
  await page.goto("/");
  await page.locator(".project-card-button").first().click();
  await page.locator("#project-dialog").evaluate(dialog => { dialog.scrollTop = dialog.scrollHeight; });
  await expect(closeProject(page)).toBeInViewport();
  expect(await page.locator("#project-dialog").evaluate(dialog => dialog.scrollWidth <= dialog.clientWidth)).toBe(true);
});

// A minimal uncompressed GLB triangle exists only in the test response, not the portfolio.
function testGLB() {
  const binary = Buffer.alloc(36);
  [-1, -1, 0, 1, -1, 0, 0, 1, 0].forEach((value, i) => binary.writeFloatLE(value, i * 4));
  const document = { asset: { version: "2.0" }, scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0 }], meshes: [{ primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }], materials: [{ doubleSided: true }], buffers: [{ byteLength: 36 }], bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 36 }], accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3", min: [-1, -1, 0], max: [1, 1, 0] }] };
  const json = Buffer.from(JSON.stringify(document));
  const padded = Buffer.alloc(Math.ceil(json.length / 4) * 4, 0x20);
  json.copy(padded);
  const buffer = Buffer.alloc(12 + 8 + padded.length + 8 + binary.length);
  buffer.writeUInt32LE(0x46546c67, 0); buffer.writeUInt32LE(2, 4); buffer.writeUInt32LE(buffer.length, 8);
  buffer.writeUInt32LE(padded.length, 12); buffer.writeUInt32LE(0x4e4f534a, 16); padded.copy(buffer, 20);
  const offset = 20 + padded.length;
  buffer.writeUInt32LE(binary.length, offset); buffer.writeUInt32LE(0x004e4942, offset + 4); binary.copy(buffer, offset + 8);
  return buffer;
}

test("3D viewer and model load only after activation and render successfully", async ({ page }) => {
  await withContent(page, 'projects[0].model = { src: "assets/test-model.glb", alt: "Test triangle" };');
  await page.route("**/assets/test-model.glb", route => route.fulfill({ contentType: "model/gltf-binary", body: testGLB() }));
  const requests = [];
  page.on("request", request => { if (/model-viewer\.min\.js|test-model\.glb/.test(request.url())) requests.push(request.url()); });
  await page.goto("/");
  expect(requests).toEqual([]);
  await page.locator(".project-card-button").first().click();
  expect(requests).toEqual([]);
  await page.getByRole("button", { name: "Explore 3D model" }).click();
  await expect(page.locator("model-viewer.loaded")).toBeVisible({ timeout: 20000 });
  expect(requests.some(url => url.endsWith("test-model.glb"))).toBe(true);
  await closeProject(page).click();
  await expect(page.locator("model-viewer")).toHaveCount(0);
});

test("invalid CAD and unavailable WebGL retain poster and recovery controls", async ({ page }) => {
  await withContent(page, 'projects[0].model = { src: "assets/missing-model.glb" };');
  await page.goto("/");
  await page.locator(".project-card-button").first().click();
  await page.getByRole("button", { name: "Explore 3D model" }).click();
  await expect(page.locator(".model-status")).toContainText("unavailable", { timeout: 30000 });
  await expect(page.locator(".model-poster")).toBeVisible();
  await expect(page.getByRole("button", { name: "Try loading the model again" })).toBeEnabled();
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type.includes("webgl") ? null : original.call(this, type, ...args);
    };
  });
  await page.reload();
  await page.locator(".project-card-button").first().click();
  await page.getByRole("button", { name: "Explore 3D model" }).click();
  await expect(page.locator(".model-status")).toContainText("unavailable", { timeout: 30000 });
  await expect(page.locator(".model-poster")).toBeVisible();
});

test("reduced motion, enlarged text, and no-JavaScript contact", async ({ page, browser }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(await page.locator("html").evaluate(node => getComputedStyle(node).scrollBehavior)).toBe("auto");
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.goto("/photography.html");
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await noJs.newPage();
  await staticPage.setViewportSize({ width: 390, height: 844 });
  await staticPage.goto("/");
  await expect(staticPage.getByRole("navigation", { name: "Main navigation", exact: true })).toBeVisible();
  await expect(staticPage.getByRole("link", { name: "Send an email", exact: true })).toHaveAttribute("href", "mailto:damianszydlowski1000@gmail.com");
  await staticPage.locator(".timeline-summary").first().click();
  await expect(staticPage.locator(".timeline-content").first()).toHaveAttribute("open", "");
  await staticPage.goto("/photography.html");
  await expect(staticPage.getByRole("link", { name: "Email about a shoot" })).toBeVisible();
  await noJs.close();
});

test("slow photos reserve their space before loading", async ({ page }) => {
  let release;
  const waiting = new Promise(resolve => { release = resolve; });
  await page.route("**/assets/placeholders/study-01.svg", async route => { await waiting; await route.continue(); });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/photography.html", { waitUntil: "domcontentloaded" });
  const img = page.locator(".photo-image-wrap img").first();
  await img.scrollIntoViewIfNeeded();
  const before = await img.boundingBox();
  expect(before.height).toBeGreaterThan(100);
  expect(await img.evaluate(node => node.naturalWidth)).toBe(0);
  release();
  await expect.poll(() => img.evaluate(node => node.naturalWidth)).toBeGreaterThan(0);
  const after = await img.boundingBox();
  expect(Math.abs(before.height - after.height)).toBeLessThan(1);
});
