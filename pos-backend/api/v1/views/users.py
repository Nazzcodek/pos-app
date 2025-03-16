from models.user import User, TokenBlacklist
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from typing import List, Dict, Any, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from models.engine.database import get_db
from models.schemas.user import UserCreate, UserResponse, UserUpdate, LoginRequest
from services.permission import role_required, has_permission, can_assign_role, can_modify_user
from jose import JWTError
from services.sessionManager import SessionManager
from services.auth import(
    get_current_user,
    create_access_token,
    create_refresh_token,
    authenticate_user,
    verify_refresh_token,
    delete,
    credentials_exception,
    oauth2_scheme,
    )

router = APIRouter(tags=['Users'])


def validate_user_existence(db: Session, username: str, email: str):
    """Check if a user with the given username or email already exists."""
    existing_user = db.query(User).filter(
        (User.username == username) | (User.email == email)
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already exists"
        )
    
# @router.post("/create", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
# async def create_user(
#     user: UserCreate,
#     db: Session = Depends(get_db),
#     current_user: Optional[User] = Depends(get_current_user)
# ):
#     # Check if there are no users in the database
#     user_count = db.query(User).count()
    
#     if user_count == 0:
#         # First user creation - must be admin
#         if user.role != 'admin':
#             raise HTTPException(
#                 status_code=status.HTTP_403_FORBIDDEN,
#                 detail="The first user must be an admin"
#             )
#     else:
#         # After first user, enforce authentication
#         if not current_user:
#             raise HTTPException(
#                 status_code=status.HTTP_401_UNAUTHORIZED,
#                 detail="Authentication required to create a new user"
#             )
        
#         # Check if the current user has permission to create users
#         if not has_permission(current_user.role, 'users', 'create'):
#             raise HTTPException(
#                 status_code=status.HTTP_403_FORBIDDEN,
#                 detail="You do not have permission to create users"
#             )
    
#     # email username validation
#     validate_user_existence(db, user.username, user.email)

#     # Enforce role existence
#     if user.role not in ['admin', 'manager', 'supervisor', 'cashier']:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Invalid role"
#         )

#     # Enforce role creation rules
#     if current_user and current_user.role == 'admin':
#         # Admin can create admin, manager, supervisor, and cashier
#         if user.role not in ['admin', 'manager', 'supervisor', 'cashier']:
#             raise HTTPException(
#                 status_code=status.HTTP_403_FORBIDDEN,
#                 detail="Admin can only create admin, manager, supervisor, or cashier"
#             )
#     elif current_user and current_user.role == 'manager':
#         # Manager can create supervisor and cashier, but not manager or admin
#         if user.role not in ['supervisor', 'cashier']:
#             raise HTTPException(
#                 status_code=status.HTTP_403_FORBIDDEN,
#                 detail="Manager can only create supervisor or cashier"
#             )

#     # hash password
#     password = User.hash_password(user.password)
#     # Create the user
#     db_user = User(
#         first_name=user.first_name,
#         last_name=user.last_name,
#         username=user.username,
#         email=user.email,
#         password=password,
#         role=user.role
#     )
#     db.add(db_user)
#     db.commit()
#     db.refresh(db_user)
    
#     return UserResponse(
#             id=str(db_user.id),
#             first_name=db_user.first_name,
#             last_name=db_user.last_name,
#             username=db_user.username,
#             email=db_user.email,
#             role=db_user.role,
#             is_active=db_user.is_active,
#             is_enabled=db_user.is_enabled
#         )


@router.post("/create", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to create a new user"
        )
    
    # Check if the current user has permission to create users
    if not has_permission(current_user.role, 'users', 'create'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to create users"
        )
    
    # email username validation
    validate_user_existence(db, user.username, user.email)

    # Enforce role existence
    if user.role not in ['admin', 'manager', 'supervisor', 'cashier']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role"
        )

    # Enforce role creation rules
    if current_user.role == 'admin':
        # Admin can create admin, manager, supervisor, and cashier
        if user.role not in ['admin', 'manager', 'supervisor', 'cashier']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin can only create admin, manager, supervisor, or cashier"
            )
    elif current_user.role == 'manager':
        # Manager can create supervisor and cashier, but not manager or admin
        if user.role not in ['supervisor', 'cashier']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Manager can only create supervisor or cashier"
            )
    # hash password
    password = User.hash_password(user.password)
    # Create the user
    db_user = User(
        first_name=user.first_name,
        last_name=user.last_name,
        username=user.username,
        email=user.email,
        password=password,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return UserResponse(
        id=str(db_user.id),
        first_name=db_user.first_name,
        last_name=db_user.last_name,
        username=db_user.username,
        email=db_user.email,
        role=db_user.role,
        is_active=db_user.is_active,
        is_enabled=db_user.is_enabled
    )


@router.post("/login", response_model=Dict[str, Any])
async def login(
    login_request: LoginRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    user = authenticate_user(db, login_request.username, login_request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled",
            headers={"WWW-Authenticate": "Bearer"},
        )

    session_manager = SessionManager(db)
    # Get existing session or create new one
    session = session_manager.get_or_create_session(user.id)
    
    # Update user active status
    user.is_active = True
    db.commit()
    
    # All devices share the same session ID
    access_token = create_access_token(data={
        "sub": user.username,
        "session_id": str(session.id)
    })
    refresh_token = create_refresh_token(data={
        "sub": user.username,
        "session_id": str(session.id)
    })

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        )
    
    return {"message": "Login successful"}


@router.post("/logout", response_model=Dict[str, str])
@role_required(['cashier'], 'tokens', 'delete')
async def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Logs out the currently authenticated user by:
    - Terminating their session.
    - Blacklisting the access token.
    - Clearing the access_token and refresh_token cookies.
    """
    session_manager = SessionManager(db)

    try:
        session_manager.terminate_session(current_user.id)

        # Blacklist the access token (if you have a TokenBlacklist model)
        access_token = request.cookies.get("access_token")
        if access_token:
            # Assuming you have a TokenBlacklist model and a way to add tokens to it
            token_blacklist = TokenBlacklist(token=access_token)
            db.add(token_blacklist)
            db.commit()

        # Clear the cookies by setting them with empty values and expiring them immediately
        response.delete_cookie(key="access_token")
        response.delete_cookie(key="refresh_token")

        # Update the User's is_active status
        current_user.is_active = False
        db.commit()

        return {"message": "Logout successful"}

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Logout failed: {str(e)}")

@router.post("/refresh-token", response_model=Dict[str, Any])
@role_required(['cashier'], 'token', 'create')
async def refresh_token(
    response: Response,
    refresh_token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
    ):
    try:
        # Verify the refresh token
        payload = verify_refresh_token(refresh_token)
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
            
        # Check if user exists
        user = db.query(User).filter(User.username == username).first()
        if user is None:
            raise credentials_exception
            
        # Create new access token
        access_token = create_access_token(data={"sub": user.username})

        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=True
        )
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True
        )

        return {"message": "Access token refreshed"}
        
    except JWTError:
        raise credentials_exception


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user)
):
    return current_user


@router.get("/all", response_model=List[UserResponse])
@role_required(['manager'], 'users', 'read')
async def get_all_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    users = db.query(User).all()
    return users


@router.get("/{user_id}", response_model=UserResponse)
@role_required(['cashier'], 'users', 'read')
async def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_id = UUID(user_id)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.put("/update/{user_id}", response_model=UserResponse)
@role_required(['manager'], 'users', 'update')
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_id = UUID(user_id)
    # Check if the user exists
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if current user has permission to modify the target user based on role hierarchy
    if not can_modify_user(current_user.role, db_user.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Users with role '{current_user.role}' cannot modify users with role '{db_user.role}'"
        )
    
    # If role is being updated, enforce role modification rules
    if user_update.role and user_update.role != db_user.role:
        # Validate the new role
        if user_update.role not in ['admin', 'manager', 'supervisor', 'cashier']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role"
            )
        
        # Check if current user has permission to assign the new role
        if not can_assign_role(current_user.role, user_update.role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Users with role '{current_user.role}' cannot assign '{user_update.role}' role"
            )
    
    # validate if new email and username doesn't already exist
    if db_user.username != user_update.username or db_user.email != user_update.email:
        validate_user_existence(db, user_update.username, user_update.email)
    
    if user_update.first_name:
        db_user.first_name = user_update.first_name
    if user_update.last_name:
        db_user.last_name = user_update.last_name
    if user_update.username:
        db_user.username = user_update.username
    if user_update.email:
        db_user.email = user_update.email
    if user_update.role:
        db_user.role = user_update.role
    if user_update.password:
        db_user.password = User.hash_password(user_update.password)
    
    db.commit()
    db.refresh(db_user)
    
    return UserResponse(
        id=str(db_user.id),
        first_name=db_user.first_name,
        last_name=db_user.last_name,
        username=db_user.username,
        email=db_user.email,
        role=db_user.role,
        is_active=db_user.is_active,
        is_enabled=db_user.is_enabled
    )


@router.delete("delete/{user_id}", status_code=status.HTTP_200_OK)
@role_required(['admin'], 'users', 'delete')
async def delete_record_endpoint(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_id = UUID(user_id)
    """Delete endpoint that can be used for any model."""
    result = delete(
        db=db,
        model=User,
        record_id=user_id,
        current_user=current_user,
        resource_name="users"
    )
    return {"message": "User deleted successfully"}


@router.put("/toggle-status/{user_id}")
@role_required(['supervisor'], 'toggles', 'action')
async def toggle_model_status(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
    ):
    """Endpoint to toggle is_enabled for a given model by ID"""
    user_id = UUID(user_id)
    instance = db.query(User).filter(User.id == user_id).first()

    if not instance:
        raise HTTPException(status_code=404, detail="User not found")

    new_status = instance.toggle_enabled(db)
    return {"message": "Toggled successfully", "is_enabled": new_status}