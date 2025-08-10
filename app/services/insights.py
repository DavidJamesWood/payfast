# app/services/insights.py
import json
from collections import defaultdict
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from models_rich import ReconciliationItem, ReconciliationInsights, ReconciliationRun
from openai import OpenAI
import os

def compute_reconciliation_stats(db: Session, run_id: int, tenant_id: str) -> Dict:
    """Compute statistics for a reconciliation run"""
    
    # Get all items for this run
    items = db.query(ReconciliationItem).filter(
        ReconciliationItem.run_id == run_id
    ).all()
    
    if not items:
        return {
            "top_causes": {},
            "total_impact": 0.0,
            "affected_employees": 0
        }
    
    # Count by issue type
    issue_counts = defaultdict(int)
    total_impact = 0.0
    affected_employees = set()
    
    for item in items:
        issue_counts[item.issue_type] += 1
        if item.amount:
            total_impact += abs(item.amount)
        affected_employees.add(item.employee_ext_id)
    
    # Convert to sorted list for LLM
    top_causes = dict(sorted(issue_counts.items(), key=lambda x: x[1], reverse=True))
    
    return {
        "top_causes": top_causes,
        "total_impact": total_impact,
        "affected_employees": len(affected_employees)
    }

def generate_llm_insights(stats: Dict, run_summary: str) -> Dict:
    """Generate insights using LLM analysis"""
    
    client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    model = os.environ.get("LLM_MODEL", "gpt-4o-mini")
    
    # Create prompt for LLM analysis
    prompt = f"""
    Analyze this reconciliation run and provide actionable insights:
    
    STATISTICS:
    - Top causes: {json.dumps(stats['top_causes'], indent=2)}
    - Total dollar impact: ${stats['total_impact']:,.2f}
    - Affected employees: {stats['affected_employees']}
    - Run summary: {run_summary}
    
    Please provide:
    
    1. SUGGESTED FIXES (3-5 specific actions):
    - What batch fixes would address the most common issues?
    - Focus on systematic solutions, not individual cases
    
    2. PRIORITY ACTIONS (3 high-priority items):
    - What should be done immediately?
    - What has the highest business impact?
    
    3. RISK ASSESSMENT:
    - What's the overall risk level (Low/Medium/High/Critical)?
    - What are the main risks and their potential impact?
    
    Format your response as JSON with these keys:
    - suggested_fixes: array of strings
    - priority_actions: array of strings  
    - risk_assessment: string
    
    Be concise but specific. Focus on business impact and actionable steps.
    """
    
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3
        )
        
        # Parse LLM response
        content = response.choices[0].message.content.strip()
        
        # Try to extract JSON from response
        try:
            # Look for JSON in the response
            start_idx = content.find('{')
            end_idx = content.rfind('}') + 1
            if start_idx != -1 and end_idx != 0:
                json_str = content[start_idx:end_idx]
                insights = json.loads(json_str)
            else:
                # Fallback: parse as text
                insights = {
                    "suggested_fixes": [content],
                    "priority_actions": ["Review the reconciliation results manually"],
                    "risk_assessment": "Medium - Requires manual review"
                }
        except json.JSONDecodeError:
            # Fallback: parse as text
            insights = {
                "suggested_fixes": [content],
                "priority_actions": ["Review the reconciliation results manually"],
                "risk_assessment": "Medium - Requires manual review"
            }
        
        return insights
        
    except Exception as e:
        # Fallback if LLM fails
        return {
            "suggested_fixes": [
                "Review missing coverage issues",
                "Check percentage mismatches",
                "Verify employee enrollments"
            ],
            "priority_actions": [
                "Address missing coverage issues first",
                "Review high-dollar discrepancies",
                "Validate employee data"
            ],
            "risk_assessment": f"Medium - LLM analysis failed: {str(e)}"
        }

def create_reconciliation_insights(db: Session, run_id: int, tenant_id: str) -> ReconciliationInsights:
    """Create insights for a reconciliation run"""
    
    # Get the run
    run = db.query(ReconciliationRun).filter(
        ReconciliationRun.id == run_id,
        ReconciliationRun.tenant_id == tenant_id
    ).first()
    
    if not run:
        raise ValueError(f"Reconciliation run {run_id} not found")
    
    # Check if insights already exist
    existing_insights = db.query(ReconciliationInsights).filter(
        ReconciliationInsights.run_id == run_id
    ).first()
    
    if existing_insights:
        return existing_insights
    
    # Compute statistics
    stats = compute_reconciliation_stats(db, run_id, tenant_id)
    
    # Generate LLM insights
    llm_insights = generate_llm_insights(stats, run.summary or "{}")
    
    # Create insights record
    insights = ReconciliationInsights(
        run_id=run_id,
        tenant_id=tenant_id,
        top_causes=json.dumps(stats['top_causes']),
        total_impact=stats['total_impact'],
        affected_employees=stats['affected_employees'],
        suggested_fixes=json.dumps(llm_insights.get('suggested_fixes', [])),
        priority_actions=json.dumps(llm_insights.get('priority_actions', [])),
        risk_assessment=llm_insights.get('risk_assessment', 'Medium')
    )
    
    db.add(insights)
    db.commit()
    db.refresh(insights)
    
    return insights

def get_reconciliation_insights(db: Session, run_id: int, tenant_id: str) -> Optional[Dict]:
    """Get insights for a reconciliation run"""
    
    insights = db.query(ReconciliationInsights).filter(
        ReconciliationInsights.run_id == run_id,
        ReconciliationInsights.tenant_id == tenant_id
    ).first()
    
    if not insights:
        return None
    
    return {
        "id": insights.id,
        "run_id": insights.run_id,
        "top_causes": json.loads(insights.top_causes) if insights.top_causes else {},
        "total_impact": insights.total_impact,
        "affected_employees": insights.affected_employees,
        "suggested_fixes": json.loads(insights.suggested_fixes) if insights.suggested_fixes else [],
        "priority_actions": json.loads(insights.priority_actions) if insights.priority_actions else [],
        "risk_assessment": insights.risk_assessment,
        "created_at": insights.created_at.isoformat() if insights.created_at else None
    }
