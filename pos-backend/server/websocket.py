from fastapi import WebSocket
from sqlalchemy.orm import Session
from typing import Dict
from starlette.websockets import WebSocketState
from models.user import User, TokenBlacklist
from services.auth import verify_access_token
from services.sessionManager import SessionManager


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}  # user_id -> WebSocket

    async def connect(self, websocket: WebSocket, user: User):
        """Accepts WebSocket connection and associates it with a user."""
        await websocket.accept()
        self.active_connections[user.id] = websocket

    async def disconnect(self, user_id: int):
        """Removes WebSocket connection when user disconnects."""
        websocket = self.active_connections.get(user_id)
        if websocket:
            await websocket.close()
            del self.active_connections[user_id]

    async def send_personal_message(self, message: str, user_id: int):
        """Sends a message to a specific user."""
        websocket = self.active_connections.get(user_id)
        if websocket and websocket.client_state == WebSocketState.CONNECTED:
            await websocket.send_text(message)

    async def broadcast(self, message: str):
        """Broadcasts a message to all connected clients."""
        for websocket in self.active_connections.values():
            if websocket.client_state == WebSocketState.CONNECTED:
                await websocket.send_text(message)

    async def get_current_user(self, cookies: dict, db: Session) -> User:
        """Authenticates a WebSocket user using cookies."""
        try:
            access_token = cookies.get("access_token")
            if not access_token:
                raise Exception("Authentication token missing")

            # Verify access token
            payload = verify_access_token(access_token)
            username: str = payload.get("sub")
            session_id: str = payload.get("session_id")

            if not username or not session_id:
                raise Exception("Invalid token payload")

            # Check if token is blacklisted
            blacklisted = db.query(TokenBlacklist).filter(TokenBlacklist.token == access_token).first()
            if blacklisted:
                raise Exception("Token is blacklisted")

            # Fetch the user from the database
            user = db.query(User).filter(User.username == username).first()
            if not user:
                raise Exception("User not found")

            # Validate active session
            session_manager = SessionManager(db)
            active_session = session_manager.get_active_session(user.id)

            if not active_session or str(active_session.id) != session_id:
                raise Exception("No active session found")

            # Attach session ID dynamically
            user.current_session_id = session_id

            return user

        except Exception as e:
            raise Exception(f"Authentication failed: {str(e)}")


# Initialize the connection manager
manager = ConnectionManager()
