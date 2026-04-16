from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.rag_pipeline import generate_answer

app = FastAPI(
    title="Herb RAG Service",
    version="1.0.0",
    openapi_version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    question: str
    herb_filter: str = None
    language: str = "en"

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "rag_service"}

@app.post("/ask")
def ask_question(request: QueryRequest):
    answer = generate_answer(
        query=request.question,
        herb_name=request.herb_filter,
        user_lang=request.language
        
    )
    return {"answer": answer}

@app.post("/query")
def query_herb(request: QueryRequest):
    answer = generate_answer(request.question, request.herb_filter, request.language)
    return {"answer": answer, "sources": []}
