from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
from functools import lru_cache

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")
    # AI Provider Settings
    AI_PROVIDER: str = "gemini"  # 'gemini' or 'groq'
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    
    # Vector Database Settings (default to Pinecone)
    VECTOR_DB: str = "pinecone"  # 'pinecone' or 'faiss'
    PINECONE_API_KEY: str = ""
    PINECONE_ENVIRONMENT: str = ""
    PINECONE_INDEX_NAME: str = "rag-pdf-chatbot"
    PINECONE_HOST: str = ""  # Optional: for direct connection
    
    # App Settings
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 10485760  # 10MB
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    
    # Model Settings
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200

@lru_cache()
def get_settings():
    return Settings()