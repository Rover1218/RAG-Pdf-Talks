"""Chat endpoints"""
from fastapi import APIRouter, HTTPException
from typing import Optional
import uuid

from app.models.schemas import ChatRequest, ChatResponse
from app.services.ai_service import AIService
from app.services.vector_service import VectorService

router = APIRouter()

# Initialize services
ai_service = AIService()
vector_service = VectorService()

# In-memory conversation storage (replace with database in production)
conversations = {}


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Send a chat message and get AI response with RAG context.
    """
    try:
        # Get or create conversation ID
        conversation_id = request.conversation_id or str(uuid.uuid4())
        
        # Get conversation history
        history = conversations.get(conversation_id, [])
        
        # Search for relevant context if document_ids provided
        context_chunks = []
        sources = []
        
        if request.document_ids:
            print(f"🔍 RAG: Searching across IDs: {request.document_ids}")
            try:
                search_results = await vector_service.search_similar(
                    query=request.message,
                    top_k=7, 
                    document_ids=request.document_ids
                )
                
                print(f"📊 Vector results found: {len(search_results)}")
                if search_results:
                    context_chunks = [result["text"] for result in search_results if result.get("text")]
                    sources = [f"{result['metadata'].get('filename', 'Doc')}: Chunk {result['metadata'].get('chunk_index', '?')}" for result in search_results]
                
                # IMPROVED FALLBACK: If vector search returns nothing (common for broad queries like 'summarize'),
                # and we HAVE document IDs, force-retrieve the first few chunks of each document.
                if not context_chunks:
                    print(f"⚠️ Vector search yielded 0 chunks for '{request.message}'. Triggering BROAD FALLBACK.")
                    for doc_id in request.document_ids:
                        try:
                            # Use a word that passes the stopword filter to trigger broad retrieval
                            fallback_results = await vector_service.search_similar(
                                query="pdf", 
                                top_k=3, # Get top 3 chunks per doc
                                document_ids=[doc_id]
                            )
                            if fallback_results:
                                context_chunks.extend([res["text"] for res in fallback_results if res.get("text")])
                                sources.extend([f"{res['metadata'].get('filename', 'Doc')}: Chunk {res['metadata'].get('chunk_index', '?')} (Full Doc)" for res in fallback_results])
                        except Exception as e:
                            print(f"❌ Fallback failed for doc {doc_id}: {e}")

                if context_chunks:
                    print(f"✅ RAG SUCCESS: {len(context_chunks)} chunks retrieved.")
                else:
                    print("⚠️ RAG FAILURE: No context found even after broad fallback.")
            except Exception as search_error:
                print(f"⚠️ Error during vector search: {str(search_error)}")
        
        # Generate AI response
        print(f"🤖 Generating AI response for user query...")
        try:
            response_text = await ai_service.generate_response(
                query=request.message,
                context=context_chunks,
                conversation_history=history,
                document_id=request.document_ids[0] if request.document_ids else None
            )
            print(f"✅ AI response generated successfully ({len(response_text)} chars)")
        except Exception as ai_err:
            print(f"❌ AI Generation Error: {str(ai_err)}")
            # Return error message to user instead of 500
            response_text = f"I'm sorry, I encountered an error while communicating with the AI service: {str(ai_err)}"
        
        # Update conversation history
        history.append({"role": "user", "content": request.message})
        history.append({"role": "assistant", "content": response_text})
        conversations[conversation_id] = history[-10:]  # Keep last 10 messages
        
        return ChatResponse(
            response=response_text,
            conversation_id=conversation_id,
            sources=sources
        )
        
    except Exception as e:
        print(f"❌ Top-level Chat End-point Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Critical chat error: {str(e)}")


@router.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str):
    """
    Get conversation history.
    """
    if conversation_id not in conversations:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return {
        "conversation_id": conversation_id,
        "messages": conversations[conversation_id]
    }


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """
    Delete a conversation.
    """
    if conversation_id not in conversations:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    del conversations[conversation_id]
    return {"message": "Conversation deleted", "conversation_id": conversation_id}
