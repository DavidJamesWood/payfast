const puppeteer = require('puppeteer');

async function testDemo() {
  console.log('🧪 Testing PayFast Demo Setup...');
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Navigate to demo mode
    await page.goto('http://localhost:5173/?demo=1');
    await page.waitForTimeout(2000);
    
    // Check if demo mode is active
    const demoText = await page.$eval('body', el => el.textContent);
    
    if (demoText.includes('DEMO MODE')) {
      console.log('✅ Demo mode detected successfully!');
    } else {
      console.log('❌ Demo mode not detected');
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'demo/test-screenshot.png' });
    console.log('📸 Test screenshot saved');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testDemo();
