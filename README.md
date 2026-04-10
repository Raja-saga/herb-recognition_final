# Herb Recognition System with RAG Integration

A comprehensive herb identification system combining Computer Vision (ViT), Geographical Validation, and RAG-based Q&A.

## System Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  Frontend   │─────▶│   Backend   │─────▶│ ML Service  │      │ RAG Service │
│  (React)    │      │  (Express)  │      │  (Python)   │      │  (FastAPI)  │
│   :5173     │      │    :3001    │      │             │      │    :8000    │
└─────────────┘      └─────────────┘      └─────────────┘      └─────────────┘
                            │                                           │
                            │                                           ▼
                            ▼                                    ┌─────────────┐
                     ┌─────────────┐                            │  Vector DB  │
                     │  Metadata   │                            │  (ChromaDB) │
                     │   (JSON)    │                            └─────────────┘
                     └─────────────┘                                   │
                                                                        ▼
                                                                 ┌─────────────┐
                                                                 │     LLM     │
                                                                 │ (OpenRouter)│
                                                                 └─────────────┘
```

## Services

### 1. Frontend (React + Vite)
- Image upload interface
- Location-based validation
- Interactive herb information display
- Chat interface for herb queries

### 2. Backend (Express.js)
- Image processing orchestration
- ML model integration
- Geographical validation
- RAG service proxy

### 3. ML Service (Python + PyTorch)
- Vision Transformer (ViT) model
- Herb classification
- Confidence scoring

### 4. RAG Service (FastAPI) ⭐ NEW
- Semantic search via ChromaDB
- LLM-powered Q&A
- Context-aware responses
- Microservice architecture

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- pip and npm

### Installation

**1. Install Backend Dependencies:**
```bash
cd backend
npm install
```

**2. Install Frontend Dependencies:**
```bash
cd frontend
npm install
```

**3. Install ML Service Dependencies:**
```bash
cd ml_service
pip install -r requirements.txt
```

**4. Install RAG Service Dependencies:**
```bash
cd rag_service
pip install -r requirements.txt
```

**5. Configure Environment:**
```bash
# Copy and edit .env in rag_service/
OPENROUTER_API_KEY=your_key_here
CHROMA_PATH=./vector_db/chroma
```

### Running the System

**Option 1: Start All Services (Windows)**
```bash
start-all.bat
```

**Option 2: Start Services Individually**
```bash
# Terminal 1 - RAG Service
cd rag_service
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 - Backend
cd backend
npm start

# Terminal 3 - Frontend
cd frontend
npm run dev
```

**Option 3: Docker Deployment**
```bash
docker-compose up -d
```

## Service URLs

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- RAG Service: http://localhost:8000
- RAG Health: http://localhost:8000/health

## Features

### Core Features
✅ Herb identification using Vision Transformer
✅ Geographical validation with confidence scoring
✅ State-wise herb distribution mapping
✅ Real-time location-based validation

### RAG Features (NEW)
✅ Semantic search over herb knowledge base
✅ LLM-powered natural language Q&A
✅ Context-aware responses
✅ Herb-specific information retrieval

## API Endpoints

### Backend Endpoints
```
POST /api/predict          - Herb identification with geo-validation
GET  /api/locations/:herb  - Get herb distribution data
POST /api/chat             - Chat with RAG about specific herb
POST /api/ask              - Ask questions about herbs
```

### RAG Service Endpoints
```
GET  /health               - Health check
POST /ask                  - Ask questions
POST /query                - Query with herb filter
```

## Testing

Run integration tests:
```bash
python test_integration.py
```

## Project Structure

```
herb-recognition/
├── frontend/              # React frontend
├── backend/               # Express backend
├── ml_service/            # PyTorch ML service
├── rag_service/           # FastAPI RAG microservice
│   ├── app/
│   │   ├── main.py        # FastAPI app
│   │   ├── rag_pipeline.py # RAG logic
│   │   └── config.py      # Configuration
│   ├── vector_db/         # ChromaDB storage
│   ├── Dockerfile         # Container config
│   └── requirements.txt   # Python deps
├── docker-compose.yml     # Multi-service orchestration
├── start-all.bat          # Startup script
└── RAG_INTEGRATION.md     # Integration guide
```

## Documentation

- [RAG Integration Guide](RAG_INTEGRATION.md) - Detailed RAG setup
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md) - Project overview

## Technology Stack

**Frontend:** React, Vite, Leaflet, Axios
**Backend:** Express.js, Multer, Axios
**ML:** PyTorch, Vision Transformer (ViT)
**RAG:** FastAPI, ChromaDB, Sentence Transformers, OpenRouter
**Database:** ChromaDB (Vector), JSON (Metadata)
**Deployment:** Docker, Docker Compose

## Contributing

1. Ensure all services start successfully
2. Test integration before committing
3. Update documentation for new features

## License

MIT
