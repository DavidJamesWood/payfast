# app/scripts_seed_enroll.py
import os
from datetime import date
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from models import Enrollment

e = create_engine(os.environ["DATABASE_URL"], future=True)
rows = [
    {"employee_ext_id":"E-1001","plan_code":"MED","contribution_pct":0.03,"effective_date":date(2025,1,1)},
    {"employee_ext_id":"E-1002","plan_code":"MED","contribution_pct":0.03,"effective_date":date(2025,6,1)},
    {"employee_ext_id":"E-1003","plan_code":"MED","contribution_pct":0.04,"effective_date":date(2025,1,1)},
]
with e.begin() as conn:
    with Session(bind=conn) as s:
        for r in rows:
            s.add(Enrollment(tenant_id="demo-tenant-1", **r))
        s.commit()
print("Seeded enrollments.")
