import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('PayFast Simple Demo Flow', () => {
  test('Core reconciliation demo', async ({ page }) => {
    // Navigate to demo mode
    await page.goto('/?demo=1');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Verify demo mode is active
    await expect(page.locator('text=🎬 DEMO MODE')).toBeVisible();
    
    // Step 1: Upload Payroll File
    await test.step('Upload Payroll File', async () => {
      const sampleFile = path.join(__dirname, '../sample/payroll.csv');
      
      // Wait for the upload area to be ready
      await page.waitForSelector('input[type="file"]', { timeout: 10000 });
      
      // Upload the file
      await page.setInputFiles('input[type="file"]', sampleFile);
      
      // Wait for upload to complete
      await expect(page.locator('text=Successfully uploaded')).toBeVisible({ timeout: 30000 });
      
      // Wait a moment for the UI to update
      await page.waitForTimeout(2000);
      
      // Take screenshot
      await page.screenshot({ path: 'demo/screenshots/01-upload-complete.png' });
    });
    
    // Step 2: Navigate to Reconcile
    await test.step('Navigate to Reconcile', async () => {
      await page.click('text=Reconcile');
      await page.waitForLoadState('networkidle');
      
      // Wait for the reconcile page to load
      await expect(page.locator('text=Reconcile Payroll')).toBeVisible();
      
      // Take screenshot
      await page.screenshot({ path: 'demo/screenshots/02-reconcile-page.png' });
    });
    
    // Step 3: Run Reconciliation
    await test.step('Run Reconciliation', async () => {
      // Wait for the reconcile button to be available
      await page.waitForSelector('button:has-text("Run Reconciliation")', { timeout: 10000 });
      
      // Click the reconcile button for the first batch
      await page.locator('button:has-text("Run Reconciliation")').first().click();
      
      // Wait for reconciliation to complete
      await expect(page.locator('text=Reconciliation completed!')).toBeVisible({ timeout: 30000 });
      
      // Wait a moment for the UI to update
      await page.waitForTimeout(2000);
      
      // Take screenshot
      await page.screenshot({ path: 'demo/screenshots/03-reconciliation-complete.png' });
    });
    
    // Step 4: Navigate to Review
    await test.step('Navigate to Review', async () => {
      await page.click('text=Review');
      await page.waitForLoadState('networkidle');
      
      // Wait for the review page to load
      await expect(page.locator('text=Review & Approve')).toBeVisible();
      
      // Take screenshot
      await page.screenshot({ path: 'demo/screenshots/04-review-page.png' });
    });
    
    // Step 5: View Insights
    await test.step('View Insights', async () => {
      // Click the Insights button for the first run
      await page.locator('button:has-text("Insights")').first().click();
      
      // Wait for insights to load
      await expect(page.locator('text=Auto-Reconciliation Insights')).toBeVisible({ timeout: 10000 });
      
      // Take screenshot
      await page.screenshot({ path: 'demo/screenshots/05-insights-view.png' });
    });
    
    // Step 6: Approve Reconciliation
    await test.step('Approve Reconciliation', async () => {
      // Click the Approve button
      await page.locator('button:has-text("Approve")').first().click();
      
      // Wait for confirmation modal
      await expect(page.locator('text=Confirm Approval')).toBeVisible();
      
      // Confirm approval
      await page.click('button:has-text("Approve Transfer")');
      
      // Wait for approval to complete - look for the most recent transfer
      await expect(page.locator('span:has-text("Transfer #")').first()).toBeVisible({ timeout: 15000 });
      
      // Take screenshot
      await page.screenshot({ path: 'demo/screenshots/06-approval-complete.png' });
    });
    
    // Step 7: Final Demo Summary
    await test.step('Final Demo Summary', async () => {
      // Wait a moment for everything to settle
      await page.waitForTimeout(2000);
      
      // Take final screenshot
      await page.screenshot({ path: 'demo/screenshots/07-demo-complete.png', fullPage: true });
    });
  });
});
