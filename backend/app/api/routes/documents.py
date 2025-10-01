"""Document management endpoints"""
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from typing import List
import os
import uuid
from datetime import datetime

from app.models.schemas import DocumentUploadResponse, DocumentInfo
from app.services.document_service import DocumentService
from app.services.vector_service import VectorService
from app.core.database import DocumentDatabase

router = APIRouter()

# Initialize services
document_service = DocumentService()
vector_service = VectorService()

# Initialize persistent database
db = DocumentDatabase()


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
        
        # Store document info in database
        document_info = {
            "document_id": document_id,
            "filename": file.filename,
            "upload_date": datetime.now().isoformat(),
            "chunks_count": len(chunks),
            "status": "processed",
            "file_path": file_path
        }
        
        db_success = db.add_document(document_info)
        if not db_success:
            # Rollback: delete from vector DB if database insert fails
            await vector_service.delete_document(document_id)
            raise HTTPException(status_code=500, detail="Failed to save document metadata")
        
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
    return db.get_all_documents()


@router.get("/{document_id}", response_model=DocumentInfo)
async def get_document(document_id: str):
    """
    Get information about a specific document.
    """
    document = db.get_document(document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return document


@router.delete("/{document_id}")
async def delete_document(document_id: str):
    """
    Delete a document and its associated vectors.
    """
    # Check if document exists
    doc_info = db.get_document(document_id)
    if not doc_info:
        raise HTTPException(status_code=404, detail="Document not found")
    
    errors = []
    
    try:
        # Step 1: Delete from vector database first (most critical)
        vector_deleted = await vector_service.delete_document(document_id)
        if not vector_deleted:
            errors.append("Failed to delete from vector database")
        
        # Step 2: Delete physical file
        try:
            if os.path.exists(doc_info["file_path"]):
                os.remove(doc_info["file_path"])
        except Exception as e:
            errors.append(f"Failed to delete file: {str(e)}")
        
        # Step 3: Remove from database
        db_deleted = db.delete_document(document_id)
        if not db_deleted:
            errors.append("Failed to delete from database")
        
        if errors:
            # Partial success - document was partially deleted
            return {
                "message": "Document partially deleted (some operations failed)",
                "document_id": document_id,
                "errors": errors,
                "status": "partial"
            }
        
        return {
            "message": "Document deleted successfully",
            "document_id": document_id,
            "status": "success"
        }
        
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
