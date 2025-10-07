const { test, expect } = require('@playwright/test');

test.describe('PubChem API Integration', () => {
  test('should launch app, navigate to PubChem API page, and handle API response', async ({ page }) => {
    await page.goto('/api/pubchem');

    // Check page title and header
    await expect(page).toHaveTitle(/PubChem API/);
    await expect(page.locator('h2')).toContainText('PubChem API - Chemical Information');

    // Check for API documentation links in the button group
    await expect(page.locator('.btn-group a:has-text("Getting Started")')).toBeVisible();
    await expect(page.locator('.btn-group a:has-text("Documentation")')).toBeVisible();

    // Wait for API response and check for main content sections
    await page.waitForTimeout(2000);

    // Check for chemical information section
    const chemicalInfoSection = page.locator('.card .card-header:has-text("Chemical Information")');
    await expect(chemicalInfoSection).toBeVisible();

    // Check for either successful data display or error handling
    const hasChemicalData = (await page.locator('.card-body:has-text("Aspirin")').count()) > 0;
    const hasErrorMessage = (await page.locator('.alert').count()) > 0;

    expect(hasChemicalData || hasErrorMessage).toBeTruthy();
  });

  test('should display chemical image or fallback message', async ({ page }) => {
    await page.goto('/api/pubchem');
    await page.waitForTimeout(2000);

    // Check for either chemical structure image or fallback message
    const hasImage = (await page.locator('img[alt*="Aspirin"]').count()) > 0;
    const hasFallback = (await page.locator('.alert-info:has-text("2D Structure image not available")').count()) > 0;

    expect(hasImage || hasFallback).toBeTruthy();
  });

  test('should display chemical properties and molecular data', async ({ page }) => {
    await page.goto('/api/pubchem');
    await page.waitForLoadState('networkidle');

    // Test Chemical and Physical Properties section
    const propertiesCard = page.locator('.card.text-white.bg-info');
    await expect(propertiesCard).toBeVisible();
    await expect(page.locator('.card-header h6', { hasText: 'Chemical and Physical Properties' })).toBeVisible();

    // Test molecular properties section
    const molecularPropsSection = page.locator('h6', { hasText: 'Molecular Properties' });
    if ((await molecularPropsSection.count()) > 0) {
      await expect(molecularPropsSection).toBeVisible();

      // Test for molecular formula if present
      const molecularFormula = page.locator('text=/Molecular Formula:/');
      if ((await molecularFormula.count()) > 0) {
        await expect(molecularFormula).toBeVisible();
      }

      // Test for molecular weight if present
      const molecularWeight = page.locator('text=/Molecular Weight:/');
      if ((await molecularWeight.count()) > 0) {
        await expect(molecularWeight).toBeVisible();
        // Check for g/mol in the molecular weight context specifically
        await expect(page.locator('li:has-text("Molecular Weight") >> text=/g\/mol/')).toBeVisible();
      }

      // Test for complexity if present
      const complexity = page.locator('text=/Complexity:/');
      if ((await complexity.count()) > 0) {
        await expect(complexity).toBeVisible();
      }

      // Test for heavy atom count if present
      const heavyAtomCount = page.locator('text=/Heavy Atom Count:/');
      if ((await heavyAtomCount.count()) > 0) {
        await expect(heavyAtomCount).toBeVisible();
      }
    }

    // Test physicochemical properties section
    const physicoPropsSection = page.locator('h6', { hasText: 'Physicochemical Properties' });
    if ((await physicoPropsSection.count()) > 0) {
      await expect(physicoPropsSection).toBeVisible();

      // Test for TPSA if present
      const tpsa = page.locator('text=/Topological Polar Surface Area:/');
      if ((await tpsa.count()) > 0) {
        await expect(tpsa).toBeVisible();
      }

      // Test for XLogP if present
      const xlogp = page.locator('text=/XLogP.*Partition Coefficient/');
      if ((await xlogp.count()) > 0) {
        await expect(xlogp).toBeVisible();
      }

      // Test for hydrogen bond donors/acceptors if present
      const hbondDonors = page.locator('text=/Hydrogen Bond Donors:/');
      if ((await hbondDonors.count()) > 0) {
        await expect(hbondDonors).toBeVisible();
      }

      const hbondAcceptors = page.locator('text=/Hydrogen Bond Acceptors:/');
      if ((await hbondAcceptors.count()) > 0) {
        await expect(hbondAcceptors).toBeVisible();
      }

      // Test for rotatable bonds if present
      const rotatableBonds = page.locator('text=/Rotatable Bonds:/');
      if ((await rotatableBonds.count()) > 0) {
        await expect(rotatableBonds).toBeVisible();
      }
    }
  });

  test('should display synonyms and alternative names', async ({ page }) => {
    await page.goto('/api/pubchem');
    await page.waitForLoadState('networkidle');

    // Test synonyms section
    const synonymsSection = page.locator('h5', { hasText: 'Synonyms and Alternative Names' });
    await expect(synonymsSection).toBeVisible();

    // Check if synonyms are available or if warning is shown
    const synonymBadges = page.locator('.badge.bg-secondary.text-white');
    const synonymsWarning = page.locator('.alert.alert-warning', { hasText: 'Synonyms data is not available' });

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

  test('should display safety and hazard information when available', async ({ page }) => {
    await page.goto('/api/pubchem');
    await page.waitForLoadState('networkidle');

    // Test safety information section if present
    const safetyCard = page.locator('.card.text-white.bg-warning');
    if ((await safetyCard.count()) > 0) {
      await expect(safetyCard).toBeVisible();
      await expect(page.locator('.card-header h6', { hasText: 'Safety and Hazard Information' })).toBeVisible();

      // Test for warning icons in safety information
      const warningIcons = page.locator('.fas.fa-exclamation-triangle.fa-sm.text-warning');
      if ((await warningIcons.count()) > 0) {
        await expect(warningIcons.first()).toBeVisible();
      }
    }
  });

  test('should display chemical classifications when available', async ({ page }) => {
    await page.goto('/api/pubchem');
    await page.waitForLoadState('networkidle');

    // Test classifications section if present
    const classificationsCard = page.locator('.card.text-white.bg-secondary');
    if ((await classificationsCard.count()) > 0) {
      await expect(classificationsCard).toBeVisible();
      await expect(page.locator('.card-header h6', { hasText: 'Chemical Classifications' })).toBeVisible();

      // Test for classification badges
      const classificationBadges = page.locator('.badge.badge-info');
      if ((await classificationBadges.count()) > 0) {
        await expect(classificationBadges.first()).toBeVisible();
      }
    }
  });

  test('should display additional information and usage section', async ({ page }) => {
    await page.goto('/api/pubchem');
    await page.waitForLoadState('networkidle');

    // Test additional information section
    const additionalInfoCard = page.locator('.card.text-white.bg-dark');
    await expect(additionalInfoCard).toBeVisible();
    await expect(page.locator('.card-header h6', { hasText: 'Additional Information & Usage' })).toBeVisible();

    // Test medical information section
    const medicalInfoSection = page.locator('h6', { hasText: 'Medical Information' });
    await expect(medicalInfoSection).toBeVisible();

    // Check for medical information content or fallback message
    const therapeuticUses = page.locator('text=/Therapeutic Uses:/');
    const pharmacology = page.locator('text=/Pharmacology:/');
    const medicalUses = page.locator('text=/Medical Uses:/');
    const noMedicalInfo = page.locator('text=/No specific medical information available/');
    const chemicalCompoundInfo = page.locator('text=/Chemical compound information available/');
    const limitedInfo = page.locator('text=/Limited information available/');

    const hasMedicalContent = (await therapeuticUses.count()) > 0 || (await pharmacology.count()) > 0 || (await medicalUses.count()) > 0 || (await noMedicalInfo.count()) > 0 || (await chemicalCompoundInfo.count()) > 0 || (await limitedInfo.count()) > 0;

    expect(hasMedicalContent).toBeTruthy();

    // Test manufacturing information section
    const manufacturingInfoSection = page.locator('h6', { hasText: 'Manufacturing Info' });
    await expect(manufacturingInfoSection).toBeVisible();

    // Check for manufacturing information or fallback message
    const manufacturingNotAvailable = page.locator('text=/Manufacturing information not available/');
    const manufacturingContent = page.locator('.col-md-6:has(h6:has-text("Manufacturing Info")) p');

    const hasManufacturingNotAvailable = (await manufacturingNotAvailable.count()) > 0;
    const hasManufacturingContent = (await manufacturingContent.count()) > 0;

    // Should have either manufacturing info or the "not available" message
    expect(hasManufacturingNotAvailable || hasManufacturingContent).toBeTruthy();
  });
});
