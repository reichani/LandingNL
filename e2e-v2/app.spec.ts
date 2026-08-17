import { expect, test } from "@playwright/test";

const baseMe = {
  user: { id: 1, email: "student@example.com", first_name: "Deren", full_name: "Deren Student", avatar_url: null },
  profile: {
    city: "Amsterdam",
    university: "University of Amsterdam",
    student_type: "bachelor",
    citizenship_group: "eu_eea_swiss",
    arrival_date: "2026-08-24",
    housing_status: "secured",
  },
  milestones: [],
  budget: [],
  work: { paid_hours: 0, payslip_ready: 0, salary_evidence_ready: 0 },
  applicationCount: 0,
};

test("public landing page stays flat and usable at 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Land without the chaos." })).toBeVisible();
  await expect(page.getByRole("link", { name: /Build my plan/ })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBeFalsy();
});

test("authenticated Home preserves NOW + THIS WEEK and five primary tabs", async ({ page }) => {
  await page.route("**/api/me", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(baseMe) }));
  await page.goto("/app");
  await expect(page.getByRole("heading", { name: /Hi Deren/ })).toBeVisible();
  await expect(page.getByText("NOW", { exact: true })).toBeVisible();
  await expect(page.getByText("THIS WEEK", { exact: true })).toBeVisible();
  await expect(page.locator(".bottom-nav a")).toHaveCount(5);
  await expect(page.locator(".bottom-nav a").allTextContents()).resolves.toEqual(["Home", "Plan", "Money", "Work", "Circle"]);
});

test("onboarding is three screens and lands on Home after save", async ({ page }) => {
  let saved = false;
  await page.route("**/api/me", (route) => {
    const body = saved ? baseMe : { ...baseMe, profile: null };
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.route("**/api/onboarding", async (route) => {
    if (route.request().method() === "POST") {
      saved = true;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
    }
    return route.continue();
  });

  await page.goto("/app/onboarding");
  await expect(page.getByText("1/3", { exact: true })).toBeVisible();
  await page.getByLabel("City").fill("Amsterdam");
  await page.getByLabel("Arrival date").fill("2026-08-24");
  await page.getByRole("button", { name: /Next/ }).click();

  await expect(page.getByText("2/3", { exact: true })).toBeVisible();
  await page.getByLabel("University / school").fill("University of Amsterdam");
  await page.getByRole("button", { name: /Next/ }).click();

  await expect(page.getByText("3/3", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "I have a place" }).click();
  await page.getByRole("button", { name: /Build my plan/ }).click();

  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("heading", { name: /Hi Deren/ })).toBeVisible();
});

test("mobile app has no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.route("**/api/me", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(baseMe) }));
  await page.goto("/app");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBeFalsy();
});
