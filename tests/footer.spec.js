import { test, expect } from "@playwright/test";

for (const path of ["/", "/photography.html"]) {
  for (const width of [320, 390, 768, 1440]) {
    test(`dot-matrix footer fits ${path} at ${width}px`, async ({ page }) => {
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      const footer = page.getByRole("contentinfo");
      await footer.scrollIntoViewIfNeeded();
      await expect(page.locator("[data-footer-react]")).toHaveAttribute("data-ready", "true");
      await expect(footer).toHaveCount(1);
      await expect(footer.locator(".hwf-sr")).toHaveText("damian");
      await expect(footer.locator("canvas")).toBeVisible();
      await expect(page.locator(".footer-bottom")).toContainText(`${new Date().getFullYear()} Damian Szydlowski`);
      await expect(page.locator(".footer-bottom")).toContainText("Made with lots of white Monster and Red Bull.");
      await expect(footer.locator("a, nav")).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const metadata = await page.locator(".footer-bottom").boundingBox();
      const artwork = await page.locator(".footer-region").boundingBox();
      expect(metadata.y + metadata.height).toBeLessThanOrEqual(artwork.y + 1);
      const box = await footer.boundingBox();
      expect(box.height).toBeLessThanOrEqual(600);
      expect(errors).toEqual([]);
    });
  }
}
