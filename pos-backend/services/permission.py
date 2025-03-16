from functools import wraps
from fastapi import HTTPException, status, Depends
from .auth import get_current_user
from typing import List

# Role hierarchy
ROLE_HIERARCHY = {
    'admin': ['manager', 'supervisor', 'cashier'],
    'manager': ['supervisor', 'cashier'],
    'supervisor': ['cashier'],
    'cashier': [],
}


# Base permissions for each role
BASE_PERMISSIONS = {
    'admin': {
        'users': ['delete'],
        'products': ['delete'],
        'inventories': ['delete'],
        'categories': ['delete'],
        'sales': ['delete', 'update'],
        'suppliers': ['delete'],
        'sessions': ['delete'],
        'exports': ['delete'],
        'toggles': ['delete'],
        'settings': ['delete'],
        'invoices': ['delete']
        
    },
    'manager': {
        'users': ['create', 'update'],
        'categories': ['create', 'update'],
        'products': ['update', 'create', 'update'],
        'suppliers': ['create', 'update', 'enable', 'disbale'],
        'suppliers': ['update'],
        'inventories': ['update'],
        'invoices': ['update']
    
    },
    'supervisor': {
        'products': ['enable', 'disable'],
        'categories': ['enable', 'disable'],
        'inventories': ['create', 'enable', 'disable'],
        'suppliers': ['read'],
        'sessions': ['terminate'],
        'exports': ['create'],
        'toggles': ['action'],
        'settings': ['update'],
        'suppliers': ['read', 'create', 'update'],
        'inventories': ['read', 'create', 'update'],
        'invoices': ['read', 'create', 'update']
        
    },
    'cashier': {
        'users': ['read'],
        'products': ['read'],
        'categories': ['read'],
        'sales': ['create', 'read'],
        'sessions': ['read'],
        'tokens': ['create', 'delete'],
        'settings': ['read'],
    },
}

def build_full_permissions(role: str, visited=None) -> dict:
    """
    Build full permission set for a role, ensuring proper inheritance.
    """
    if visited is None:
        visited = set()
    
    # Prevent infinite recursion
    if role in visited:
        return {}
    
    visited.add(role)
    
    full_permissions = {}

    # Add the base permissions for the current role
    if role in BASE_PERMISSIONS:
        full_permissions.update(BASE_PERMISSIONS[role])

    # Recursively add inherited permissions
    for inherited_role in ROLE_HIERARCHY.get(role, []):
        inherited_permissions = build_full_permissions(inherited_role, visited)
        for resource, actions in inherited_permissions.items():
            if resource in full_permissions:
                full_permissions[resource] = list(set(full_permissions[resource] + actions))
            else:
                full_permissions[resource] = actions

    return full_permissions

# Recompute FULL_PERMISSIONS
FULL_PERMISSIONS = {
    role: build_full_permissions(role) for role in ROLE_HIERARCHY
    }


def role_required(allowed_roles: List[str], resource: str, action: str):
    """
    Decorator to enforce role-based access control and base permissions.
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get the current user from the request context
            current_user = kwargs.get('current_user')
            # print("CURRENT_USER:", current_user)
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Not authenticated"
                )

            current_role = current_user.role

            if not has_access(current_role, allowed_roles):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to access this endpoint"
                )

            if not has_permission(current_role, resource, action):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to perform this action"
                )

            return await func(*args, **kwargs)

        # This is the key change - we need to properly declare the dependency
        wrapper.__dependencies__ = [Depends(get_current_user)]
        return wrapper

    return decorator

def has_access(current_role: str, allowed_roles: list) -> bool:
    """
    Check if the current role has access based on the allowed roles.
    Higher roles can access endpoints of roles below them in the hierarchy.
    """
    # Get all accessible roles (current role + subordinates)
    accessible_roles = [current_role] + ROLE_HIERARCHY.get(current_role, [])
    
    # Check if any of the allowed roles are in the accessible roles
    return any(role in accessible_roles for role in allowed_roles)

# import json
# print("FULL_PERMISSIONS:", json.dumps(FULL_PERMISSIONS, indent=2))

def has_permission(current_role: str, resource: str, action: str) -> bool:
    """
    Check if the current user has permission to perform an action on a resource.
    """
    if current_role not in FULL_PERMISSIONS:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid role")
    
    # Check if the resource exists in the user's permissions
    if resource not in FULL_PERMISSIONS[current_role]:
        return False
    
    # Check if the action is allowed for the resource
    return action in FULL_PERMISSIONS[current_role][resource]

def can_modify_user(current_role: str, target_role: str) -> bool:
    """
    Check if a user with current_role can modify a user with target_role.
    This implements a strict hierarchical check where users can only modify users
    at their level or below in the hierarchy.
    """
    if current_role == 'admin':
        # Admin can modify any user
        return True
    
    if current_role == 'manager':
        # Manager can modify manager (self), supervisor, and cashier
        return target_role in ['manager', 'supervisor', 'cashier']
    
    # if current_role == 'supervisor':
    #     # Supervisor can modify supervisor (self) and cashier
    #     return target_role in ['supervisor', 'cashier']
    
    # if current_role == 'cashier':
    #     # Cashier can only modify themselves
    #     return target_role == 'cashier'
    
    return False

def can_assign_role(current_role: str, new_role: str) -> bool:
    """
    Check if a user with current_role can assign the new_role to another user.
    This implements strict role assignment rules where users can only assign roles
    at their level or below in the hierarchy.
    """
    if current_role == 'admin':
        # Admin can assign any role
        return True
    
    if current_role == 'manager':
        # Manager can only assign supervisor and cashier roles
        return new_role in ['supervisor', 'cashier']
    
    # Other roles cannot assign roles
    return False