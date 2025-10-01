import os
import google.generativeai as genai
from groq import Groq
from typing import List, Dict, Any
from app.core.config import get_settings

class AIService:
    def __init__(self):
        self.settings = get_settings()
        self.setup_ai_client()
    
    def setup_ai_client(self):
        """Initialize AI client based on provider"""
        if self.settings.AI_PROVIDER == "gemini":
            genai.configure(api_key=self.settings.GEMINI_API_KEY)
            # Use Gemini 2.0 Flash - latest and fastest model
            self.client = genai.GenerativeModel('gemini-2.0-flash-exp')
        elif self.settings.AI_PROVIDER == "groq":
            self.client = Groq(api_key=self.settings.GROQ_API_KEY)
        else:
            raise ValueError(f"Unsupported AI provider: {self.settings.AI_PROVIDER}")
    
    async def generate_response(
        self, 
        query: str, 
        context: List[str], 
        conversation_history: List[Dict[str, str]] = None
    ) -> str:
        """Generate AI response based on query and context"""
        
        # Build prompt with context
        if context and len(context) > 0:
            context_text = "\n\n".join(context)
            prompt = f"""You are a friendly, knowledgeable AI assistant analyzing a document.

DOCUMENT CONTENT:
{context_text}

USER QUESTION: {query}

INSTRUCTIONS FOR YOUR RESPONSE:
1. Be conversational and enthusiastic (but professional)
2. Structure your answer clearly:
   - Use **bold** for important terms, names, or key points
   - Use bullet points (start lines with •) for lists
   - Use numbered lists (1., 2., 3.) for steps or sequences
   - Add line breaks between sections for readability
3. Reference specific information from the document
4. Be comprehensive but concise
5. Add a brief friendly closing or insight

Provide your engaging, well-structured response:"""
        else:
            # No context available - let AI know
            prompt = f"""You are a helpful AI assistant.

The user asked: "{query}"

However, no document is currently selected, so I cannot answer questions about specific documents.

Respond in a warm, friendly way (2-3 sentences) explaining:
1. They need to upload a PDF document first (if they haven't)
2. Click on a document in the sidebar to select it
3. Then they can ask questions about it

Be encouraging and helpful.

Your response:"""
        
        if self.settings.AI_PROVIDER == "gemini":
            response = self.client.generate_content(prompt)
            return response.text
        elif self.settings.AI_PROVIDER == "groq":
            messages = [{"role": "user", "content": prompt}]
            
            if conversation_history:
                messages = conversation_history + messages
            
            response = self.client.chat.completions.create(
                model="mixtral-8x7b-32768",
                messages=messages,
                temperature=0.7,
                max_tokens=1000
            )
            return response.choices[0].message.content
        
        raise ValueError(f"Unsupported AI provider: {self.settings.AI_PROVIDER}")
    
    async def generate_title(self, query: str) -> str:
        """Generate a title for the conversation"""
        prompt = f"Generate a short, descriptive title (max 6 words) for this question: {query}"
        
        if self.settings.AI_PROVIDER == "gemini":
            response = self.client.generate_content(prompt)
            return response.text.strip()
        elif self.settings.AI_PROVIDER == "groq":
            response = self.client.chat.completions.create(
                model="mixtral-8x7b-32768",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5,
                max_tokens=50
            )
            return response.choices[0].message.content.strip()
        
        return "Document Chat"