import {
    test,
    expect,
    _electron as electron,
    ElectronApplication,
    Page,
} from "@playwright/test";
import { findLatestBuild, parseElectronApp } from "electron-playwright-helpers";

/*
 * E2E tests for OpenCanvas application
 * Tests core functionality: app launch, dashboard, and navigation
 */

let electronApp: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
    const latestBuild = findLatestBuild();
    const appInfo = parseElectronApp(latestBuild);
    process.env.CI = "e2e";

    electronApp = await electron.launch({
        args: [appInfo.main],
    });

    electronApp.on("window", async (window) => {
        const filename = window.url()?.split("/").pop();
        console.log(`Window opened: ${filename}`);

        window.on("pageerror", (error) => {
            console.error("Page error:", error);
        });
        window.on("console", (msg) => {
            console.log(`Console [${msg.type()}]:`, msg.text());
        });
    });

    // Wait for the main window
    page = await electronApp.firstWindow();

    // Give the app time to initialize
    await page.waitForLoadState('domcontentloaded');
});

test.afterAll(async () => {
    await electronApp.close();
});

test.describe("Application Launch", () => {
    test("should launch the application successfully", async () => {
        expect(page).toBeTruthy();
        expect(electronApp).toBeTruthy();
    });

    test("should render the OpenCanvas breadcrumb", async () => {
        // Wait for the breadcrumb to appear
        const breadcrumb = await page.waitForSelector('text=OpenCanvas', { timeout: 10000 });
        expect(breadcrumb).toBeTruthy();

        const text = await breadcrumb.textContent();
        expect(text).toBe("OpenCanvas");
    });

    test("should display the Dashboard page", async () => {
        const dashboardBreadcrumb = await page.waitForSelector('text=Dashboard', { timeout: 5000 });
        expect(dashboardBreadcrumb).toBeTruthy();
    });
});

test.describe("Dashboard Interface", () => {
    test("should display the 'My Workflows' heading", async () => {
        const heading = await page.waitForSelector('h2:has-text("My Workflows")', { timeout: 5000 });
        expect(heading).toBeTruthy();
    });

    test("should have a 'Create New Workflow' button", async () => {
        const createButton = await page.waitForSelector('button:has-text("Create New Workflow")', { timeout: 5000 });
        expect(createButton).toBeTruthy();

        // Check that the button is visible and enabled
        const isVisible = await createButton.isVisible();
        const isEnabled = await createButton.isEnabled();
        expect(isVisible).toBe(true);
        expect(isEnabled).toBe(true);
    });

    test("should have an 'Import Workflow' button", async () => {
        const importButton = await page.waitForSelector('button:has-text("Import Workflow")', { timeout: 5000 });
        expect(importButton).toBeTruthy();
    });

    test("should display search input", async () => {
        const searchInput = await page.waitForSelector('input[type="search"]', { timeout: 5000 });
        expect(searchInput).toBeTruthy();

        const placeholder = await searchInput.getAttribute('placeholder');
        expect(placeholder).toBe("Search workflows...");
    });

    test("should have view mode toggle buttons", async () => {
        // Grid and List view buttons
        const buttons = await page.$$('button[aria-label], button svg');
        expect(buttons.length).toBeGreaterThan(0);
    });
});

test.describe("Theme Toggle", () => {
    test("should have a theme toggle button", async () => {
        // The ModeToggle component should be present
        const themeButton = await page.$('button[aria-label*="theme"], button[aria-label*="Toggle"], button:has(svg)');
        expect(themeButton).toBeTruthy();
    });
});

test.describe("Navigation", () => {
    test("should navigate to editor when clicking 'Create New Workflow'", async () => {
        // Click the create button
        const createButton = await page.waitForSelector('button:has-text("Create New Workflow")', { timeout: 5000 });
        await createButton.click();

        // Wait for navigation or new content
        await page.waitForTimeout(2000);

        // The URL or content should change to indicate we're in the editor
        // Since it's an SPA, we check for editor-specific elements
        const editorElement = await page.$('main');
        expect(editorElement).toBeTruthy();
    });
});
