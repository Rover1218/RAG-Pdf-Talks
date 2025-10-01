import os
import uuid
from typing import List, Dict, Any
import PyPDF2
import pdfplumber
from fastapi import UploadFile
from app.core.config import get_settings
from app.services.vector_service import VectorService

class DocumentService:
    def __init__(self):
        self.settings = get_settings()
        self.vector_service = VectorService()
        
        # Ensure upload directory exists
        os.makedirs(self.settings.UPLOAD_DIR, exist_ok=True)
    
    async def process_pdf(self, file: UploadFile) -> Dict[str, Any]:
        """Process uploaded PDF file"""
        try:
            # Generate unique document ID
            doc_id = str(uuid.uuid4())
            
            # Save uploaded file
            file_path = os.path.join(self.settings.UPLOAD_DIR, f"{doc_id}_{file.filename}")
            content = await file.read()
            
            with open(file_path, "wb") as f:
                f.write(content)
            
            # Extract text from PDF
            text_content = self.extract_text_from_pdf(file_path)
            
            if not text_content:
                raise ValueError("Could not extract text from PDF")
            
            # Split text into chunks
            chunks = self.split_text_into_chunks(text_content)
            
            # Create metadata for each chunk
            metadata = []
            for i, chunk in enumerate(chunks):
                metadata.append({
                    "document_id": doc_id,
                    "filename": file.filename,
                    "chunk_id": i,
                    "chunk_text": chunk,
                    "file_path": file_path
                })
            
            # Add to vector database
            success = await self.vector_service.add_documents(chunks, metadata)
            
            if not success:
                raise ValueError("Failed to add document to vector database")
            
            return {
                "document_id": doc_id,
                "filename": file.filename,
                "chunks_count": len(chunks),
                "status": "processed"
            }
            
        except Exception as e:
            raise ValueError(f"Error processing PDF: {str(e)}")
    
    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file using multiple methods"""
        text_content = ""
        
        try:
            # Method 1: Try pdfplumber first (better for complex layouts)
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_content += page_text + "\n\n"
            
            if text_content.strip():
                return text_content
            
        except Exception:
            pass
        
        try:
            # Method 2: Fallback to PyPDF2
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_content += page_text + "\n\n"
            
        except Exception:
            pass
        
        return text_content.strip()
    
    def split_text_into_chunks(self, text: str) -> List[str]:
        """Split text into smaller chunks for embedding"""
        chunks = []
        chunk_size = self.settings.CHUNK_SIZE
        overlap = self.settings.CHUNK_OVERLAP
        
        # Simple text splitting by sentences and paragraphs
        paragraphs = text.split('\n\n')
        current_chunk = ""
        
        for paragraph in paragraphs:
            # If adding this paragraph would exceed chunk size
            if len(current_chunk) + len(paragraph) > chunk_size:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                    
                    # Start new chunk with overlap
                    words = current_chunk.split()
                    if len(words) > 50:  # Keep last 50 words for overlap
                        overlap_text = ' '.join(words[-50:])
                        current_chunk = overlap_text + "\n\n" + paragraph
                    else:
                        current_chunk = paragraph
                else:
                    current_chunk = paragraph
            else:
                if current_chunk:
                    current_chunk += "\n\n" + paragraph
                else:
                    current_chunk = paragraph
        
        # Add the last chunk
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        # Filter out very small chunks
        chunks = [chunk for chunk in chunks if len(chunk.split()) > 10]
        
        return chunks
    
    async def delete_document(self, document_id: str) -> bool:
        """Delete a document and its associated files"""
        try:
            # Delete from vector database
            await self.vector_service.delete_document(document_id)
            
            # Delete physical file (optional - you might want to keep files)
            # This would require tracking file paths by document_id
            
            return True
            
        except Exception as e:
            print(f"Error deleting document: {e}")
            return False
    
    async def search_documents(self, query: str, document_id: str = None) -> List[str]:
        """Search for relevant document chunks"""
        try:
            results = await self.vector_service.search_similar(
                query=query,
                top_k=5,
                document_id=document_id
            )
            
            # Extract text content from results
            return [result["text"] for result in results]
            
        except Exception as e:
            print(f"Error searching documents: {e}")
            return []