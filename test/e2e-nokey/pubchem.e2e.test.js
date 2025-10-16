const { test, expect } = require('@playwright/test');
test.setTimeout(60_000); // 60s

test.describe('PubChem API Integration', () => {
  test.describe.configure({ mode: 'serial' });
  let sharedPage;

  test.beforeAll(async ({ browser }) => {
    // Open one page for the whole suite to avoid repeated expensive navigations
    sharedPage = await browser.newPage();
    await sharedPage.goto('/api/pubchem');
    await sharedPage.waitForLoadState('networkidle');
  });

  test.afterAll(async () => {
    if (sharedPage) await sharedPage.close();
  });

  test('should launch app, navigate to PubChem API page, and handle API response', async () => {
    // Check page title and header
    await expect(sharedPage).toHaveTitle(/PubChem API/);
    await expect(sharedPage.locator('h2')).toContainText('PubChem API - Chemical Information');

    // Check for chemical information section
    const chemicalInfoSection = sharedPage.locator('.card .card-header:has-text("Chemical Information")');
    await expect(chemicalInfoSection).toBeVisible();

    // Check for either successful data display or error handling
    const hasChemicalData = (await sharedPage.locator('.card-body:has-text("Aspirin")').count()) > 0;

    expect(hasChemicalData).toBeTruthy();
  });

  test('should display chemical image or fallback message', async () => {
    // Check for either chemical structure image or fallback message
    const hasImage = (await sharedPage.locator('img[alt*="Aspirin"]').count()) > 0;
    const hasFallback = (await sharedPage.locator('.alert-info:has-text("2D Structure image not available")').count()) > 0;

    expect(hasImage || hasFallback).toBeTruthy();
  });

  test('should display chemical properties and molecular data', async () => {
    // Test Chemical and Physical Properties section
    const propertiesCard = sharedPage.locator('.card.text-white.bg-info');
    await expect(propertiesCard).toBeVisible();
    await expect(sharedPage.locator('.card-header h6', { hasText: 'Chemical and Physical Properties' })).toBeVisible();

    // Test molecular properties section
    const molecularPropsSection = sharedPage.locator('h6', { hasText: 'Molecular Properties' });
    if ((await molecularPropsSection.count()) > 0) {
      await expect(molecularPropsSection).toBeVisible();

      // Test for molecular formula if present
      const molecularFormula = sharedPage.locator('text=/Molecular Formula:/');
      if ((await molecularFormula.count()) > 0) {
        await expect(molecularFormula).toBeVisible();
      }

      // Test for molecular weight if present
      const molecularWeight = sharedPage.locator('text=/Molecular Weight:/');
      if ((await molecularWeight.count()) > 0) {
        await expect(molecularWeight).toBeVisible();
        // Check for g/mol in the molecular weight context specifically
        await expect(sharedPage.locator('li:has-text("Molecular Weight") >> text=/g\/mol/')).toBeVisible();
      }

      // Test for complexity if present
      const complexity = sharedPage.locator('text=/Complexity:/');
      if ((await complexity.count()) > 0) {
        await expect(complexity).toBeVisible();
      }

      // Test for heavy atom count if present
      const heavyAtomCount = sharedPage.locator('text=/Heavy Atom Count:/');
      if ((await heavyAtomCount.count()) > 0) {
        await expect(heavyAtomCount).toBeVisible();
      }
    }

    // Test physicochemical properties section
    const physicoPropsSection = sharedPage.locator('h6', { hasText: 'Physicochemical Properties' });
    if ((await physicoPropsSection.count()) > 0) {
      await expect(physicoPropsSection).toBeVisible();

      // Test for TPSA if present
      const tpsa = sharedPage.locator('text=/Topological Polar Surface Area:/');
      if ((await tpsa.count()) > 0) {
        await expect(tpsa).toBeVisible();
      }

      // Test for XLogP if present
      const xlogp = sharedPage.locator('text=/XLogP.*Partition Coefficient/');
      if ((await xlogp.count()) > 0) {
        await expect(xlogp).toBeVisible();
      }

      // Test for hydrogen bond donors/acceptors if present
      const hbondDonors = sharedPage.locator('text=/Hydrogen Bond Donors:/');
      if ((await hbondDonors.count()) > 0) {
        await expect(hbondDonors).toBeVisible();
      }

      const hbondAcceptors = sharedPage.locator('text=/Hydrogen Bond Acceptors:/');
      if ((await hbondAcceptors.count()) > 0) {
        await expect(hbondAcceptors).toBeVisible();
      }

      // Test for rotatable bonds if present
      const rotatableBonds = sharedPage.locator('text=/Rotatable Bonds:/');
      if ((await rotatableBonds.count()) > 0) {
        await expect(rotatableBonds).toBeVisible();
      }
    }
  });

  test('should display synonyms and alternative names', async () => {
    // Test synonyms section
    const synonymsSection = sharedPage.locator('h5', { hasText: 'Synonyms and Alternative Names' });
    await expect(synonymsSection).toBeVisible();

    // Check if synonyms are available or if warning is shown
    const synonymBadges = sharedPage.locator('.badge.bg-secondary.text-white');
    const synonymsWarning = sharedPage.locator('.alert.alert-warning', { hasText: 'Synonyms data is not available' });

    const hasSynonyms = (await synonymBadges.count()) > 0;
    const hasWarning = (await synonymsWarning.count()) > 0;

    expect(hasSynonyms || hasWarning).toBeTruthy();

    if (hasSynonyms) {
      // Verify synonyms are displayed as badges
      await expect(synonymBadges.first()).toBeVisible();
      // Should have at most 10 synonyms displayed
      expect(await synonymBadges.count()).toBeLessThanOrEqual(10);
    }
  });

  test('should display safety and hazard information when available', async () => {
    // Test safety information section if present
    const safetyCard = sharedPage.locator('.card.text-white.bg-warning');
    if ((await safetyCard.count()) > 0) {
      await expect(safetyCard).toBeVisible();
      await expect(sharedPage.locator('.card-header h6', { hasText: 'Safety and Hazard Information' })).toBeVisible();

      // Test for warning icons in safety information
      const warningIcons = sharedPage.locator('.fas.fa-exclamation-triangle.fa-sm.text-warning');
      if ((await warningIcons.count()) > 0) {
        await expect(warningIcons.first()).toBeVisible();
      }
    }
  });

  test('should display chemical classifications when available', async () => {
    // Test classifications section if present
    const classificationsCard = sharedPage.locator('.card.text-white.bg-secondary');
    if ((await classificationsCard.count()) > 0) {
      await expect(classificationsCard).toBeVisible();
      await expect(sharedPage.locator('.card-header h6', { hasText: 'Chemical Classifications' })).toBeVisible();

      // Test for classification badges
      const classificationBadges = sharedPage.locator('.badge.badge-info');
      if ((await classificationBadges.count()) > 0) {
        await expect(classificationBadges.first()).toBeVisible();
      }
    }
  });

  test('should display additional information and usage section', async () => {
    // Test additional information section
    const additionalInfoCard = sharedPage.locator('.card.text-white.bg-dark');
    await expect(additionalInfoCard).toBeVisible();
    await expect(sharedPage.locator('.card-header h6', { hasText: 'Additional Information & Usage' })).toBeVisible();

    // Test medical information section
    const medicalInfoSection = sharedPage.locator('h6', { hasText: 'Medical Information' });
    await expect(medicalInfoSection).toBeVisible();

    // Check for medical information content or fallback message
    const therapeuticUses = sharedPage.locator('text=/Therapeutic Uses:/');
    const pharmacology = sharedPage.locator('text=/Pharmacology:/');
    const medicalUses = sharedPage.locator('text=/Medical Uses:/');
    const noMedicalInfo = sharedPage.locator('text=/No specific medical information available/');
    const chemicalCompoundInfo = sharedPage.locator('text=/Chemical compound information available/');
    const limitedInfo = sharedPage.locator('text=/Limited information available/');

    const hasMedicalContent = (await therapeuticUses.count()) > 0 || (await pharmacology.count()) > 0 || (await medicalUses.count()) > 0 || (await noMedicalInfo.count()) > 0 || (await chemicalCompoundInfo.count()) > 0 || (await limitedInfo.count()) > 0;

    expect(hasMedicalContent).toBeTruthy();

    // Test manufacturing information section
    const manufacturingInfoSection = sharedPage.locator('h6', { hasText: 'Manufacturing Info' });
    await expect(manufacturingInfoSection).toBeVisible();

    // Check for manufacturing information or fallback message
    const manufacturingNotAvailable = sharedPage.locator('text=/Manufacturing information not available/');
    const manufacturingContent = sharedPage.locator('.col-md-6:has(h6:has-text("Manufacturing Info")) p');

    const hasManufacturingNotAvailable = (await manufacturingNotAvailable.count()) > 0;
    const hasManufacturingContent = (await manufacturingContent.count()) > 0;

    // Should have either manufacturing info or the "not available" message
    expect(hasManufacturingNotAvailable || hasManufacturingContent).toBeTruthy();
  });
});
