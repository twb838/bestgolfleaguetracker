const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        headless: false, // Add this line to always run headed
        slowMo: 1000,    // Add this to slow down actions (optional)
    },

    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                headless: false, // Override for this project specifically
            },
        },
    ],

    webServer: [
        {
            command: 'cd frontend && npm start',
            port: 3000,
            reuseExistingServer: !process.env.CI,
        },
        {
            command: 'cd backend && python -m uvicorn app.main:app --reload --port 8000',
            port: 8000,
            reuseExistingServer: !process.env.CI,
        }
    ],
});