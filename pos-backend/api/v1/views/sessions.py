from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from models.engine.database import get_db
from services.auth import get_current_user
from models.user import User, UserSession
from models.schemas.userSession import UserSessionStatus
from services.permission import role_required
from services.sessionManager import SessionManager
from uuid import UUID
from typing import List
from utils.time_utils import current_time
import pytz


router = APIRouter(tags=["Sessions"])


@router.get("/all", response_model=List[UserSessionStatus])
@role_required(["manager"], 'sessions', 'read')
async def get_all_sessions_status(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get session status for all users.
    Returns a table of all users and their current session information.
    """
    # Create a subquery to get the latest active session for each user
    active_sessions = (
        db.query(UserSession)
        .filter(
            UserSession.expires == False,
            UserSession.logout_time == None
        )
        .subquery()
    )

    # Join users with their active sessions
    query = (
        db.query(
            User.id.label('user_id'),
            User.username,
            User.email,
            User.role,
            User.is_active,
            active_sessions.c.id.label('session_id'),
            active_sessions.c.login_time
        )
        .outerjoin(active_sessions, User.id == active_sessions.c.user_id)
        .offset(skip)
        .limit(limit)
    )

    results = query.all()

    # Format the results
    session_statuses = []

    for result in results:
        # Calculate session duration if there's an active session
        session_duration = None
        if result.login_time:
            # Ensure result.login_time is offset-aware
            utc_plus_one = pytz.timezone('Africa/Lagos')
            login_time_aware = result.login_time.replace(tzinfo=utc_plus_one)
            duration = current_time() - login_time_aware
            hours = duration.total_seconds() // 3600
            minutes = (duration.total_seconds() % 3600) // 60
            session_duration = f"{int(hours)}h {int(minutes)}m"

        session_status = UserSessionStatus(
            user_id=str(result.user_id),
            username=result.username,
            email=result.email,
            role=result.role,
            is_active=result.is_active,
            session_id=str(result.session_id) if result.session_id else None,
            login_time=result.login_time,
            session_duration=session_duration
        )
        session_statuses.append(session_status)

    return session_statuses


# Optional: Endpoint to get session status for a specific user
@router.get("/{user_id}", response_model=UserSessionStatus)
@role_required(["casheir"], 'sessions', 'read')
async def get_user_session_status(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get detailed session status for a specific user"""
    session_manager = SessionManager(db)
    
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    active_session = session_manager.get_active_session(user_id)
    
    session_duration = None
    if active_session and active_session.login_time:
        duration = current_time - active_session.login_time
        hours = duration.total_seconds() // 3600
        minutes = (duration.total_seconds() % 3600) // 60
        session_duration = f"{int(hours)}h {int(minutes)}m"

    return UserSessionStatus(
        user_id=str(user.id),
        username=user.username,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        session_id=str(active_session.id) if active_session else None,
        login_time=active_session.login_time if active_session else None,
        logout_time=active_session.logout_time if active_session else None,
        session_duration=session_duration
    )

# get current session for user
@router.get("/current/", response_model=UserSessionStatus)
@role_required(["cashier"], 'sessions', 'read')
async def get_current_session(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the current active session details"""
    session_manager = SessionManager(db)
    active_session = session_manager.get_active_session(current_user.id)
    
    if not active_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active session found"
        )

    # Calculate session duration
    session_duration = None
    if active_session.login_time:
        utc_plus_one = pytz.timezone('Africa/Lagos')
        login_time_aware = active_session.login_time.replace(tzinfo=utc_plus_one)
        duration = current_time() - login_time_aware
        hours = duration.total_seconds() // 3600
        minutes = (duration.total_seconds() % 3600) // 60
        session_duration = f"{int(hours)}h {int(minutes)}m"

    # Set logout_time to current time for the response, but do not update the database
    logout_time = current_time()

    return UserSessionStatus(
        user_id=str(current_user.id),
        username=current_user.username,
        email=current_user.email,
        role=current_user.role,
        is_active=current_user.is_active,
        session_id=str(active_session.id),
        login_time=active_session.login_time,
        logout_time=logout_time,
        session_duration=session_duration
    )


# Optional: Endpoint to terminate a user's session
@router.put("/terminate/{user_id}", response_model=UserSessionStatus)
@role_required(["supervisor"], 'sessions', 'terminate')
async def terminate_user_session(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Terminate the user's session"""
    session_manager = SessionManager(db)
    
    session_terminated = session_manager.terminate_session(user_id)
    if not session_terminated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User session not found"
        )

    return {"detail": "Session terminated successfully"}