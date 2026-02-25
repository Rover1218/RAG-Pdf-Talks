import os
from google import genai
from groq import Groq
from typing import List, Dict, Any
from app.core.config import get_settings

class AIService:
    def __init__(self):
        self.settings = get_settings()
        self.client = None
        self.model_name = None
        self.setup_ai_client()
    
    def setup_ai_client(self):
        """Initialize AI client based on provider"""
        try:
            if self.settings.AI_PROVIDER == "gemini":
                # Using the new google-genai SDK Client
                self.client = genai.Client(api_key=self.settings.GEMINI_API_KEY)
                self.model_name = 'gemini-2.0-flash'
                print(f"✅ Gemini client initialized with model: {self.model_name}")
            elif self.settings.AI_PROVIDER == "groq":
                self.client = Groq(api_key=self.settings.GROQ_API_KEY)
                # Updated to state-of-the-art supported model
                self.model_name = 'llama-3.3-70b-versatile'
                print(f"✅ Groq client initialized with model: {self.model_name}")
            else:
                print(f"⚠️ Unknown AI provider: {self.settings.AI_PROVIDER}")
        except Exception as e:
            print(f"❌ Error setting up AI client: {str(e)}")

    async def generate_response(
        self, 
        query: str, 
        context: List[str] = None, 
        conversation_history: List[Dict[str, str]] = None,
        document_id: str = None
    ) -> str:
        """Generate AI response using Gemini or Groq"""
        try:
            if not self.client:
                return "AI Service is not properly initialized. Please check API keys."

            # Construct system prompt with stronger document focus
            system_prompt = (
                "You are a sophisticated AI document intelligence assistant. "
                "Your primary role is to help users understand and extract information from their uploaded documents."
            )
            
            if context:
                context_text = "\n\n".join(context)
                system_prompt += (
                    f"\n\nCRITICAL CONTEXT FROM UPLOADED DOCUMENT:\n{context_text}\n\n"
                    "INSTRUCTIONS: Use ONLY the provided context above to answer the user's question. "
                    "If the answer is not in the context, state that clearly but try to be helpful with what is available. "
                    "Maintain a professional and analytical tone."
                )
            else:
                system_prompt += (
                    "\n\nNOTE: No specific document context was found for this query. "
                    "Answer to the best of your general knowledge, but remind the user to upload or select a document for specific analysis."
                )
            
            # Construct full prompt
            prompt_parts = [f"System: {system_prompt}"]
            
            if conversation_history:
                prompt_parts.append("Conversation history:")
                for msg in conversation_history[-5:]: # Last 5 messages for history
                    prompt_parts.append(f"{msg['role'].capitalize()}: {msg['content']}")
            
            prompt_parts.append(f"User: {query}")
            prompt_parts.append("Assistant:")
            
            full_prompt = "\n\n".join(prompt_parts)

            if self.settings.AI_PROVIDER == "gemini":
                # New SDK syntax: client.models.generate_content
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=full_prompt
                )
                
                # Defensive check for response text
                if not response or not hasattr(response, 'text') or not response.text:
                    print(f"⚠️ Gemini returned empty or invalid response. Response: {response}")
                    return "I'm sorry, the AI was unable to generate a response. This could be due to safety filters or a temporary glitch."
                    
                return response.text
            elif self.settings.AI_PROVIDER == "groq":
                response = self.client.chat.completions.create(
                    model=self.model_name,
                    messages=[{"role": "user", "content": full_prompt}],
                    temperature=0.3, # Lower temperature for better RAG groundedness
                )
                return response.choices[0].message.content
            
            return "Error: AI Provider not configured correctly."
        except Exception as e:
            print(f"❌ Error generating AI response: {str(e)}")
            return f"I'm sorry, I'm having trouble connecting to the AI service. (Error: {str(e)})"

    async def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate dense embeddings for a list of strings"""
        try:
            if not self.client or self.settings.AI_PROVIDER != "gemini":
                # Fallback dummies for non-Gemini or uninitialized
                return [[0.0] * 768 for _ in texts]

            # New SDK syntax: client.models.embed_content
            response = self.client.models.embed_content(
                model='text-embedding-004', 
                contents=texts
            )
            
            # Safely extract embeddings
            embeddings = []
            for emb in response.embeddings:
                if hasattr(emb, 'values'):
                    embeddings.append(list(emb.values))
                else:
                    embeddings.append([0.0] * 768)
            
            return embeddings
        except Exception as e:
            print(f"❌ Error generating embeddings: {str(e)}")
            return [[0.0] * 768 for _ in texts]

    async def generate_title(self, query: str) -> str:
        """Generate a title for the conversation"""
        try:
            prompt = f"Generate a short, descriptive title (max 6 words) for this question: {query}"
            
            if self.settings.AI_PROVIDER == "gemini":
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt
                )
                return response.text.strip().strip('"')
            elif self.settings.AI_PROVIDER == "groq":
                response = self.client.chat.completions.create(
                    model=self.model_name,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=20
                )
                return response.choices[0].message.content.strip().strip('"')
            
            return "New Chat"
        except Exception:
            return "New Chat"