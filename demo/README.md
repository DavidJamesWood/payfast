# 🎬 PayFast Demo System

A beautiful, reproducible demo system that showcases the complete PayFast payroll reconciliation flow with automated video recording and HTML reports.

## ✨ Features

- **🎯 One-Command Demo**: Run `make demo` to execute the complete flow
- **📹 Video Recording**: Automatic HD video capture of the entire demo
- **📸 Screenshots**: Step-by-step screenshots for documentation
- **📊 HTML Reports**: Beautiful, shareable HTML reports with screenshots
- **🤖 AI Integration**: Demonstrates AI-powered insights and chat
- **🎨 Professional UI**: Demo mode with visual indicators and sample data

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js (for Playwright)
- The PayFast application running

### Run the Demo

```bash
# From the project root
make demo
```

This will:
1. Start the PayFast application
2. Run the automated demo flow
3. Generate screenshots and video
4. Create a beautiful HTML report
5. Open the report in your browser

## 📁 Demo Structure

```
demo/
├── playwright.config.ts      # Playwright configuration
├── payfast-demo.spec.ts      # Main demo automation script
├── run-demo.sh              # Demo orchestration script
├── generate-report.js       # HTML report generator
├── package.json             # Demo dependencies
├── screenshots/             # Generated screenshots
├── reports/                 # Playwright reports
└── README.md               # This file
```

## 🎯 Demo Flow

The automated demo covers the complete PayFast workflow:

1. **📁 Upload Payroll File** - Upload sample CSV with drag & drop
2. **🔍 Navigate to Reconcile** - Move to reconciliation page
3. **⚡ Run Reconciliation** - Execute automated reconciliation
4. **📋 Navigate to Review** - Review reconciliation results
5. **🤖 View Insights** - Display AI-generated insights
6. **✅ Approve Reconciliation** - Approve and create ACH transfer
7. **💬 Open AI Chat** - Access AI assistant
8. **❓ Ask AI Question** - Query AI about reconciliation data
9. **🎉 Demo Complete** - Full flow demonstration

## 🎨 Demo Mode Features

### Frontend Enhancements

- **Demo Ribbon**: Purple gradient ribbon at the top
- **Sample File Link**: Direct download of sample payroll CSV
- **Demo Notices**: Helpful guidance throughout the flow
- **Visual Indicators**: Clear demo mode styling

### Backend Support

- **Demo Headers**: Accept `X-Demo: true` for demo requests
- **Sample Data**: Pre-seeded with realistic test data
- **Health Endpoints**: `/health` and `/healthz` for monitoring

## 🛠️ Manual Demo

### Start Demo Mode

Visit the application with the demo parameter:
```
http://localhost:5173/?demo=1
```

### Demo Mode Indicators

- Purple "🎬 DEMO MODE" ribbon at the top
- Sample file download link on upload page
- Demo notices and guidance throughout

## 📊 Generated Output

After running the demo, you'll get:

### Screenshots
- `demo/screenshots/01-upload-complete.png`
- `demo/screenshots/02-reconcile-page.png`
- `demo/screenshots/03-reconciliation-complete.png`
- `demo/screenshots/04-review-page.png`
- `demo/screenshots/05-insights-view.png`
- `demo/screenshots/06-approval-complete.png`
- `demo/screenshots/07-chat-opened.png`
- `demo/screenshots/08-ai-response.png`
- `demo/screenshots/09-demo-complete.png`

### Reports
- `demo/demo-report.html` - Beautiful HTML report
- `demo/reports/` - Playwright detailed reports

### Video
- `demo/test-results/` - HD video recording (if enabled)

## 🔧 Configuration

### Playwright Configuration

The demo uses Playwright with the following settings:

- **Browser**: Chromium (headless by default)
- **Viewport**: 1280x720 HD
- **Video**: On first retry
- **Screenshots**: On failure
- **Timeout**: 30 seconds for operations

### Customization

Edit `payfast-demo.spec.ts` to modify the demo flow:

```typescript
// Add custom steps
await test.step('Custom Step', async () => {
  // Your custom demo logic
  await page.screenshot({ path: 'demo/screenshots/custom-step.png' });
});
```

## 🎬 Demo Commands

```bash
# Run the complete demo
make demo

# Run demo with video recording
cd demo && npm run demo:video

# Run demo in headed mode (see browser)
cd demo && npm run demo

# Generate HTML report only
cd demo && node generate-report.js

# View Playwright report
cd demo && npm run report

# Clean up demo files
cd demo && npm run clean
```

## 📈 Demo Metrics

The demo showcases:

- **File Upload**: Drag & drop CSV processing
- **Reconciliation**: Automated payroll vs enrollment matching
- **AI Insights**: Auto-generated risk assessment and recommendations
- **Approval Flow**: Review and approve with ACH generation
- **AI Chat**: Natural language queries about data
- **Real-time Analytics**: Live dashboards and reporting

## 🎯 Use Cases

### Sales Demos
- Show prospects the complete workflow
- Demonstrate AI capabilities
- Highlight automation benefits

### Training
- Onboard new team members
- Show best practices
- Document processes

### Documentation
- Create visual guides
- Generate marketing materials
- Support documentation

## 🚀 Production Deployment

For production demos:

1. **Environment Variables**:
   ```bash
   VITE_DEMO=1  # Enable demo mode
   ```

2. **Sample Data**: Ensure sample payroll CSV is available
3. **AI Configuration**: Configure OpenAI API key for insights
4. **Monitoring**: Use health endpoints for uptime monitoring

## 🎉 Success!

The PayFast demo system provides a professional, reproducible way to showcase the application's capabilities. The automated flow, beautiful reports, and comprehensive documentation make it perfect for sales, training, and marketing purposes.

---

**🎬 Ready to demo? Run `make demo` and watch the magic happen!**
