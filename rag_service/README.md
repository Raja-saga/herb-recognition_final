# Herb RAG Microservice

RAG system for herb information using ChromaDB and OpenRouter LLM.

## Features
- Vector database (ChromaDB) for semantic search
- LLM integration via OpenRouter (GPT-4o-mini)
- FastAPI REST API
- CORS enabled for frontend integration

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment
Create `.env` file:
```
OPENROUTER_API_KEY=your_api_key_here
CHROMA_PATH=./vector_db/chroma
```

### 3. Run Service
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Or use the startup script:
```bash
start.bat
```

## API Endpoints

### Health Check
```
GET /health
```

### Ask Question
```
POST /ask
Body: {"question": "What are the benefits of Tulsi?"}
```

### Query with Filter
```
POST /query
Body: {"question": "What are the benefits?", "herb_filter": "Tulsi"}
```

## Integration

This service is called by the backend at `http://localhost:8000`.
See `RAG_INTEGRATION.md` in the root directory for full integration details.
