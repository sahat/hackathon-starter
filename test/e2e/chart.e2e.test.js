const { test, expect } = require('@playwright/test');

test.describe('Chart.js and Alpha Vantage API Integration', () => {
  let sharedPage;

  test.beforeAll(async ({ browser }) => {
    sharedPage = await browser.newPage();
    await sharedPage.goto('/api/chart');
    await sharedPage.waitForLoadState('networkidle');
    await sharedPage.waitForTimeout(2000); // Wait for chart to render
  });

  test.afterAll(async () => {
    if (sharedPage) await sharedPage.close();
  });

  test('should render Chart.js with Microsoft stock data', async () => {
    // Check for canvas element
    const canvas = sharedPage.locator('canvas#chart');
    await expect(canvas).toBeVisible();

    // Verify canvas has been initialized with Chart.js and has data
    const chartValidation = await sharedPage.evaluate(() => {
      const canvas = document.getElementById('chart');
      const chart = window.Chart.getChart(canvas);

      if (!chart) return { isInitialized: false, hasData: false };

      const { labels } = chart.data;
      const [dataset] = chart.data.datasets;

      return {
        isInitialized: true,
        hasData: labels?.length > 0 && dataset?.data?.length > 0,
        datasetLabel: dataset?.label,
        labelsCount: labels?.length,
        type: chart.config.type,
      };
    });

    // Verify chart is initialized
    expect(chartValidation.isInitialized).toBe(true);

    // Verify chart data is populated
    expect(chartValidation.hasData).toBe(true);

    // Verify chart has correct dataset label
    expect(chartValidation.datasetLabel).toContain("Microsoft's Closing Stock Values");

    // Verify chart type
    expect(chartValidation.type).toBe('line');

    // Verify data count (Alpha Vantage returns 100 data points)
    expect(chartValidation.labelsCount).toBe(100);
  });

  test('should display valid stock data with correct structure', async () => {
    // Get chart data details
    const chartDataInfo = await sharedPage.evaluate(() => {
      const canvas = document.getElementById('chart');
      const chart = Chart.getChart(canvas);

      return {
        labelsCount: chart.data.labels.length,
        dataCount: chart.data.datasets[0].data.length,
        firstLabel: chart.data.labels[0],
        lastLabel: chart.data.labels[chart.data.labels.length - 1],
        firstValue: chart.data.datasets[0].data[0],
      };
    });

    // Verify data integrity
    expect(chartDataInfo.labelsCount).toBe(100);
    expect(chartDataInfo.dataCount).toBe(100);

    // Verify date format (YYYY-MM-DD)
    expect(chartDataInfo.firstLabel).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(chartDataInfo.lastLabel).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // Verify stock values are valid numbers
    expect(parseFloat(chartDataInfo.firstValue)).not.toBeNaN();
    expect(parseFloat(chartDataInfo.firstValue)).toBeGreaterThan(0);
  });

  test('should use live data from Alpha Vantage API', async () => {
    // Verify we're using live data, not fallback
    const dataTypeText = await sharedPage.locator('h6').textContent();
    expect(dataTypeText).toBe('Using data from Alpha Vantage');

    // Get the date range from chart data
    const dateInfo = await sharedPage.evaluate(() => {
      const canvas = document.getElementById('chart');
      const chart = Chart.getChart(canvas);
      const { labels } = chart.data;
      return {
        firstDate: labels[0],
        lastDate: labels[labels.length - 1],
      };
    });

    // Verify dates are NOT the hardcoded fallback data
    // Fallback data range: 2023-03-02 to 2023-07-25
    expect(dateInfo.lastDate).not.toBe('2023-07-25');
  });
});
