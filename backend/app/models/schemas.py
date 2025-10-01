from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Request Models
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    document_id: Optional[str] = None
    conversation_id: Optional[str] = None

class DocumentUploadResponse(BaseModel):
    document_id: str
    filename: str
    chunks_count: int
    status: str

class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: datetime = Field(default_factory=datetime.now)

class ChatResponse(BaseModel):
    response: str
    conversation_id: str
    sources: List[str] = []
    processing_time: Optional[float] = None

class DocumentInfo(BaseModel):
    document_id: str
    filename: str
    upload_date: datetime
    chunks_count: int
    status: str

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    document_id: Optional[str] = None
    top_k: int = Field(default=5, ge=1, le=20)

class SearchResult(BaseModel):
    text: str
    score: float
    metadata: Dict[str, Any]

class SearchResponse(BaseModel):
    results: List[SearchResult]
    query: str
    total_results: int

# Error Models
class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    code: Optional[str] = None

# Health Check
class HealthResponse(BaseModel):
    status: str
    ai_provider: str
    vector_db: str
    timestamp: datetime = Field(default_factory=datetime.now)