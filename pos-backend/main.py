from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from api.v1.views import api_router
from models.engine.database import engine, Base, get_db
from utils.time_utils import current_time
from server.websocket import manager
from server.discovery import ZeroconfPublisher
from contextlib import asynccontextmanager
import logging


WEBSOCKET_PORT = 8000
SERVICE_NAME = "MyWebSocketService"
zeroconf_publisher = ZeroconfPublisher(SERVICE_NAME, WEBSOCKET_PORT)

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                    handlers=[logging.StreamHandler()])

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start Zeroconf service on startup
    zeroconf_publisher.start()
    yield
    # Stop Zeroconf service on shutdown
    zeroconf_publisher.stop()


app = FastAPI(
    title="POS Application API",
    description="This is the API for the POS Application",
    version="1.0.0",
    lifespan=lifespan
)

origins = [
    "http://localhost:3000",
    "http://192.168.43.207:3000",
    "http://192.168.0.66:3000",
    'http://192.168.43.207:3000',
    'http://127.0.0.2:3000'

]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(api_router)

# Serve static files from the "uploads" directory
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/")
async def root():
    return {"message": "Welcome to Your POS Application API"}


@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "timestamp": current_time().isoformat(),
        "timezone": "Africa/Lagos (UTC+1)"
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, db: Session = Depends(get_db)):
    """Handles WebSocket connections with authentication."""
    try:
        # Extract cookies manually since WebSocket does not use FastAPI request object
        cookies = websocket.cookies

        # Authenticate user
        user = await manager.get_current_user(cookies, db)

        # Accept WebSocket connection
        await manager.connect(websocket, user)

        # Listen for incoming messages
        while True:
            data = await websocket.receive_text()
            await manager.send_personal_message(f"Message received: {data}", user.id)

    except WebSocketDisconnect:
        await manager.disconnect(user.id)
    except Exception as e:
        await websocket.close(code=4001, reason=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=WEBSOCKET_PORT,
        reload=True,
        log_level="info",
        workers=1)