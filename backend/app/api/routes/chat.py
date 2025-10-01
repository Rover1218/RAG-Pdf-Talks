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
        
        # Search for relevant context if document_id provided
        context_chunks = []
        sources = []
        
        if request.document_id:
            print(f"🔍 Searching for context with document_id: {request.document_id}")
            try:
                search_results = await vector_service.search_similar(
                    query=request.message,
                    top_k=5,
                    document_id=request.document_id
                )
                
                print(f"📊 Found {len(search_results)} results from vector search")
                if search_results:
                    context_chunks = [result["text"] for result in search_results if result.get("text")]
                    sources = [f"Chunk {result['metadata'].get('chunk_index', '?')}" for result in search_results]
                    
                    if context_chunks:
                        print(f"✅ Context retrieved: {len(context_chunks)} chunks")
                        for i, chunk in enumerate(context_chunks[:2]):
                            print(f"   Chunk {i+1} preview: {chunk[:100]}...")
                    else:
                        print("⚠️ No valid context chunks found in search results")
                else:
                    print("⚠️ No search results found for document")
            except Exception as search_error:
                print(f"⚠️ Error during vector search: {str(search_error)}")
                # Continue without context if search fails
        
        # Generate AI response
        response_text = await ai_service.generate_response(
            query=request.message,
            context=context_chunks,
            conversation_history=history,
            document_id=request.document_id
        )
        
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
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")


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
