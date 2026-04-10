import os
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# CHROMA_PATH = os.getenv("CHROMA_PATH", "../vector_db/chroma")
CHROMA_PATH_EN = os.getenv("CHROMA_PATH_EN", "../vector_db")
CHROMA_PATH_TA = os.getenv("CHROMA_PATH_TA", "../vector_db_ta")

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# # Primary model
# MODEL_PRIMARY = "openai/gpt-4o-mini"

# # Fallback model
# MODEL_SECONDARY = "anthropic/claude-3-haiku-20240307"

MODEL_PRIMARY = "meta-llama/llama-3-8b-instruct"
MODEL_SECONDARY = "mistralai/mistral-7b-instruct"

# GEMINI FALLBACK
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
