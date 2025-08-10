import json
import functools
import inspect
from typing import Optional, Any, Dict
from fastapi import Request, Depends
from sqlalchemy.orm import Session
from db import get_db
from models import AuditLog

def audit_log(
    action: str,
    entity: str,
    get_entity_id: Optional[str] = None,  # Function name to extract entity_id from response
    get_before_state: Optional[str] = None,  # Function name to get before state
    get_after_state: Optional[str] = None,   # Function name to get after state
):
    """
    Decorator to log audit events for mutating operations.
    
    Args:
        action: The action being performed (create, update, delete)
        entity: The entity type being affected (payroll_batch, reconciliation_run, etc.)
        get_entity_id: Function name to extract entity_id from response
        get_before_state: Function name to get before state
        get_after_state: Function name to get after state
    """
    def decorator(func):
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Get dependencies
            db = None
            tenant_id = None
            actor = "demo-user"  # Default actor
            
            # Extract dependencies from function signature
            for arg in args:
                if isinstance(arg, Session):
                    db = arg
            
            # Extract from kwargs
            if 'db' in kwargs:
                db = kwargs['db']
            if 'tenant_id' in kwargs:
                tenant_id = kwargs['tenant_id']
            if 'x_tenant_id' in kwargs:
                tenant_id = kwargs['x_tenant_id']
            
            # Execute the original function
            result = await func(*args, **kwargs)
            
            # Extract entity_id from result
            entity_id = None
            if isinstance(result, dict):
                # Try common entity_id fields
                for field in ['id', 'batch_id', 'run_id', 'transfer_id']:
                    if field in result:
                        entity_id = result[field]
                        break
            
            # Create audit log entry
            if db and tenant_id and entity_id:
                audit_entry = AuditLog(
                    tenant_id=tenant_id,
                    actor=actor,
                    action=action,
                    entity=entity,
                    entity_id=entity_id,
                    before=None,
                    after=None
                )
                db.add(audit_entry)
                db.commit()
            
            return result
        
        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            # Get dependencies
            db = None
            tenant_id = None
            actor = "demo-user"  # Default actor
            
            # Extract dependencies from function signature
            for arg in args:
                if isinstance(arg, Session):
                    db = arg
            
            # Extract from kwargs
            if 'db' in kwargs:
                db = kwargs['db']
            if 'tenant_id' in kwargs:
                tenant_id = kwargs['tenant_id']
            if 'x_tenant_id' in kwargs:
                tenant_id = kwargs['x_tenant_id']
            
            # Execute the original function
            result = func(*args, **kwargs)
            
            # Extract entity_id from result
            entity_id = None
            if isinstance(result, dict):
                # Try common entity_id fields
                for field in ['id', 'batch_id', 'run_id', 'transfer_id']:
                    if field in result:
                        entity_id = result[field]
                        break
            
            # Create audit log entry
            if db and tenant_id and entity_id:
                audit_entry = AuditLog(
                    tenant_id=tenant_id,
                    actor=actor,
                    action=action,
                    entity=entity,
                    entity_id=entity_id,
                    before=None,
                    after=None
                )
                db.add(audit_entry)
                db.commit()
            
            return result
        
        # Return the appropriate wrapper based on whether the function is async
        if inspect.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    return decorator
