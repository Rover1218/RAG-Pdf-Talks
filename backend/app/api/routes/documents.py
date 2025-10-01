"""Document management endpoints"""
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from typing import List
import os
import uuid
from datetime import datetime

from app.models.schemas import DocumentUploadResponse, DocumentInfo
from app.services.document_service import DocumentService
from app.services.vector_service import VectorService

router = APIRouter()

# Initialize services
document_service = DocumentService()
vector_service = VectorService()

# In-memory document storage (replace with database in production)
documents_db = {}


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a PDF document and process it for RAG.
    """
    # Validate file type
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Generate document ID
    document_id = str(uuid.uuid4())
    
    # Save uploaded file
    uploads_dir = "uploads"
    os.makedirs(uploads_dir, exist_ok=True)
    file_path = os.path.join(uploads_dir, f"{document_id}_{file.filename}")
    
    try:
        # Save file
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Extract text from PDF
        text_content = document_service.extract_text_from_pdf(file_path)
        
        if not text_content:
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")
        
        # Split into chunks
        chunks = document_service.split_text_into_chunks(text_content)
        
        # Create metadata for each chunk
        metadata_list = [
            {
                "document_id": document_id,
                "filename": file.filename,
                "chunk_index": i,
                "total_chunks": len(chunks),
                "chunk_text": chunk  # Important: include text in metadata for retrieval
            }
            for i, chunk in enumerate(chunks)
        ]
        
        # Add to vector database
        success = await vector_service.add_documents(chunks, metadata_list)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to add documents to vector database")
        
        # Store document info
        documents_db[document_id] = {
            "document_id": document_id,
            "filename": file.filename,
            "upload_date": datetime.now().isoformat(),
            "chunks_count": len(chunks),
            "status": "processed",
            "file_path": file_path
        }
        
        return DocumentUploadResponse(
            document_id=document_id,
            filename=file.filename,
            chunks_count=len(chunks),
            status="processed"
        )
        
    except Exception as e:
        # Clean up file on error
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")


@router.get("", response_model=List[DocumentInfo])
async def get_documents():
    """
    Get list of all uploaded documents.
    """
    return list(documents_db.values())


@router.get("/{document_id}", response_model=DocumentInfo)
async def get_document(document_id: str):
    """
    Get information about a specific document.
    """
    if document_id not in documents_db:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return documents_db[document_id]


@router.delete("/{document_id}")
async def delete_document(document_id: str):
    """
    Delete a document and its associated vectors.
    """
    if document_id not in documents_db:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc_info = documents_db[document_id]
    
    try:
        # Delete file
        if os.path.exists(doc_info["file_path"]):
            os.remove(doc_info["file_path"])
        
        # Delete from vector database
        await vector_service.delete_document(document_id)
        
        # Remove from in-memory storage
        del documents_db[document_id]
        
        return {"message": "Document deleted successfully", "document_id": document_id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")


@router.post("/search")
async def search_documents(query: str, document_id: str = None, top_k: int = 5):
    """
    Search for relevant document chunks.
    """
    try:
        results = await vector_service.search_similar(
            query=query,
            top_k=top_k,
            document_id=document_id
        )
        
        return {
            "query": query,
            "results": results,
            "total_results": len(results)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")
