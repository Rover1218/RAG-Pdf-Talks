import os
import numpy as np
from typing import List, Dict, Any, Optional
from collections import Counter
import re
from pinecone import Pinecone, ServerlessSpec
from app.core.config import get_settings
from app.services.ai_service import AIService

class VectorService:
    """Vector service optimized for Pinecone sparse-only indexes.

    Notes:
    - Automatically handles the "Upserting dense vectors is not supported" constraint.
    - Uses empty values list [] by default for current index configuration.
    """

    def __init__(self):
        self.settings = get_settings()
        self.ai_service = AIService()
        self.pc = None
        self.index = None
        self.dimension = 1
        self.setup_vector_db()

    def setup_vector_db(self):
        """Initialize Pinecone index client"""
        if not self.settings.PINECONE_API_KEY:
            raise ValueError("PINECONE_API_KEY must be set for Pinecone usage")

        try:
            self.pc = Pinecone(api_key=self.settings.PINECONE_API_KEY)
            self.index = self.pc.Index(self.settings.PINECONE_INDEX_NAME)
            
            # Detect dimension
            try:
                desc = self.pc.describe_index(self.settings.PINECONE_INDEX_NAME)
                self.dimension = desc.dimension
                print(f"✅ Connected to Pinecone index: {self.settings.PINECONE_INDEX_NAME} (Dim: {self.dimension})")
            except:
                pass
                
        except Exception as e:
            print(f"❌ Failed to connect to Pinecone: {str(e)}")

    def create_sparse_vector(self, text: str) -> Dict[str, Any]:
        """Create sparse vector representation for text (BM25-style)"""
        tokens = re.findall(r'\b\w+\b', text.lower())
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'are', 'was', 'were'}
        tokens = [t for t in tokens if len(t) > 2 and t not in stop_words]
        token_counts = Counter(tokens)
        
        index_value_map = {}
        total_tokens = len(tokens)
        
        for token, count in token_counts.items():
            token_hash = abs(hash(token)) % 100000
            tf_value = float(count) / max(total_tokens, 1)
            index_value_map[token_hash] = index_value_map.get(token_hash, 0.0) + tf_value
        
        sorted_items = sorted(index_value_map.items())
        return {
            "indices": [idx for idx, _ in sorted_items],
            "values": [val for _, val in sorted_items]
        }

    async def add_documents(self, texts: List[str], metadata: List[Dict[str, Any]]) -> bool:
        """Add documents using sparse values only (with empty dense values)"""
        try:
            vectors = []
            for i, (text, meta) in enumerate(zip(texts, metadata)):
                sparse_vec = self.create_sparse_vector(text)
                
                # OPTIMIZATION: We confirmed that the server requires an empty values list
                # for this sparse-only index, regardless of the reported dimension of 1.
                # Skipping the failed trial and going straight to empty list.
                vectors.append({
                    "id": f"{meta['document_id']}_{i}",
                    "values": [], 
                    "sparse_values": sparse_vec,
                    "metadata": meta
                })

            # Upsert in batches
            batch_size = 100
            for i in range(0, len(vectors), batch_size):
                batch = vectors[i : i + batch_size]
                self.index.upsert(vectors=batch)

            print(f"✅ Successfully added {len(vectors)} sparse vectors to Pinecone (using empty dense values)")
            return True
        except Exception as e:
            print(f"❌ Error adding documents to Pinecone: {e}")
            return False

    async def search_similar(self, query: str, top_k: int = 5, document_ids: List[str] = None) -> List[Dict[str, Any]]:
        """Search similar chunks using sparse vector"""
        try:
            query_sparse = self.create_sparse_vector(query)
            
            # If the query generated no tokens (e.g. all stopwords),
            # return empty instead of calling Pinecone and erroring.
            if not query_sparse.get("indices"):
                print(f"⚠️ Search query '{query}' yielded an empty sparse vector. Skipping search.")
                return []
            
            # Prepare filter
            filter_dict = {}
            if document_ids:
                if len(document_ids) == 1:
                    filter_dict["document_id"] = document_ids[0]
                else:
                    # Pinecone supports '$in' for matching multiple values
                    filter_dict["document_id"] = {"$in": document_ids}
            
            # For query, we also provide empty vector for the dense part
            resp = self.index.query(
                vector=[],
                sparse_vector=query_sparse,
                top_k=top_k,
                filter=filter_dict if filter_dict else None,
                include_metadata=True
            )

            results: List[Dict[str, Any]] = []
            for m in resp.get("matches", []):
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
        """Delete document vectors"""
        try:
            self.index.delete(filter={"document_id": document_id})
            return True
        except Exception as e:
            print(f"❌ Error deleting document: {e}")
            return False