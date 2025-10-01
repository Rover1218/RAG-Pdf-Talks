import os
import numpy as np
from typing import List, Dict, Any, Optional
from collections import Counter
import re
from pinecone import Pinecone, ServerlessSpec
from app.core.config import get_settings


class VectorService:
    """Vector service that uses Pinecone sparse index.

    Notes:
    - Uses modern Pinecone API (2024+)
    - Configured for sparse vectors (keyword-based) using BM25-style encoding
    - Works with pinecone-sparse-english-v0 index
    """

    def __init__(self):
        self.settings = get_settings()
        self.pc = None
        self.index = None
        self.setup_vector_db()

    def setup_vector_db(self):
        """Initialize Pinecone index client using modern API"""
        if not self.settings.PINECONE_API_KEY:
            raise ValueError("PINECONE_API_KEY must be set for Pinecone usage")

        try:
            # Initialize Pinecone client (new API)
            self.pc = Pinecone(api_key=self.settings.PINECONE_API_KEY)
            
            # Connect to existing index (sparse index)
            self.index = self.pc.Index(self.settings.PINECONE_INDEX_NAME)
            
            print(f"✅ Connected to Pinecone sparse index: {self.settings.PINECONE_INDEX_NAME}")
        except Exception as e:
            raise ValueError(f"Failed to connect to Pinecone: {str(e)}")

    def create_sparse_vector(self, text: str) -> Dict[str, Any]:
        """Create sparse vector representation for text (BM25-style)"""
        # Tokenize and clean text
        tokens = re.findall(r'\b\w+\b', text.lower())
        
        # Remove very short tokens and common stop words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'are', 'was', 'were'}
        tokens = [t for t in tokens if len(t) > 2 and t not in stop_words]
        
        # Count token frequencies
        token_counts = Counter(tokens)
        
        # Create sparse vector with hash-based indices
        # Use dict to aggregate duplicate indices (hash collisions)
        index_value_map = {}
        total_tokens = len(tokens)
        
        for token, count in token_counts.items():
            # Hash token to create index
            token_hash = abs(hash(token)) % 100000
            # Calculate normalized frequency
            tf_value = float(count) / max(total_tokens, 1)
            
            # Aggregate values if hash collision occurs
            if token_hash in index_value_map:
                index_value_map[token_hash] += tf_value
            else:
                index_value_map[token_hash] = tf_value
        
        # Sort by index for consistency and convert to lists
        sorted_items = sorted(index_value_map.items())
        indices = [idx for idx, _ in sorted_items]
        values = [val for _, val in sorted_items]
        
        return {
            "indices": indices,
            "values": values
        }

    async def add_documents(self, texts: List[str], metadata: List[Dict[str, Any]]) -> bool:
        """Add documents to Pinecone sparse index"""
        try:
            vectors = []
            for i, (text, meta) in enumerate(zip(texts, metadata)):
                # Create sparse vector from text
                sparse_vec = self.create_sparse_vector(text)
                
                vectors.append({
                    "id": f"{meta['document_id']}_{i}",
                    "sparse_values": sparse_vec,
                    "metadata": meta,
                })

            # Upsert in batches to Pinecone
            batch_size = 100
            for i in range(0, len(vectors), batch_size):
                batch = vectors[i : i + batch_size]
                self.index.upsert(vectors=batch)

            print(f"✅ Successfully added {len(vectors)} document chunks to Pinecone")
            return True
        except Exception as e:
            print(f"❌ Error adding documents to Pinecone: {e}")
            return False

    async def search_similar(self, query: str, top_k: int = 5, document_id: str = None) -> List[Dict[str, Any]]:
        """Search for similar document chunks in Pinecone sparse index"""
        try:
            # Create sparse vector from query
            query_sparse = self.create_sparse_vector(query)

            # Build filter if document_id is provided
            filter_dict = {"document_id": document_id} if document_id else None
            
            # Query with sparse vector
            resp = self.index.query(
                sparse_vector=query_sparse,
                top_k=top_k,
                filter=filter_dict,
                include_metadata=True
            )

            matches = resp.get("matches", [])
            results: List[Dict[str, Any]] = []
            for m in matches:
                meta = m.get("metadata", {})
                results.append({
                    "text": meta.get("chunk_text") or meta.get("text") or "",
                    "score": float(m.get("score", 0.0)),
                    "metadata": meta,
                })

            return results
        except Exception as e:
            print(f"❌ Error searching Pinecone: {e}")
            return []

    async def delete_document(self, document_id: str) -> bool:
        """Delete all vectors associated with a document"""
        try:
            # Delete vectors with matching document_id
            self.index.delete(filter={"document_id": document_id})
            print(f"✅ Deleted vectors for document: {document_id}")
            return True
        except Exception as e:
            print(f"❌ Error deleting document from Pinecone: {e}")
            return False

    async def delete_document(self, document_id: str) -> bool:
        """Delete document vectors from Pinecone by metadata filter"""
        try:
            # Pinecone supports deletion by filter
            self.index.delete(filter={"document_id": document_id})
            return True
        except Exception as e:
            print(f"Error deleting document from Pinecone: {e}")
            return False