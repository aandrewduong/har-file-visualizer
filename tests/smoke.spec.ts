import { expect, test } from "@playwright/test";
import { existsSync } from "node:fs";

const HAR_PATH = "public/examples/api-debug.har";

test.beforeAll(() => {
  if (!existsSync(HAR_PATH)) {
    throw new Error(
      `Example HAR not found at ${HAR_PATH}. Drop one there or update HAR_PATH.`,
    );
  }
});

// Each test gets a fresh BrowserContext, so localStorage starts empty —
// no manual clear needed (and clearing on every navigation would break the
// persistence assertion in the splitter test).

// Entry count of the HAR fixture used by uploadExampleHar — keep in sync if
// HAR_PATH changes.
const FIXTURE_ENTRY_COUNT = 7;

async function uploadExampleHar(page: import("@playwright/test").Page) {
  await page.locator('input[type="file"]').setInputFiles(HAR_PATH);
  await expect(
    page.getByText(new RegExp(`of ${FIXTURE_ENTRY_COUNT} requests`)),
  ).toBeVisible({ timeout: 15_000 });
}

// `getByRole("row")` matches every <tr> too (HTML implicit role), and the
// Summary "By type" table sits above the grid. Scope row queries to the grid.
function requestRows(page: import("@playwright/test").Page) {
  return page.getByRole("grid").getByRole("row");
}

test("loads the dropzone with privacy notice", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "HAR file visualizer" }),
  ).toBeVisible();
  await expect(page.getByText(/parsed locally in your browser/i)).toBeVisible();
});

test("uploads the example HAR and renders the workspace", async ({ page }) => {
  await page.goto("/");
  await uploadExampleHar(page);
  await expect(
    page.getByRole("button", { name: /load another file/i }),
  ).toBeVisible();
  // N data rows + 1 header row inside the grid.
  await expect(requestRows(page)).toHaveCount(FIXTURE_ENTRY_COUNT + 1);
});

test("selects a request and shows the detail panel", async ({ page }) => {
  await page.goto("/");
  await uploadExampleHar(page);

  // Skip header row (index 0).
  await requestRows(page).nth(1).click();

  await expect(page.getByRole("button", { name: "Headers" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Timing" })).toBeVisible();
  await expect(page.getByRole("button", { name: /copy url/i })).toBeVisible();
});

test("filters by search term", async ({ page }) => {
  await page.goto("/");
  await uploadExampleHar(page);

  // "auth" matches the auth/me + auth/login entries in api-debug.har, so the
  // unfiltered count drops to a smaller (non-zero) number.
  await page.getByRole("searchbox").fill("auth");
  const counter = page.getByText(
    new RegExp(`of ${FIXTURE_ENTRY_COUNT} requests`),
  );
  await expect(counter).not.toHaveText(
    new RegExp(`^${FIXTURE_ENTRY_COUNT} of ${FIXTURE_ENTRY_COUNT}`),
  );
});

test("drags the list/waterfall splitter and persists the new width", async ({
  page,
}) => {
  await page.goto("/");
  await uploadExampleHar(page);

  const splitter = page.getByRole("separator", { name: "Resize request list" });
  const before = await splitter.boundingBox();
  if (!before) throw new Error("splitter has no bounding box");

  const startX = before.x;
  const startY = before.y + before.height / 2;
  const dragDistance = 120;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + dragDistance, startY, { steps: 8 });
  await page.mouse.up();

  await expect(async () => {
    const after = await splitter.boundingBox();
    if (!after) throw new Error("splitter has no bounding box after drag");
    expect(after.x).toBeGreaterThan(startX + dragDistance - 4);
    expect(after.x).toBeLessThan(startX + dragDistance + 4);
  }).toPass({ timeout: 2_000 });

  const persistedWidth = await page.evaluate(() =>
    localStorage.getItem("hfv:list-width"),
  );
  expect(Number(persistedWidth)).toBeGreaterThan(500);

  // Verify width restores on reload.
  await page.reload();
  await uploadExampleHar(page);
  const reloaded = await page
    .getByRole("separator", { name: "Resize request list" })
    .boundingBox();
  if (!reloaded) throw new Error("splitter missing after reload");
  expect(Math.abs(reloaded.x - (startX + dragDistance))).toBeLessThan(8);
});

test("opens detail panel and shows its splitter", async ({ page }) => {
  await page.goto("/");
  await uploadExampleHar(page);
  await requestRows(page).nth(1).click();

  await expect(
    page.getByRole("separator", { name: "Resize detail panel" }),
  ).toBeVisible();
});

test("loads a bundled example via the dropzone", async ({ page }) => {
  await page.goto("/");
  // News-site example has 12 entries.
  await page
    .getByRole("button", { name: /news site page load/i })
    .click();

  await expect(page.getByText(/of 12 requests/)).toBeVisible({
    timeout: 10_000,
  });
  await expect(requestRows(page)).toHaveCount(13);
});

test("surfaces an error when an example fails to fetch", async ({ page }) => {
  await page.route("**/examples/news-site.har", (route) =>
    route.fulfill({ status: 404, body: "not found" }),
  );

  await page.goto("/");
  await page
    .getByRole("button", { name: /news site page load/i })
    .click();

  await expect(page.getByRole("alert")).toContainText(/HTTP 404/);
});
