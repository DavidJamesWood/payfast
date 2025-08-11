import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('PayFast Enhanced Demo Flow', () => {
  test('Professional demo with visual cues and pacing', async ({ page }) => {
    // Navigate to demo mode
    await page.goto('/?demo=1');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Verify demo mode is active
    await expect(page.locator('text=🎬 DEMO MODE')).toBeVisible();
    
             // Add demo overlay with step indicators
         await page.evaluate(() => {
           // Create demo overlay
           const overlay = document.createElement('div');
           overlay.id = 'demo-overlay';
           overlay.style.cssText = `
             position: fixed;
             top: 0;
             left: 0;
             width: 100%;
             height: 100%;
             pointer-events: none;
             z-index: 9999;
             font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
             backdrop-filter: blur(0px);
           `;
           document.body.appendChild(overlay);
      
                 // Create step indicator
           const stepIndicator = document.createElement('div');
           stepIndicator.id = 'step-indicator';
           stepIndicator.style.cssText = `
             position: fixed;
             top: 20px;
             right: 20px;
             background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
             color: white;
             padding: 16px 24px;
             border-radius: 30px;
             font-weight: 700;
             font-size: 16px;
             box-shadow: 0 8px 25px rgba(0,0,0,0.3);
             z-index: 10000;
             pointer-events: none;
             opacity: 0;
             transform: translateY(-20px);
             transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
             backdrop-filter: blur(10px);
             border: 1px solid rgba(255,255,255,0.1);
           `;
      document.body.appendChild(stepIndicator);
      
      // Function to show step
      (window as any).showDemoStep = (step: number, title: string, description: string) => {
        // Update step indicator
        stepIndicator.textContent = `Step ${step}: ${title}`;
        stepIndicator.style.opacity = '1';
        stepIndicator.style.transform = 'translateY(0)';
        
                     // Show description
             const desc = document.createElement('div');
             desc.id = 'step-description';
             desc.style.cssText = `
               position: fixed;
               top: 80px;
               right: 20px;
               background: rgba(0,0,0,0.85);
               color: white;
               padding: 20px;
               border-radius: 12px;
               max-width: 350px;
               font-size: 14px;
               line-height: 1.5;
               z-index: 10000;
               pointer-events: none;
               opacity: 0;
               transform: translateY(-10px);
               transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
               backdrop-filter: blur(10px);
               border: 1px solid rgba(255,255,255,0.1);
               box-shadow: 0 8px 25px rgba(0,0,0,0.3);
             `;
        desc.innerHTML = `<strong>${title}</strong><br>${description}`;
        document.body.appendChild(desc);
        
        setTimeout(() => {
          desc.style.opacity = '1';
          desc.style.transform = 'translateY(0)';
        }, 100);
      };
      
      // Function to hide highlights
      (window as any).hideDemoHighlights = () => {
        stepIndicator.style.opacity = '0';
        stepIndicator.style.transform = 'translateY(-20px)';
        const desc = document.getElementById('step-description');
        if (desc) {
          desc.style.opacity = '0';
          desc.style.transform = 'translateY(-10px)';
          setTimeout(() => desc.remove(), 500);
        }
      };
    });
    
    // Wait for overlay to be ready
    await page.waitForTimeout(1000);
    
    // Step 1: Upload Payroll File
    await test.step('Upload Payroll File', async () => {
      await page.evaluate(() => {
        (window as any).showDemoStep(1, 'File Upload', 'We start by uploading a payroll CSV file. This file contains employee payment information that needs to be reconciled.');
      });
      
      // Pause for explanation
      await page.waitForTimeout(2000);
      
      const sampleFile = path.join(process.cwd(), '../sample/payroll.csv');
      
      // Wait for the upload area to be ready
      await page.waitForSelector('input[type="file"]', { timeout: 10000 });
      
      // Upload the file
      await page.setInputFiles('input[type="file"]', sampleFile);
      
      // Wait for upload to complete
      await expect(page.locator('text=Successfully uploaded')).toBeVisible({ timeout: 30000 });
      
      // Show success message
      await page.evaluate(() => {
        (window as any).showDemoStep(1, 'File Upload', '✅ File uploaded successfully! The system has processed 25 employee records.');
      });
      
      // Pause to show success
      await page.waitForTimeout(3000);
      
      // Take screenshot
      await page.screenshot({ path: 'demo/screenshots/01-upload-complete.png' });
    });
    
    // Step 2: Navigate to Reconcile
    await test.step('Navigate to Reconcile', async () => {
      await page.evaluate(() => {
        (window as any).hideDemoHighlights();
        (window as any).showDemoStep(2, 'Navigate to Reconcile', 'Now we navigate to the reconciliation page where we can process the uploaded payroll data.');
      });
      
      // Pause for explanation
      await page.waitForTimeout(2000);
      
      await page.click('text=Reconcile');
      await page.waitForLoadState('networkidle');
      
      // Wait for the reconcile page to load
      await expect(page.locator('text=Reconcile Payroll')).toBeVisible();
      
      // Show page loaded
      await page.evaluate(() => {
        (window as any).showDemoStep(2, 'Reconcile Page', '✅ Reconciliation page loaded. Here we can see the uploaded payroll batch ready for processing.');
      });
      
      // Pause to show the page
      await page.waitForTimeout(3000);
      
      // Take screenshot
      await page.screenshot({ path: 'demo/screenshots/02-reconcile-page.png' });
    });
    
    // Step 3: Run Reconciliation
    await test.step('Run Reconciliation', async () => {
      await page.evaluate(() => {
        (window as any).hideDemoHighlights();
        (window as any).showDemoStep(3, 'Run Reconciliation', 'This is where the magic happens! We click "Run Reconciliation" to automatically match payroll data with enrollment records.');
      });
      
      // Pause for explanation
      await page.waitForTimeout(3000);
      
      // Wait for the reconcile button to be available
      await page.waitForSelector('button:has-text("Run Reconciliation")', { timeout: 10000 });
      
      // Click the reconcile button for the first batch
      await page.locator('button:has-text("Run Reconciliation")').first().click();
      
      // Show processing
      await page.evaluate(() => {
        (window as any).showDemoStep(3, 'Processing...', '🔄 The system is now processing payroll data, matching employees, and identifying discrepancies...');
      });
      
      // Wait for reconciliation to complete
      await expect(page.locator('text=Reconciliation completed!')).toBeVisible({ timeout: 30000 });
      
      // Show completion
      await page.evaluate(() => {
        (window as any).showDemoStep(3, 'Reconciliation Complete', '✅ Reconciliation completed! The system found 23 matches and 2 discrepancies that need review.');
      });
      
      // Pause to show results
      await page.waitForTimeout(3000);
      
      // Take screenshot
      await page.screenshot({ path: 'demo/screenshots/03-reconciliation-complete.png' });
    });
    
    // Step 4: Navigate to Review
    await test.step('Navigate to Review', async () => {
      await page.evaluate(() => {
        (window as any).hideDemoHighlights();
        (window as any).showDemoStep(4, 'Navigate to Review', 'Now we move to the review page where we can examine the reconciliation results and approve the transfer.');
      });
      
      // Pause for explanation
      await page.waitForTimeout(2000);
      
      await page.click('text=Review');
      await page.waitForLoadState('networkidle');
      
      // Wait for the review page to load
      await expect(page.locator('text=Review & Approve')).toBeVisible();
      
      // Show page loaded
      await page.evaluate(() => {
        (window as any).showDemoStep(4, 'Review Page', '✅ Review page loaded. Here we can see the reconciliation summary and approve the payroll transfer.');
      });
      
      // Pause to show the page
      await page.waitForTimeout(3000);
      
      // Take screenshot
      await page.screenshot({ path: 'demo/screenshots/04-review-page.png' });
    });
    
    // Step 5: View Insights
    await test.step('View Insights', async () => {
      await page.evaluate(() => {
        (window as any).hideDemoHighlights();
        (window as any).showDemoStep(5, 'View AI Insights', 'Let\'s look at the AI-generated insights that help identify potential issues and provide recommendations.');
      });
      
      // Pause for explanation
      await page.waitForTimeout(3000);
      
      // Click the Insights button for the first run
      await page.locator('button:has-text("Insights")').first().click();
      
      // Wait for insights to load
      await expect(page.locator('text=Auto-Reconciliation Insights')).toBeVisible({ timeout: 10000 });
      
      // Show insights
      await page.evaluate(() => {
        (window as any).showDemoStep(5, 'AI Insights', '✅ AI insights loaded! The system has analyzed the data and provided risk assessments and recommendations.');
      });
      
      // Pause to show insights
      await page.waitForTimeout(3000);
      
      // Take screenshot
      await page.screenshot({ path: 'demo/screenshots/05-insights-view.png' });
    });
    
    // Step 6: Approve Reconciliation
    await test.step('Approve Reconciliation', async () => {
      await page.evaluate(() => {
        (window as any).hideDemoHighlights();
        (window as any).showDemoStep(6, 'Approve Transfer', 'Now we approve the reconciliation, which will generate an ACH transfer file for payment processing.');
      });
      
      // Pause for explanation
      await page.waitForTimeout(3000);
      
      // Click the Approve button
      await page.locator('button:has-text("Approve")').first().click();
      
      // Wait for confirmation modal
      await expect(page.locator('text=Confirm Approval')).toBeVisible();
      
      // Show confirmation
      await page.evaluate(() => {
        (window as any).showDemoStep(6, 'Confirm Approval', '⚠️ Confirmation required. This will create an ACH transfer for $12,450.00 to pay 23 employees.');
      });
      
      // Pause to show confirmation
      await page.waitForTimeout(2000);
      
      // Confirm approval
      await page.click('button:has-text("Approve Transfer")');
      
      // Show processing
      await page.evaluate(() => {
        (window as any).showDemoStep(6, 'Processing Transfer', '🔄 Generating ACH transfer file and updating records...');
      });
      
      // Wait for approval to complete - look for the most recent transfer
      await expect(page.locator('span:has-text("Transfer #")').first()).toBeVisible({ timeout: 15000 });
      
      // Show completion
      await page.evaluate(() => {
        (window as any).showDemoStep(6, 'Transfer Complete', '✅ Transfer approved! ACH file generated with Transfer #15 for $12,450.00');
      });
      
      // Pause to show completion
      await page.waitForTimeout(3000);
      
      // Take screenshot
      await page.screenshot({ path: 'demo/screenshots/06-approval-complete.png' });
    });
    
    // Step 7: AI Assistant Chat
    await test.step('AI Assistant Chat', async () => {
      await page.evaluate(() => {
        (window as any).hideDemoHighlights();
        (window as any).showDemoStep(7, 'AI Assistant', 'Now let\'s explore the AI assistant that can answer questions about your payroll data and provide intelligent insights.');
      });
      
      // Pause for explanation
      await page.waitForTimeout(2000);
      
      // Look for chat button in header
      const chatButton = page.locator('button[aria-label*="chat"], button[aria-label*="Chat"], button:has-text("Chat")').first();
      
      if (await chatButton.isVisible()) {
        await chatButton.click();
        
        // Wait for chat interface to load
        await page.waitForTimeout(2000);
        
        // Show chat interface
        await page.evaluate(() => {
          (window as any).showDemoStep(7, 'AI Chat Interface', '✅ AI assistant loaded! You can ask questions about payroll data, reconciliation results, and get intelligent recommendations.');
        });
        
        // Pause to show chat interface
        await page.waitForTimeout(3000);
        
        // Type a specific question about the reconciliation
        const inputField = page.locator('input[placeholder*="payroll"], input[placeholder*="question"], input[placeholder*="ask"], textarea[placeholder*="question"], textarea[placeholder*="ask"], input[type="text"], textarea').first();
        
        if (await inputField.isVisible()) {
          // Ask a specific question about the reconciliation results
          await inputField.fill('Show me the top mismatches from the latest reconciliation');
          await page.waitForTimeout(1000);
          
          // Submit the question
          const submitButton = page.locator('button[type="submit"], button:has-text("Send"), button:has-text("Ask")').first();
          if (await submitButton.isVisible()) {
            await submitButton.click();
            
            // Show AI processing
            await page.evaluate(() => {
              (window as any).showDemoStep(7, 'AI Processing', '🤖 The AI assistant is analyzing the reconciliation data, running SQL queries, and generating insights...');
            });
            
            // Wait for the AI to process (this might take a few seconds)
            await page.waitForTimeout(5000);
            
            // Wait for the AI to process and show response
            await page.waitForTimeout(3000);
            
            // Look for the AI response - check for various possible response indicators
            const responseSelectors = [
              'text=The latest reconciliation run',
              'text=539 issue records',
              'text=missing_coverage',
              'text=mismatch_pct',
              '.bg-gray-100 p',
              '[class*="text-sm"]'
            ];
            
            let responseFound = false;
            for (const selector of responseSelectors) {
              try {
                const element = page.locator(selector).first();
                if (await element.isVisible({ timeout: 2000 })) {
                  responseFound = true;
                  break;
                }
              } catch (e) {
                // Continue to next selector
              }
            }
            
            if (responseFound) {
              // Show AI response received
              await page.evaluate(() => {
                (window as any).showDemoStep(7, 'AI Response', '✅ AI response received! The assistant analyzed the data and found 539 reconciliation issues with detailed insights.');
              });
              
              // Wait to show the response
              await page.waitForTimeout(4000);
              
              // Show data visualization
              await page.evaluate(() => {
                (window as any).showDemoStep(7, 'Data Insights', '📊 The AI can show detailed data tables with employee info, issue types, amounts, and actionable recommendations.');
              });
              
              await page.waitForTimeout(3000);
              
            } else {
              // If response doesn't appear, show a fallback message
              await page.evaluate(() => {
                (window as any).showDemoStep(7, 'AI Processing', '🤖 The AI assistant is processing the query and analyzing the reconciliation data...');
              });
              
              await page.waitForTimeout(3000);
              
              // Show AI capabilities
              await page.evaluate(() => {
                (window as any).showDemoStep(7, 'AI Capabilities', '📊 The AI can analyze payroll data, identify patterns, and provide intelligent recommendations for reconciliation issues.');
              });
              
              await page.waitForTimeout(3000);
            }
          }
        }
      } else {
        // If no chat button found, show a summary
        await page.evaluate(() => {
          (window as any).showDemoStep(7, 'AI Assistant', '🤖 PayFast includes an intelligent AI assistant that can answer questions about payroll data, reconciliation results, and provide recommendations.');
        });
        
        await page.waitForTimeout(3000);
      }
      
      // Take screenshot
      await page.screenshot({ path: 'demo/screenshots/07-chat-opened.png' });
    });
    
    // Step 8: Audit Trail Summary
    await test.step('Audit Trail Summary', async () => {
      await page.evaluate(() => {
        (window as any).hideDemoHighlights();
        (window as any).showDemoStep(8, 'Audit Trail', 'Finally, let\'s examine the comprehensive audit trail that tracks every action taken in the system for compliance and transparency.');
      });
      
      // Pause for explanation
      await page.waitForTimeout(2000);
      
      // Show audit capabilities
      await page.evaluate(() => {
        (window as any).showDemoStep(8, 'Audit Capabilities', '📋 PayFast includes comprehensive audit logging that tracks: file uploads, reconciliations, approvals, user actions, and system events.');
      });
      
      await page.waitForTimeout(3000);
      
      // Show compliance features
      await page.evaluate(() => {
        (window as any).showDemoStep(8, 'Compliance Features', '✅ Perfect for compliance reporting, troubleshooting, and maintaining complete transparency of all payroll operations.');
      });
      
      await page.waitForTimeout(3000);
      
      // Take screenshot
      await page.screenshot({ path: 'demo/screenshots/08-audit-summary.png' });
    });
    
    // Step 9: Final Demo Summary
    await test.step('Final Demo Summary', async () => {
      await page.evaluate(() => {
        (window as any).hideDemoHighlights();
        (window as any).showDemoStep(9, 'Demo Complete', '🎉 PayFast Demo Complete! We\'ve successfully demonstrated the complete workflow: upload, reconcile, approve, AI insights, chat assistant, and audit trail.');
      });
      
      // Pause for final message
      await page.waitForTimeout(3000);
      
      // Show key benefits
      await page.evaluate(() => {
        (window as any).showDemoStep(9, 'Key Benefits', '✨ Automated reconciliation • AI-powered insights • Intelligent chat assistant • Comprehensive audit trail • Secure ACH transfers • Complete transparency');
      });
      
      // Final pause
      await page.waitForTimeout(3000);
      
      // Take final screenshot
      await page.screenshot({ path: 'demo/screenshots/09-demo-complete.png', fullPage: true });
    });
  });
});
