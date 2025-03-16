from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.ext.declarative import declarative_base
import os
import dotenv

# Load environment variables
dotenv.load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
# Create engine
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
ScopedSession = scoped_session(SessionLocal)

# Base class for models
Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = ScopedSession()
    try:
        # db.execute(text("SET TIME ZONE 'Africa/Lagos'"))
        yield db
    finally:
        db.close()


async def get_websocket_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


'''from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.ext.declarative import declarative_base
import os
import dotenv

# Load environment variables
dotenv.load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Create engine with connection pooling configuration
engine = create_engine(
    DATABASE_URL,
    pool_size=20,  # Maximum number of persistent connections
    max_overflow=10,  # Maximum number of connections that can be created beyond pool_size
    pool_timeout=30,  # Timeout for getting connection from pool (seconds)
    pool_pre_ping=True,  # Enable connection health checks
    pool_recycle=3600,  # Recycle connections after 1 hour
)

# Create session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Create scoped session
ScopedSession = scoped_session(SessionLocal)

# Base class for models
Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = ScopedSession()
    try:
        db.execute(text("SET TIME ZONE 'Africa/Lagos'"))
        yield db
    finally:
        ScopedSession.remove()  # Remove session from registry instead of just closing

# For WebSocket connections
async def get_websocket_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
'''