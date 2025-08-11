const fs = require('fs');
const path = require('path');

function generateHTMLReport() {
  const screenshotsDir = path.join(__dirname, 'screenshots');
  const reportPath = path.join(__dirname, 'demo-report.html');
  
  // Check if screenshots exist
  if (!fs.existsSync(screenshotsDir)) {
    console.log('No screenshots found. Run the demo first.');
    return;
  }
  
  const screenshots = fs.readdirSync(screenshotsDir)
    .filter(file => file.endsWith('.png'))
    .sort();
  
  const steps = [
    { title: 'Upload Payroll File', description: 'Upload sample payroll CSV file' },
    { title: 'Navigate to Reconcile', description: 'Move to reconciliation page' },
    { title: 'Run Reconciliation', description: 'Execute reconciliation process' },
    { title: 'Navigate to Review', description: 'Review reconciliation results' },
    { title: 'View Insights', description: 'Display AI-generated insights' },
    { title: 'Approve Reconciliation', description: 'Approve and create ACH transfer' },
    { title: 'Open AI Chat', description: 'Access AI assistant' },
    { title: 'Ask AI Question', description: 'Query AI about reconciliation data' },
    { title: 'Demo Complete', description: 'Full demo flow completed' }
  ];
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PayFast Demo Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .header {
            text-align: center;
            color: white;
            margin-bottom: 3rem;
        }
        
        .header h1 {
            font-size: 3rem;
            font-weight: 700;
            margin-bottom: 1rem;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .header p {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        
        .demo-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 2rem;
            margin-bottom: 3rem;
        }
        
        .step-card {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            transition: transform 0.3s ease;
        }
        
        .step-card:hover {
            transform: translateY(-5px);
        }
        
        .step-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1.5rem;
        }
        
        .step-number {
            display: inline-block;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            width: 30px;
            height: 30px;
            text-align: center;
            line-height: 30px;
            font-weight: bold;
            margin-right: 1rem;
        }
        
        .step-title {
            font-size: 1.3rem;
            font-weight: 600;
        }
        
        .step-description {
            margin-top: 0.5rem;
            opacity: 0.9;
            font-size: 0.9rem;
        }
        
        .step-image {
            width: 100%;
            height: 300px;
            object-fit: cover;
            border-bottom: 1px solid #eee;
        }
        
        .summary {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            text-align: center;
        }
        
        .summary h2 {
            color: #667eea;
            margin-bottom: 1rem;
            font-size: 2rem;
        }
        
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-top: 2rem;
        }
        
        .feature {
            padding: 1.5rem;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        
        .feature h3 {
            color: #667eea;
            margin-bottom: 0.5rem;
        }
        
        .timestamp {
            text-align: center;
            color: white;
            opacity: 0.8;
            margin-top: 2rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎬 PayFast Demo Report</h1>
            <p>Complete end-to-end reconciliation flow demonstration</p>
        </div>
        
        <div class="demo-grid">
            ${screenshots.map((screenshot, index) => {
              const step = steps[index] || { title: 'Step', description: 'Demo step' };
              return `
                <div class="step-card">
                    <div class="step-header">
                        <span class="step-number">${index + 1}</span>
                        <span class="step-title">${step.title}</span>
                        <div class="step-description">${step.description}</div>
                    </div>
                    <img src="screenshots/${screenshot}" alt="${step.title}" class="step-image">
                </div>
              `;
            }).join('')}
        </div>
        
        <div class="summary">
            <h2>✨ Demo Features Showcased</h2>
            <div class="features">
                <div class="feature">
                    <h3>📁 File Upload</h3>
                    <p>Drag & drop CSV payroll file upload with validation</p>
                </div>
                <div class="feature">
                    <h3>🔍 Reconciliation</h3>
                    <p>Automated payroll vs enrollment reconciliation</p>
                </div>
                <div class="feature">
                    <h3>🤖 AI Insights</h3>
                    <p>Auto-generated insights with risk assessment</p>
                </div>
                <div class="feature">
                    <h3>✅ Approval Flow</h3>
                    <p>Review and approve reconciliations with ACH generation</p>
                </div>
                <div class="feature">
                    <h3>💬 AI Chat</h3>
                    <p>Natural language queries about reconciliation data</p>
                </div>
                <div class="feature">
                    <h3>📊 Real-time Analytics</h3>
                    <p>Live dashboards and reporting capabilities</p>
                </div>
            </div>
        </div>
        
        <div class="timestamp">
            <p>Report generated on ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>`;
  
  fs.writeFileSync(reportPath, html);
  console.log(`✅ Demo report generated: ${reportPath}`);
  console.log(`📸 Screenshots captured: ${screenshots.length}`);
}

generateHTMLReport();
