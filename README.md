# RAG PDF Chatbot

A sophisticated AI document search system that allows users to chat with PDF documents using Large Language Models and semantic search.

## 🚀 Features

- **PDF Upload & Processing**: Upload PDF documents and extract text content
- **Semantic Search**: Advanced vector-based search using embeddings
- **AI Chat Interface**: Chat with your documents using Gemini or Groq AI models
- **Vector Database**: Support for both Pinecone (cloud) and FAISS (local)
- **Modern UI**: React frontend with Tailwind CSS
- **Fast API Backend**: High-performance FastAPI backend
- **Docker Support**: Containerized deployment

## � Quick Start

### Automated Setup (Windows)
```powershell
.\start.ps1
```

### Automated Setup (Linux/Mac)
```bash
chmod +x start.sh
./start.sh
```

**Access the Application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## �🛠️ Tech Stack

### Frontend
- **Next.js 15** with TypeScript
- **React 19** for UI
- **Tailwind CSS** for styling
- **Axios** for API calls

### Backend
- **FastAPI** with Python
- **Uvicorn** ASGI server
- **Pydantic** for data validation
- **PyPDF2** for PDF processing

### AI & Vector Search
- **Google Gemini** or **Groq** for LLM
- **Sentence Transformers** for embeddings
- **Pinecone** (cloud) or **FAISS** (local) for vector storage

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** - Complete setup guide with troubleshooting
- **[PINECONE_GUIDE.md](./PINECONE_GUIDE.md)** - How to get Pinecone API keys and environment
- **[frontend/README.md](./frontend/README.md)** - Frontend documentation

## 🔑 Pinecone Configuration

### Quick Guide:
1. Sign up at [pinecone.io](https://www.pinecone.io/) (free tier available)
2. Get your **API Key** from the Pinecone console
3. **Modern Pinecone (Serverless)**: No environment variable needed!
4. **Legacy Pinecone**: Environment looks like `us-east1-gcp` or `eu-west1-gcp`

**Alternative**: Use **FAISS** (local storage, no API key required)

👉 **See [PINECONE_GUIDE.md](./PINECONE_GUIDE.md) for detailed instructions**

### Deployment
- **Docker** containerization
- **Vercel** for frontend
- **Railway/Render** for backend

## 📁 Project Structure

```
rag-pdf-chatbot/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   ├── public/
│   └── package.json
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core functionality
│   │   ├── models/         # Data models
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   ├── requirements.txt
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- Docker (optional)

### Environment Variables

Create `.env` files in both frontend and backend directories:

**Backend `.env`:**
```bash
# AI Provider (choose one)
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
AI_PROVIDER=gemini  # or 'groq'

# Vector Database (choose one)
PINECONE_API_KEY=your_pinecone_key
PINECONE_ENVIRONMENT=your_pinecone_env
PINECONE_INDEX_NAME=pdf-chatbot
VECTOR_DB=pinecone  # or 'faiss'

# App Settings
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB
CORS_ORIGINS=http://localhost:3000
```

**Frontend `.env`:**
```bash
VITE_API_URL=http://localhost:8000
```

### Installation & Setup

1. **Clone and setup backend:**
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate  # Windows
   pip install -r requirements.txt
   ```

2. **Setup frontend:**
   ```bash
   cd frontend
   npm install
   ```

3. **Run the application:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   venv\Scripts\activate
   uvicorn app.main:app --reload --port 8000

   # Terminal 2 - Frontend  
   cd frontend
   npm run dev
   ```

4. **Using Docker (optional):**
   ```bash
   docker-compose up --build
   ```

## 📝 Usage

1. **Upload PDF**: Click "Upload PDF" and select your document
2. **Wait for Processing**: The system will extract text and create embeddings
3. **Start Chatting**: Ask questions about your document content
4. **Get Answers**: The AI will provide relevant answers based on the document

## 🔧 Configuration

### AI Provider Setup

**For Gemini:**
- Get API key from [Google AI Studio](https://makersuite.google.com/)
- Set `AI_PROVIDER=gemini` in backend `.env`

**For Groq:**
- Get API key from [Groq Console](https://console.groq.com/)
- Set `AI_PROVIDER=groq` in backend `.env`

### Vector Database Setup

**For Pinecone:**
- Create account at [Pinecone](https://www.pinecone.io/)
- Create an index with dimension 384
- Set `VECTOR_DB=pinecone` in backend `.env`

**For FAISS (Local):**
- No additional setup required
- Set `VECTOR_DB=faiss` in backend `.env`

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
# Deploy to Vercel
```

### Backend (Railway/Render)
```bash
# Push to GitHub
# Connect to Railway/Render
# Set environment variables
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.