const { test, expect } = require('@playwright/test');

test.describe('Chart.js and Alpha Vantage API Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/api/chart');
    await page.waitForLoadState('networkidle');
  });

  test('should load Chart page and display basic elements', async ({ page }) => {
    // Basic page checks
    await expect(page).toHaveTitle(/Chart/);
    await expect(page.locator('h2')).toContainText('Chart.js and Alpha Vantage');

    // Check for Font Awesome icon
    const chartIcon = page.locator('h2 i.fas.fa-chart-bar');
    await expect(chartIcon).toBeVisible();

    // Check for documentation buttons
    const chartJsDocsBtn = page.locator('a[href*="chartjs.org"]');
    const alphaVantageDocsBtn = page.locator('a[href*="alphavantage.co"]');
    await expect(chartJsDocsBtn).toBeVisible();
    await expect(chartJsDocsBtn).toContainText('Chart.js Docs');
    await expect(alphaVantageDocsBtn).toBeVisible();
    await expect(alphaVantageDocsBtn).toContainText('Alpha Vantage Docs');

    // Check for subtitle
    await expect(page.locator('h3')).toContainText('Chart.js — Line Chart Demo using data from Alpha Vantage');

    // Check for descriptive text (use more specific selector)
    const mainContent = page.locator('.container').nth(1); // The main content container
    await expect(mainContent).toContainText('Alpha Vantage APIs are grouped into four categories');
    await expect(mainContent).toContainText('Microsoft');
  });

  test('should load Chart.js library', async ({ page }) => {
    // Verify Chart.js library is loaded
    const chartLibLoaded = await page.evaluate(() => typeof window.Chart !== 'undefined');
    expect(chartLibLoaded).toBe(true);

    // Check for Chart.js script tag
    const chartScript = page.locator('script[src*="chart"]');
    await expect(chartScript).toHaveCount(1);
  });

  test('should display data type message (live or fallback data)', async ({ page }) => {
    // Check for data type header
    const dataTypeHeader = page.locator('h6');
    await expect(dataTypeHeader).toBeVisible();

    // Should contain either live data message or fallback message
    const dataTypeText = await dataTypeHeader.textContent();
    expect(dataTypeText).toMatch(/Using data from Alpha Vantage|Unable to get live data from Alpha Vantage/);
  });

  test('should render Chart.js canvas and display Microsoft stock data', async ({ page }) => {
    // Wait for chart to render
    await page.waitForTimeout(2000);

    // Check for canvas element
    const canvas = page.locator('canvas#chart');
    await expect(canvas).toBeVisible();

    // Verify canvas has been initialized with Chart.js and has data
    const chartValidation = await page.evaluate(() => {
      const canvas = document.getElementById('chart');
      const chart = window.Chart.getChart(canvas);

      if (!chart) return { isInitialized: false, hasData: false, datasetLabel: null };

      const { labels } = chart.data;
      const [dataset] = chart.data.datasets;

      return {
        isInitialized: true,
        hasData: labels && labels.length > 0 && dataset && dataset.data && dataset.data.length > 0,
        datasetLabel: dataset ? dataset.label : null,
      };
    });

    // Verify chart is initialized
    expect(chartValidation.isInitialized).toBe(true);

    // Verify chart data is populated
    expect(chartValidation.hasData).toBe(true);

    // Verify chart has correct dataset label
    expect(chartValidation.datasetLabel).toContain("Microsoft's Closing Stock Values");
  });

  test('should verify chart data structure', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Check data type to determine if using live API data
    const dataTypeText = await page.locator('h6').textContent();

    // Get chart data details
    const chartDataInfo = await page.evaluate(() => {
      const canvas = document.getElementById('chart');
      const chart = Chart.getChart(canvas);
      if (!chart) return null;

      return {
        labelsCount: chart.data.labels.length,
        dataCount: chart.data.datasets[0].data.length,
        firstLabel: chart.data.labels[0],
        lastLabel: chart.data.labels[chart.data.labels.length - 1],
        firstValue: chart.data.datasets[0].data[0],
      };
    });

    expect(chartDataInfo).not.toBeNull();
    expect(chartDataInfo.labelsCount).toBeGreaterThan(0);
    expect(chartDataInfo.dataCount).toBe(chartDataInfo.labelsCount);

    // Verify date format (YYYY-MM-DD)
    expect(chartDataInfo.firstLabel).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(chartDataInfo.lastLabel).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // Verify stock values are valid numbers
    expect(parseFloat(chartDataInfo.firstValue)).not.toBeNaN();
    expect(parseFloat(chartDataInfo.firstValue)).toBeGreaterThan(0);

    // If using live data, should have 100 data points
    if (dataTypeText.includes('Using data from Alpha Vantage')) {
      expect(chartDataInfo.labelsCount).toBe(100);
    }
  });

  test('should handle fallback data when API is unavailable', async ({ page, context }) => {
    // Force API failure
    await context.route('**/alphavantage.co/query**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          'Error Message': 'the parameter apikey is invalid or missing.',
        }),
      });
    });

    await page.goto('/api/chart');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Should display fallback data message
    const dataTypeText = await page.locator('h6').textContent();
    expect(dataTypeText).toContain('Unable to get live data from Alpha Vantage');

    // Chart should still render even with fallback data
    const canvas = page.locator('canvas#chart');
    await expect(canvas).toBeVisible();

    // Verify chart is initialized
    const isChartInitialized = await page.evaluate(() => {
      const canvas = document.getElementById('chart');
      const chart = Chart.getChart(canvas);
      return chart !== null && chart !== undefined;
    });
    expect(isChartInitialized).toBe(true);

    // Verify fallback data is loaded (should have 100 data points)
    const chartDataInfo = await page.evaluate(() => {
      const canvas = document.getElementById('chart');
      const chart = Chart.getChart(canvas);
      return {
        dataCount: chart.data.labels.length,
        firstDate: chart.data.labels[0],
        lastDate: chart.data.labels[chart.data.labels.length - 1],
      };
    });

    expect(chartDataInfo.dataCount).toBe(100);
    // Verify it's using the hardcoded fallback data (2023-03-02 to 2023-07-25)
    expect(chartDataInfo.firstDate).toBe('2023-03-02');
    expect(chartDataInfo.lastDate).toBe('2023-07-25');
  });

  test('should verify chart configuration (type and responsive options)', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Get chart configuration details in a single evaluation
    const chartConfig = await page.evaluate(() => {
      const canvas = document.getElementById('chart');
      const chart = Chart.getChart(canvas);
      return {
        type: chart.config.type,
        responsive: chart.options.responsive,
        maintainAspectRatio: chart.options.maintainAspectRatio,
      };
    });

    // Verify chart type is line chart
    expect(chartConfig.type).toBe('line');

    // Verify responsive options
    expect(chartConfig.responsive).toBe(true);
    expect(chartConfig.maintainAspectRatio).toBe(true);
  });

  test('should successfully fetch live data with valid API key', async ({ page }) => {
    await page.waitForTimeout(2000);

    // With valid API key, should get live data from Alpha Vantage
    const dataTypeText = await page.locator('h6').textContent();
    expect(dataTypeText).toBe('Using data from Alpha Vantage');

    // Get the date range from chart data
    const dateInfo = await page.evaluate(() => {
      const canvas = document.getElementById('chart');
      const chart = Chart.getChart(canvas);
      const { labels } = chart.data;
      return {
        firstDate: labels[0],
        lastDate: labels[labels.length - 1],
        totalCount: labels.length,
      };
    });

    // Verify we have exactly 100 data points (Alpha Vantage compact outputsize)
    expect(dateInfo.totalCount).toBe(100);

    // Verify dates are recent (not the hardcoded 2023 fallback data)
    // Fallback data range: 2023-03-02 to 2023-07-25
    // Live data should have dates from 2024 or later
    const lastDateYear = new Date(dateInfo.lastDate).getFullYear();
    expect(lastDateYear).toBeGreaterThanOrEqual(2024);

    // And the last day shouldn't be 2023-07-25(fallback data)
    expect(dateInfo.lastDate).not.toBe('2023-07-25');
  });
});
