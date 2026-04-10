import uuid
from datetime import datetime


def store_generated_answer(collection, query, answer, herb_name, source="LLM"):
    """
    Store newly generated answer into Vector DB
    """

    document_id = str(uuid.uuid4())

    document_text = f"""
QUESTION:
{query}

ANSWER:
{answer}
"""

    collection.add(
        documents=[document_text],
        metadatas=[{
            "herb": herb_name,
            "source": source,
            "timestamp": str(datetime.now())
        }],
        ids=[document_id]
    )