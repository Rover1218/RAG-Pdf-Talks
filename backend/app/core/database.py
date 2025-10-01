"""SQLite database for persistent document storage"""
import sqlite3
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
import os


class DocumentDatabase:
    """Simple SQLite database for document metadata"""
    
    def __init__(self, db_path: str = "documents.db"):
        self.db_path = db_path
        self.init_db()
    
    def init_db(self):
        """Initialize database and create tables if they don't exist"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                document_id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                upload_date TEXT NOT NULL,
                chunks_count INTEGER NOT NULL,
                status TEXT NOT NULL,
                file_path TEXT NOT NULL
            )
        """)
        
        conn.commit()
        conn.close()
    
    def add_document(self, document_info: Dict[str, Any]) -> bool:
        """Add a document to the database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO documents (document_id, filename, upload_date, chunks_count, status, file_path)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                document_info["document_id"],
                document_info["filename"],
                document_info["upload_date"],
                document_info["chunks_count"],
                document_info["status"],
                document_info["file_path"]
            ))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error adding document to database: {e}")
            return False
    
    def get_all_documents(self) -> List[Dict[str, Any]]:
        """Get all documents from the database"""
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute("SELECT * FROM documents ORDER BY upload_date DESC")
            rows = cursor.fetchall()
            
            documents = [dict(row) for row in rows]
            conn.close()
            return documents
        except Exception as e:
            print(f"Error fetching documents: {e}")
            return []
    
    def get_document(self, document_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific document by ID"""
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute("SELECT * FROM documents WHERE document_id = ?", (document_id,))
            row = cursor.fetchone()
            
            conn.close()
            return dict(row) if row else None
        except Exception as e:
            print(f"Error fetching document: {e}")
            return None
    
    def delete_document(self, document_id: str) -> bool:
        """Delete a document from the database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("DELETE FROM documents WHERE document_id = ?", (document_id,))
            deleted = cursor.rowcount > 0
            
            conn.commit()
            conn.close()
            return deleted
        except Exception as e:
            print(f"Error deleting document from database: {e}")
            return False
    
    def document_exists(self, document_id: str) -> bool:
        """Check if a document exists in the database"""
        return self.get_document(document_id) is not None
