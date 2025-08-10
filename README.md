# PayFast – Payroll Reconciliation MVP

A modern, beautiful payroll reconciliation system with drag-and-drop file uploads, real-time reconciliation, and ACH transfer approval workflows.

## 🚀 Quick Start (Local)

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)

### Start the Application
```bash
# Clone and start all services
git clone <your-repo>
cd payfast
docker compose up -d

# The application will be available at:
# Frontend: http://localhost:5173
# API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

## 🛠️ Makefile Commands

The project includes a comprehensive Makefile for easy development workflow:

```bash
# Show all available commands
make help

# Quick development setup (build, start, migrate, seed)
make dev

# Service management
make up          # Start all services
make down        # Stop all services
make restart     # Restart all services
make build       # Build all containers

# Logs and monitoring
make logs        # View all logs
make api-logs    # View API logs only
make web-logs    # View frontend logs only
make monitor     # System resource monitoring

# Database operations
make migrate     # Run database migrations
make seed        # Seed with sample data
make db-reset    # Reset database completely

# Testing
make test-upload     # Test payroll upload API
make test-reconcile  # Test reconciliation (usage: make test-reconcile batch_id=1)
make test-audit      # Test audit log API
make test-audit-summary # Test audit summary API

# Development utilities
make shell-api   # Access API container
make shell-web   # Access frontend container
make shell-db    # Access database
make health      # Check all services health
make status      # Show container status

# Code quality
make format      # Format code (Python + TypeScript)
make lint        # Lint code
make check       # Run all quality checks

# Complete workflow
make workflow    # Full development workflow with instructions
```

### Quick Development Workflow
```bash
# 1. Set up everything
make dev

# 2. Test the system
make test-upload
make test-reconcile batch_id=1
make test-audit

# 3. Monitor logs
make api-logs

# 4. Access containers for debugging
make shell-api
```

## ✨ Features

### 🎨 Beautiful Modern UI
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Dark/Light Theme**: Clean, professional interface with Tailwind CSS
- **Loading States**: Skeleton screens and spinners for better UX
- **Toast Notifications**: Success/error feedback with react-hot-toast

### 📤 Upload Page
- **Drag & Drop**: Intuitive file upload with visual feedback
- **CSV Validation**: Automatic file type checking
- **Upload History**: Last 5 batches with timestamps and status
- **Real-time Progress**: Upload status with progress indicators

### 🔍 Reconcile Page
- **Summary Cards**: Visual overview of OK/Mismatch/Missing items
- **Smart Filtering**: Filter by issue type and employee ID
- **Export to CSV**: Client-side export with proper formatting
- **Pagination**: Handle large datasets efficiently

### ✅ Review & Approve Page
- **Confirmation Modal**: Safe approval workflow with details
- **Transfer Details**: Show transfer ID, amount, and file reference
- **ACH File Preview**: View generated ACH files
- **Status Tracking**: Real-time transfer status updates

### 🏢 Multi-Tenant Support
- **Tenant Selector**: Dropdown to switch between organizations
- **Isolated Data**: Each tenant sees only their data
- **Persistent Selection**: Remembers your tenant choice

### 📊 Audit Log System
- **Complete Activity Tracking**: All system actions logged automatically
- **Advanced Filtering**: Filter by entity, action, actor, and time
- **Summary Statistics**: Visual overview of audit activity
- **Detail View**: View before/after states for changes
- **Compliance Ready**: Full audit trail for regulatory requirements

## 🏗️ Architecture

```
payfast/
├── app/                    # FastAPI Backend
│   ├── main.py            # API entry point
│   ├── models.py          # SQLAlchemy ORM models
│   ├── routers/           # API route handlers
│   ├── services/          # Business logic
│   ├── alembic/           # Database migrations
│   └── requirements.txt   # Python dependencies
├── web/                   # React Frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable UI components
│   │   └── lib/           # API client & utilities
│   ├── package.json       # Node.js dependencies
│   └── tailwind.config.js # Styling configuration
├── ops/                   # Infrastructure (Bicep)
├── .github/workflows/     # CI/CD pipelines
├── docker-compose.yml     # Local development
└── Makefile              # Development commands
```

## 🛠️ Technology Stack

### Backend
- **FastAPI**: Modern, fast web framework
- **SQLAlchemy 2.0**: Type-safe ORM with async support
- **Alembic**: Database migrations
- **PostgreSQL**: Production-ready database
- **Redis**: Caching and message queuing

### Frontend
- **React 18**: Latest React with hooks
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **React Router**: Client-side routing
- **React Dropzone**: File upload handling
- **Headless UI**: Accessible components
- **Heroicons**: Beautiful SVG icons

### DevOps
- **Docker**: Containerized development
- **GitHub Actions**: Automated CI/CD
- **Azure Bicep**: Infrastructure as Code
- **Make**: Development workflow automation

## 📊 Data Models

### Core Entities
- **PayrollBatch**: Uploaded payroll files
- **PayItem**: Individual payroll line items
- **Enrollment**: Employee benefit enrollments
- **ReconciliationRun**: Reconciliation execution
- **ReconciliationItem**: Individual discrepancies
- **AchTransfer**: Approved ACH transfers

### Key Relationships
```
PayrollBatch (1) → (N) PayItem
ReconciliationRun (1) → (N) ReconciliationItem
ReconciliationRun (1) → (1) AchTransfer
```

## 🔄 Workflow

1. **Upload**: Drag & drop CSV payroll file
2. **Process**: System parses and validates data
3. **Reconcile**: Compare payroll vs enrollments
4. **Review**: Identify discrepancies and issues
5. **Approve**: Generate ACH transfer files
6. **Export**: Download reconciliation reports

## 🎯 API Endpoints

### Payroll
- `POST /api/tenants/{tenant_id}/payroll/upload` - Upload CSV file
- `GET /api/tenants/{tenant_id}/payroll/batches` - List recent batches

### Reconciliation
- `POST /api/tenants/{tenant_id}/reconcile` - Run reconciliation
- `GET /api/tenants/{tenant_id}/reconcile/{run_id}/items` - Get items (with pagination)
- `POST /api/tenants/{tenant_id}/reconcile/{run_id}/approve` - Approve transfer

## 🧪 Testing

### Manual Testing
1. **Upload Test**: Use `sample/payroll.csv`
2. **Reconcile Test**: Run reconciliation on uploaded batch
3. **Approve Test**: Approve reconciliation and check ACH file

### API Testing
```bash
# Upload payroll
curl -X POST "http://localhost:8000/api/tenants/demo-tenant-1/payroll/upload" \
  -H "X-Tenant-ID: demo-tenant-1" \
  -F "file=@sample/payroll.csv"

# Run reconciliation
curl -X POST "http://localhost:8000/api/tenants/demo-tenant-1/reconcile?payroll_batch_id=1" \
  -H "X-Tenant-ID: demo-tenant-1"

# Get items
curl -X GET "http://localhost:8000/api/tenants/demo-tenant-1/reconcile/1/items" \
  -H "X-Tenant-ID: demo-tenant-1"
```

## 🚀 Deployment

### Local Development
```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f api
docker compose logs -f web

# Stop services
docker compose down
```

### Production
- **Frontend**: Deploy to Azure Static Web Apps
- **Backend**: Deploy to Azure App Service
- **Database**: Azure Database for PostgreSQL
- **Infrastructure**: Deploy with Bicep templates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Documentation**: Check this README and API docs
- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub Discussions for questions

---

**Built with ❤️ for modern payroll reconciliation**