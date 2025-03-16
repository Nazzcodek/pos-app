from datetime import datetime, timedelta
from fastapi import HTTPException, Depends, status, Request, Security
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from models.engine.database import get_db
from models.user import User, TokenBlacklist
from services.sessionManager import SessionManager
from typing import Type, Optional
from dotenv import load_dotenv
from utils.time_utils import current_time
import pytz
import os

load_dotenv()

# security = HTTPBearer(auto_error=False)

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))
REFRESH_TOKEN_EXPIRE_MINUTES = int(os.getenv("REFRESH_TOKEN_EXPIRE_MINUTES"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
# security = HTTPBearer(auto_error=False)

credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = current_time() + timedelta(hours=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_access_token(access_token):
    try:
        # Decode the token
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Extract expiration time
        exp = payload.get("exp")
        if exp is None:
            raise credentials_exception
            
        # Check if token has expired
        utc_plus_one = pytz.timezone('Africa/Lagos')
        exp_datetime = datetime.fromtimestamp(exp, tz=utc_plus_one)
        if current_time() >= exp_datetime:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Access token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        return payload
        
    except JWTError:
        raise credentials_exception


def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = current_time() + timedelta(days=REFRESH_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_refresh_token(refresh_token):
    try:
        # Decode the token
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Extract expiration time
        exp = payload.get("exp")
        if exp is None:
            raise credentials_exception
            
        # Check if token has expired
        utc_plus_one = pytz.timezone('Africa/Lagos')
        exp_datetime = datetime.fromtimestamp(exp, tz=utc_plus_one)
        if current_time() >= exp_datetime:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        return payload
        
    except JWTError:
        raise credentials_exception


def is_token_blacklisted(db: Session, token: str) -> bool:
    return db.query(TokenBlacklist).filter(TokenBlacklist.token == token).first() is not None

def authenticate_user(db: Session, username: str, password: str):
    user = db.query(User).filter(User.username == username).first()
    if user and user.verify_password(password):
        return user
    return None


# def get_optional_token(
#     credentials: HTTPAuthorizationCredentials | None = Security(security)
# ) -> Optional[str]:
#     if credentials:
#         return credentials.credentials
#     return None

# async def get_current_user(
#     token: Optional[str] = Depends(get_optional_token),
#     db: Session = Depends(get_db)
# ) -> Optional[User]:
#     # First check if there are any users in the database
#     user_count = db.query(User).count()
#     if user_count == 0:
#         return None
    
#     # If no token provided after first user exists, return None
#     if not token:
#         return None

#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#         username: str = payload.get("sub")
#         if username is None:
#             raise credentials_exception
#     except JWTError:
#         raise credentials_exception
    
#     user = db.query(User).filter(User.username == username).first()
#     if user is None:
#         raise credentials_exception
    
#     return user



async def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    try:
        access_token = request.cookies.get("access_token")
        refresh_token = request.cookies.get("refresh_token")

        if not access_token:
            raise credentials_exception

        payload = verify_access_token(access_token)
        username: str = payload.get("sub")
        session_id: str = payload.get("session_id")

        if not username or not session_id:
            raise credentials_exception

        blacklisted = db.query(TokenBlacklist).filter(
            TokenBlacklist.token == access_token
        ).first()
        if blacklisted:
            raise credentials_exception

        user = db.query(User).filter(User.username == username).first()
        if not user:
            raise credentials_exception

        session_manager = SessionManager(db)
        active_session = session_manager.get_active_session(user.id)

        if not active_session or str(active_session.id) != session_id:
            raise credentials_exception

        # Augment the User object with the current_session_id
        user.current_session_id = session_id  # Add the attribute dynamically

        return user

    except Exception as e:
        raise credentials_exception
  
    
def delete(
    db: Session,
    model: Type,
    record_id: str,
    current_user: User,
    resource_name: str
) -> bool:
    """
    Generic delete function for any model.
    Only admin can delete records.
    """

    # Check if record exists
    record = db.query(model).filter(model.id == record_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource_name.capitalize()} not found"
        )

    try:
        db.delete(record)
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting {resource_name}: {str(e)}"
        )
