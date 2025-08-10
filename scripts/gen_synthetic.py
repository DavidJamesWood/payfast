#!/usr/bin/env python3
"""
Synthetic Data Generator for PayFast
Generates realistic test data for the PayFast payroll reconciliation system.
"""

import sys
import os
from datetime import date, datetime, timedelta
from typing import List, Dict, Any
import random
import json

# Add the app directory to the path so we can import models
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'app'))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from models_rich import Base, Employee, Dependent, Plan, Enrollment, PayrollBatch, PayItem, ReconciliationRun, ReconciliationItem, AchTransfer, AuditLog, EventLog, Tenant, SystemConfig

# Configuration
TENANT_IDS = ["demo-tenant-1", "demo-tenant-2", "demo-tenant-3"]
EMPLOYEE_COUNT_PER_TENANT = 50
DEPENDENT_COUNT_PER_EMPLOYEE = 2
PLAN_COUNT_PER_TENANT = 8
ENROLLMENT_COUNT_PER_EMPLOYEE = 3
PAYROLL_BATCH_COUNT_PER_TENANT = 5
PAY_ITEM_COUNT_PER_BATCH = 200

# Database connection
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://app:app@localhost:5432/app")

class SyntheticDataGenerator:
    def __init__(self):
        self.engine = create_engine(DATABASE_URL)
        self.Session = sessionmaker(bind=self.engine)
        self.session = self.Session()
        
        # Faker for realistic data
        try:
            from faker import Faker
            self.fake = Faker()
        except ImportError:
            print("Warning: Faker not available, using basic data generation")
            self.fake = None
    
    def generate_tenants(self) -> List[Tenant]:
        """Generate tenant records"""
        tenants = []
        for tenant_id in TENANT_IDS:
            tenant = Tenant(
                id=tenant_id,
                name=f"Demo Company {tenant_id.split('-')[-1]}",
                display_name=f"Demo Company {tenant_id.split('-')[-1]}",
                is_active=True,
                settings=json.dumps({
                    "timezone": "America/New_York",
                    "currency": "USD",
                    "fiscal_year_start": "01-01"
                })
            )
            tenants.append(tenant)
            self.session.add(tenant)
        
        self.session.commit()
        print(f"✅ Generated {len(tenants)} tenants")
        return tenants
    
    def generate_employees(self) -> List[Employee]:
        """Generate employee records"""
        employees = []
        for tenant_id in TENANT_IDS:
            for i in range(EMPLOYEE_COUNT_PER_TENANT):
                hire_date = self.fake.date_between(start_date='-5y', end_date='-1y') if self.fake else date(2020, 1, 1) + timedelta(days=random.randint(0, 1000))
                
                employee = Employee(
                    tenant_id=tenant_id,
                    employee_ext_id=f"EMP{tenant_id.split('-')[-1]}{i+1:03d}",
                    first_name=self.fake.first_name() if self.fake else f"Employee{i+1}",
                    last_name=self.fake.last_name() if self.fake else f"Smith{i+1}",
                    email=self.fake.email() if self.fake else f"employee{i+1}@company.com",
                    phone=self.fake.phone_number() if self.fake else f"555-{i+1:03d}-{random.randint(1000, 9999)}",
                    hire_date=hire_date,
                    termination_date=None if random.random() > 0.1 else hire_date + timedelta(days=random.randint(100, 1000)),
                    is_active=random.random() > 0.1
                )
                employees.append(employee)
                self.session.add(employee)
        
        self.session.commit()
        print(f"✅ Generated {len(employees)} employees")
        return employees
    
    def generate_dependents(self, employees: List[Employee]) -> List[Dependent]:
        """Generate dependent records"""
        dependents = []
        for employee in employees:
            if not employee.is_active:
                continue
                
            for i in range(random.randint(0, DEPENDENT_COUNT_PER_EMPLOYEE)):
                relationship = random.choice(["spouse", "child", "child", "child"])  # More children than spouses
                if relationship == "spouse":
                    # Spouse should be older
                    dob = employee.hire_date - timedelta(days=random.randint(7000, 15000))
                else:
                    # Child should be younger
                    dob = employee.hire_date + timedelta(days=random.randint(100, 5000))
                
                dependent = Dependent(
                    tenant_id=employee.tenant_id,
                    employee_id=employee.id,
                    dependent_ext_id=f"{employee.employee_ext_id}_DEP{i+1}",
                    first_name=self.fake.first_name() if self.fake else f"Dependent{i+1}",
                    last_name=employee.last_name,
                    relationship=relationship,
                    date_of_birth=dob,
                    is_active=True
                )
                dependents.append(dependent)
                self.session.add(dependent)
        
        self.session.commit()
        print(f"✅ Generated {len(dependents)} dependents")
        return dependents
    
    def generate_plans(self) -> List[Plan]:
        """Generate benefit plan records"""
        plans = []
        plan_types = ["medical", "dental", "vision", "life", "disability", "fsa", "hsa", "401k"]
        carriers = ["Blue Cross Blue Shield", "Aetna", "UnitedHealth", "Cigna", "Kaiser", "Humana"]
        
        for tenant_id in TENANT_IDS:
            for i, plan_type in enumerate(plan_types):
                plan = Plan(
                    tenant_id=tenant_id,
                    plan_code=f"{plan_type.upper()}_{tenant_id.split('-')[-1]}",
                    plan_name=f"{plan_type.title()} Plan {tenant_id.split('-')[-1]}",
                    plan_type=plan_type,
                    carrier=random.choice(carriers),
                    is_active=True
                )
                plans.append(plan)
                self.session.add(plan)
        
        self.session.commit()
        print(f"✅ Generated {len(plans)} plans")
        return plans
    
    def generate_enrollments(self, employees: List[Employee], plans: List[Plan], dependents: List[Dependent]) -> List[Enrollment]:
        """Generate enrollment records"""
        enrollments = []
        
        # Group dependents by employee
        dependents_by_employee = {}
        for dep in dependents:
            if dep.employee_id not in dependents_by_employee:
                dependents_by_employee[dep.employee_id] = []
            dependents_by_employee[dep.employee_id].append(dep)
        
        # Group plans by tenant
        plans_by_tenant = {}
        for plan in plans:
            if plan.tenant_id not in plans_by_tenant:
                plans_by_tenant[plan.tenant_id] = []
            plans_by_tenant[plan.tenant_id].append(plan)
        
        for employee in employees:
            if not employee.is_active:
                continue
            
            tenant_plans = plans_by_tenant.get(employee.tenant_id, [])
            employee_dependents = dependents_by_employee.get(employee.id, [])
            
            # Create enrollments for this employee
            for i in range(random.randint(1, ENROLLMENT_COUNT_PER_EMPLOYEE)):
                if i >= len(tenant_plans):
                    break
                    
                plan = tenant_plans[i]
                effective_from = employee.hire_date + timedelta(days=random.randint(0, 30))
                
                # Determine coverage level
                if employee_dependents:
                    coverage_level = random.choice(["employee", "employee+spouse", "family"])
                else:
                    coverage_level = "employee"
                
                # Select dependent if applicable
                dependent_id = None
                if coverage_level in ["employee+spouse", "family"] and employee_dependents:
                    spouse_deps = [d for d in employee_dependents if d.relationship == "spouse"]
                    if spouse_deps:
                        dependent_id = random.choice(spouse_deps).id
                
                enrollment = Enrollment(
                    tenant_id=employee.tenant_id,
                    employee_id=employee.id,
                    plan_id=plan.id,
                    dependent_id=dependent_id,
                    effective_from=effective_from,
                    effective_to=None if random.random() > 0.1 else effective_from + timedelta(days=random.randint(100, 1000)),
                    contribution_pct=random.uniform(0.0, 0.15),
                    contribution_amount=random.uniform(0.0, 500.0),
                    coverage_level=coverage_level,
                    is_active=True
                )
                enrollments.append(enrollment)
                self.session.add(enrollment)
        
        self.session.commit()
        print(f"✅ Generated {len(enrollments)} enrollments")
        return enrollments
    
    def generate_payroll_batches(self) -> List[PayrollBatch]:
        """Generate payroll batch records"""
        batches = []
        
        for tenant_id in TENANT_IDS:
            for i in range(PAYROLL_BATCH_COUNT_PER_TENANT):
                # Generate payroll periods (bi-weekly)
                start_date = date(2024, 1, 1) + timedelta(weeks=i*2)
                end_date = start_date + timedelta(days=13)
                
                batch = PayrollBatch(
                    tenant_id=tenant_id,
                    period_start=start_date,
                    period_end=end_date,
                    source=f"payroll_export_{i+1}.csv",
                    uploaded_by="demo-user",
                    status=random.choice(["uploaded", "processed", "reconciled", "approved"])
                )
                batches.append(batch)
                self.session.add(batch)
        
        self.session.commit()
        print(f"✅ Generated {len(batches)} payroll batches")
        return batches
    
    def generate_pay_items(self, batches: List[PayrollBatch], employees: List[Employee]) -> List[PayItem]:
        """Generate pay item records"""
        pay_items = []
        
        # Group employees by tenant
        employees_by_tenant = {}
        for emp in employees:
            if emp.tenant_id not in employees_by_tenant:
                employees_by_tenant[emp.tenant_id] = []
            employees_by_tenant[emp.tenant_id].append(emp)
        
        for batch in batches:
            tenant_employees = employees_by_tenant.get(batch.tenant_id, [])
            
            for i in range(PAY_ITEM_COUNT_PER_BATCH):
                employee = random.choice(tenant_employees) if tenant_employees else None
                
                # Generate realistic pay codes
                pay_codes = ["MED_PRETAX", "DENTAL_PRETAX", "VISION_PRETAX", "FSA_PRETAX", "HSA_PRETAX", "401K_PRETAX", "LIFE_PRETAX"]
                code = random.choice(pay_codes)
                
                # Generate realistic amounts based on code
                amount_ranges = {
                    "MED_PRETAX": (50.0, 300.0),
                    "DENTAL_PRETAX": (20.0, 100.0),
                    "VISION_PRETAX": (10.0, 50.0),
                    "FSA_PRETAX": (50.0, 200.0),
                    "HSA_PRETAX": (100.0, 500.0),
                    "401K_PRETAX": (100.0, 1000.0),
                    "LIFE_PRETAX": (5.0, 50.0)
                }
                
                min_amount, max_amount = amount_ranges.get(code, (10.0, 100.0))
                amount = random.uniform(min_amount, max_amount)
                
                pay_item = PayItem(
                    tenant_id=batch.tenant_id,
                    payroll_batch_id=batch.id,
                    employee_id=employee.id if employee else None,
                    employee_ext_id=employee.employee_ext_id if employee else f"UNKNOWN_{i}",
                    code=code,
                    amount=amount,
                    contribution_pct=random.uniform(0.0, 0.15),
                    period_start=batch.period_start,
                    period_end=batch.period_end,
                    memo=f"Payroll deduction for {code}"
                )
                pay_items.append(pay_item)
                self.session.add(pay_item)
        
        self.session.commit()
        print(f"✅ Generated {len(pay_items)} pay items")
        return pay_items
    
    def generate_reconciliation_runs(self, batches: List[PayrollBatch]) -> List[ReconciliationRun]:
        """Generate reconciliation run records"""
        runs = []
        
        for batch in batches:
            if batch.status in ["processed", "reconciled", "approved"]:
                run = ReconciliationRun(
                    tenant_id=batch.tenant_id,
                    payroll_batch_id=batch.id,
                    created_by="demo-user",
                    status="completed",
                    summary=json.dumps({
                        "total_items": random.randint(100, 500),
                        "ok_items": random.randint(80, 450),
                        "mismatch_items": random.randint(5, 50),
                        "missing_items": random.randint(1, 20),
                        "extra_items": random.randint(1, 10)
                    })
                )
                runs.append(run)
                self.session.add(run)
        
        self.session.commit()
        print(f"✅ Generated {len(runs)} reconciliation runs")
        return runs
    
    def generate_reconciliation_items(self, runs: List[ReconciliationRun], employees: List[Employee]) -> List[ReconciliationItem]:
        """Generate reconciliation item records"""
        items = []
        
        # Group employees by tenant
        employees_by_tenant = {}
        for emp in employees:
            if emp.tenant_id not in employees_by_tenant:
                employees_by_tenant[emp.tenant_id] = []
            employees_by_tenant[emp.tenant_id].append(emp)
        
        for run in runs:
            tenant_employees = employees_by_tenant.get(run.tenant_id, [])
            
            # Generate items for this run
            for i in range(random.randint(10, 50)):
                employee = random.choice(tenant_employees) if tenant_employees else None
                issue_type = random.choice(["ok", "mismatch_pct", "missing_coverage", "extra_deduction"])
                
                item = ReconciliationItem(
                    run_id=run.id,
                    employee_ext_id=employee.employee_ext_id if employee else f"UNKNOWN_{i}",
                    issue_type=issue_type,
                    expected_pct=random.uniform(0.0, 0.15) if issue_type in ["mismatch_pct", "missing_coverage"] else None,
                    actual_pct=random.uniform(0.0, 0.15) if issue_type == "mismatch_pct" else None,
                    amount=random.uniform(10.0, 500.0) if issue_type in ["missing_coverage", "extra_deduction"] else None,
                    details=f"Reconciliation issue: {issue_type} for employee {employee.employee_ext_id if employee else 'unknown'}"
                )
                items.append(item)
                self.session.add(item)
        
        self.session.commit()
        print(f"✅ Generated {len(items)} reconciliation items")
        return items
    
    def generate_ach_transfers(self, runs: List[ReconciliationRun]) -> List[AchTransfer]:
        """Generate ACH transfer records"""
        transfers = []
        
        for run in runs:
            # Only create transfers for completed reconciliations
            if run.status == "completed":
                transfer = AchTransfer(
                    tenant_id=run.tenant_id,
                    run_id=run.id,
                    amount=random.uniform(1000.0, 50000.0),
                    file_ref=f"ach_transfer_{run.id}_{run.tenant_id}.ach",
                    status=random.choice(["submitted", "processed", "completed"])
                )
                transfers.append(transfer)
                self.session.add(transfer)
        
        self.session.commit()
        print(f"✅ Generated {len(transfers)} ACH transfers")
        return transfers
    
    def generate_audit_logs(self, employees: List[Employee], batches: List[PayrollBatch], runs: List[ReconciliationRun]) -> List[AuditLog]:
        """Generate audit log records"""
        logs = []
        
        # Generate audit logs for various activities
        for employee in employees[:10]:  # Limit to first 10 employees for demo
            log = AuditLog(
                tenant_id=employee.tenant_id,
                actor="demo-user",
                action="create",
                entity="employee",
                entity_id=employee.id,
                before=None,
                after=json.dumps({
                    "employee_ext_id": employee.employee_ext_id,
                    "first_name": employee.first_name,
                    "last_name": employee.last_name
                })
            )
            logs.append(log)
            self.session.add(log)
        
        for batch in batches[:5]:  # Limit to first 5 batches
            log = AuditLog(
                tenant_id=batch.tenant_id,
                actor="demo-user",
                action="upload",
                entity="payroll_batch",
                entity_id=batch.id,
                before=None,
                after=json.dumps({
                    "source": batch.source,
                    "period_start": batch.period_start.isoformat(),
                    "period_end": batch.period_end.isoformat()
                })
            )
            logs.append(log)
            self.session.add(log)
        
        self.session.commit()
        print(f"✅ Generated {len(logs)} audit logs")
        return logs
    
    def generate_event_logs(self) -> List[EventLog]:
        """Generate event log records"""
        logs = []
        
        event_types = ["payroll_uploaded", "reconciliation_started", "reconciliation_completed", "ach_transfer_created", "user_login"]
        event_sources = ["api", "web", "system"]
        severities = ["info", "warning", "error"]
        
        for i in range(100):  # Generate 100 event logs
            log = EventLog(
                tenant_id=random.choice(TENANT_IDS),
                event_type=random.choice(event_types),
                event_source=random.choice(event_sources),
                severity=random.choice(severities),
                payload=json.dumps({
                    "user_id": "demo-user",
                    "timestamp": datetime.now().isoformat(),
                    "details": f"Event {i+1} details"
                }),
                message=f"Event {i+1}: {random.choice(event_types)} occurred"
            )
            logs.append(log)
            self.session.add(log)
        
        self.session.commit()
        print(f"✅ Generated {len(logs)} event logs")
        return logs
    
    def generate_system_configs(self) -> List[SystemConfig]:
        """Generate system configuration records"""
        configs = []
        
        config_data = [
            ("max_file_size_mb", "10", "number", "Maximum file upload size in MB"),
            ("allowed_file_types", "csv,xlsx", "string", "Allowed file types for upload"),
            ("reconciliation_timeout_minutes", "30", "number", "Timeout for reconciliation jobs"),
            ("audit_retention_days", "365", "number", "Days to retain audit logs"),
            ("default_tenant_timezone", "America/New_York", "string", "Default timezone for new tenants"),
            ("enable_email_notifications", "true", "boolean", "Enable email notifications"),
            ("max_concurrent_reconciliations", "5", "number", "Maximum concurrent reconciliation jobs")
        ]
        
        for key, value, config_type, description in config_data:
            config = SystemConfig(
                config_key=key,
                config_value=value,
                config_type=config_type,
                description=description,
                is_active=True
            )
            configs.append(config)
            self.session.add(config)
        
        self.session.commit()
        print(f"✅ Generated {len(configs)} system configs")
        return configs
    
    def generate_all(self):
        """Generate all synthetic data"""
        print("🚀 Starting synthetic data generation...")
        
        try:
            # Generate data in dependency order
            tenants = self.generate_tenants()
            employees = self.generate_employees()
            dependents = self.generate_dependents(employees)
            plans = self.generate_plans()
            enrollments = self.generate_enrollments(employees, plans, dependents)
            batches = self.generate_payroll_batches()
            pay_items = self.generate_pay_items(batches, employees)
            runs = self.generate_reconciliation_runs(batches)
            reconciliation_items = self.generate_reconciliation_items(runs, employees)
            ach_transfers = self.generate_ach_transfers(runs)
            audit_logs = self.generate_audit_logs(employees, batches, runs)
            event_logs = self.generate_event_logs()
            system_configs = self.generate_system_configs()
            
            print("\n🎉 Synthetic data generation completed successfully!")
            print(f"📊 Generated data summary:")
            print(f"   - Tenants: {len(tenants)}")
            print(f"   - Employees: {len(employees)}")
            print(f"   - Dependents: {len(dependents)}")
            print(f"   - Plans: {len(plans)}")
            print(f"   - Enrollments: {len(enrollments)}")
            print(f"   - Payroll Batches: {len(batches)}")
            print(f"   - Pay Items: {len(pay_items)}")
            print(f"   - Reconciliation Runs: {len(runs)}")
            print(f"   - Reconciliation Items: {len(reconciliation_items)}")
            print(f"   - ACH Transfers: {len(ach_transfers)}")
            print(f"   - Audit Logs: {len(audit_logs)}")
            print(f"   - Event Logs: {len(event_logs)}")
            print(f"   - System Configs: {len(system_configs)}")
            
        except Exception as e:
            print(f"❌ Error generating synthetic data: {e}")
            self.session.rollback()
            raise
        finally:
            self.session.close()

def main():
    """Main function"""
    print("PayFast Synthetic Data Generator")
    print("=" * 40)
    
    generator = SyntheticDataGenerator()
    generator.generate_all()

if __name__ == "__main__":
    main()
