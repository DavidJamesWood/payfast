import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('PayFast Demo Flow', () => {
  test('Complete end-to-end reconciliation demo', async ({ page }) => {
    // Navigate to demo mode
    await page.goto('/?demo=1');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Verify demo mode is active
    await expect(page.locator('text=🎬 DEMO MODE')).toBeVisible();
    
    // Step 1: Upload Payroll File
    await test.step('Upload Payroll File', async () => {
      // Download the sample file
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
      
      // Wait for approval to complete
      await expect(page.locator('text=Transfer #')).toBeVisible({ timeout: 15000 });
      
      // Take screenshot
      await page.screenshot({ path: 'demo/screenshots/06-approval-complete.png' });
    });
    
    // Step 7: Open AI Chat
    await test.step('Open AI Chat', async () => {
      // Click the AI Chat button
      await page.click('button:has-text("AI Chat")');
      
      // Wait for chat drawer to open
      await expect(page.locator('text=AI Assistant')).toBeVisible();
      
      // Take screenshot
      await page.screenshot({ path: 'demo/screenshots/07-chat-opened.png' });
    });
    
    // Step 8: Ask AI Question
    await test.step('Ask AI Question', async () => {
      // Type a question
      await page.fill('input[placeholder*="Ask"]', 'Show me the top mismatches from the most recent reconciliation run');
      
      // Send the message
      await page.press('input[placeholder*="Ask"]', 'Enter');
      
      // Wait for AI response
      await expect(page.locator('text=Thinking...')).toBeVisible();
      // Wait for "Thinking..." to disappear (indicating response is ready)
      await expect(page.locator('text=Thinking...')).not.toBeVisible({ timeout: 30000 });
      // Wait a moment for the response to render
      await page.waitForTimeout(2000);
      
      // Take screenshot
      await page.screenshot({ path: 'demo/screenshots/08-ai-response.png' });
    });
    
    // Step 9: Final Demo Summary
    await test.step('Final Demo Summary', async () => {
      // Wait a moment for everything to settle
      await page.waitForTimeout(2000);
      
      // Take final screenshot
      await page.screenshot({ path: 'demo/screenshots/09-demo-complete.png', fullPage: true });
    });
  });
});
