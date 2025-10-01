from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv

from app.api.routes import chat, documents
from app.core.config import get_settings
from app.services.ai_service import AIService
from app.services.vector_service import VectorService

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="RAG PDF Chatbot API",
    description="AI-powered document search and chat system",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Get settings
settings = get_settings()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
ai_service = AIService()
vector_service = VectorService()

# Include routers
app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])
app.include_router(documents.router, prefix="/api/v1/documents", tags=["documents"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "RAG PDF Chatbot API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "ai_provider": settings.AI_PROVIDER,
        "vector_db": settings.VECTOR_DB
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)