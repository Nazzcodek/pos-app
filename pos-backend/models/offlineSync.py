# from sqlalchemy import Column, JSON, DateTime, Boolean, Enum
# from sqlalchemy.dialects.postgresql import UUID
# import enum
# import uuid
# from .baseModel import BaseModel
# from utils.time_utils import current_time

# class SyncStatus(enum.Enum):
#     PENDING = "pending"
#     SYNCED = "synced"
#     CONFLICT = "conflict"
#     ERROR = "error"

# class EntityType(enum.Enum):
#     SALE = "sale"
#     INVENTORY = "inventory"
#     PRODUCT = "product"

# class OfflineSync(BaseModel):
#     __tablename__ = "offline_syncs"
    
#     id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
#     entity_type = Column(Enum(EntityType))
#     entity_id = Column(UUID(as_uuid=True), nullable=True)
#     raw_data = Column(JSON)
#     status = Column(Enum(SyncStatus), default=SyncStatus.PENDING)
#     client_timestamp = Column(DateTime)
#     server_received_at = Column(DateTime, default=current_time)
#     originated_from = Column(UUID(as_uuid=True))
#     is_processed = Column(Boolean, default=False)