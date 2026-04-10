import chromadb
from chromadb.utils import embedding_functions
import requests
import re
from app.config import (
    OPENROUTER_API_KEY,
    OPENROUTER_URL,
    MODEL_PRIMARY,
    MODEL_SECONDARY,CHROMA_PATH_EN, CHROMA_PATH_TA
)


DOMAIN_DESCRIPTION = """
You are an intelligent medicinal herb assistant.

You are allowed to answer questions related to:

• Botanical identification and taxonomy of medicinal plants  
• Scientific names, botanical properties, chemical compounds, family classification, morphology, climate,grow,daily consumption, active compounds.
• Plant genetics, DNA structure, genome characteristics, molecular biology of plants  
• Genetic markers, DNA barcoding, phylogenetics  
• Plant biochemistry and phytochemical compounds  
• Traditional medicinal uses (Ayurveda, Siddha, Unani, Traditional Chinese Medicine)  
• Modern pharmacological findings and research-backed uses,traditional uses,herbal growing, herbal climate, precautions
• Active phytochemical compounds (alkaloids, flavonoids, terpenoids, glycosides, etc.)  
• Preparation methods (decoction, infusion, paste, powder, extract, gel, juice)  
• Dosage guidelines (general informational purpose only)  
• Side effects and contraindications
• Drug-herb interactions,plant compounds
• Safety precautions and toxicity information  
• Edible and culinary uses  
• Skin and cosmetic applications  
• Climate suitability and growing conditions  
• Soil type and ecological requirements  
• Geographic distribution and native regions  
• Climate, soil, ecology, and distribution  
• Cultivation and conservation  
• Conservation status
• Commercial cultivation, Household remedies
• Ecological details and geographic distribution of herbs.
• Differences between similar species  
• Scientific validation vs traditional claims  

You should answer if the question is even partially related to herbal knowledge,
medicinal plants, plant chemistry, herbal safety, or plant ecology.

Only reject the question if it is completely unrelated 
(e.g., politics, coding, sports, movies, mathematics, etc.).
"""


embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)


domain_embedding = embedding_function([DOMAIN_DESCRIPTION])[0]



# client = chromadb.PersistentClient(path=CHROMA_PATH)
client_en = chromadb.PersistentClient(path=CHROMA_PATH_EN)
client_ta = chromadb.PersistentClient(path=CHROMA_PATH_TA)

collection_en = client_en.get_or_create_collection(
    name="herbal_knowledge_base",
    embedding_function=embedding_function
)

collection_ta = client_ta.get_or_create_collection(
    name="herbal_knowledge_base",
    embedding_function=embedding_function
)

def extract_herb_name(query: str):
    match = re.search(r"for (.+)", query.lower())
    if match:
        return match.group(1).strip()
    return None

def detect_language(query: str):
    # simple Tamil detection
    if re.search(r'[\u0B80-\u0BFF]', query):
        return "ta"
    return "en"

import numpy as np

def is_question_semantically_related(query: str, threshold=0.3):

    query_embedding = embedding_function([query])[0]

    similarity = np.dot(query_embedding, domain_embedding) / (
        np.linalg.norm(query_embedding) * np.linalg.norm(domain_embedding)
    )

    return similarity >= threshold



import uuid
from datetime import datetime

def store_generated_answer(query, answer, herb_name, lang, source="LLM"):

    collection = collection_ta if lang == "ta" else collection_en

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
    
    

def generate_answer(query: str, herb_name=None, user_lang="en"):

    context = ""
    lang = user_lang if user_lang in ("en", "ta") else "en"

    collection = collection_ta if lang == "ta" else collection_en

    # Only auto-extract herb name if none was passed in
    if not herb_name:
        herb_name = extract_herb_name(query)

    results = collection.query(
        query_texts=[query],
        n_results=3
    )
    
    
    if results["documents"] and results["documents"][0]:
        retrieved_docs = results["documents"][0]
        context = "\n\n".join(retrieved_docs)[:1500]
    
    if lang == "en" and not is_question_semantically_related(query):
        return "This question is outside the scope of the medicinal herb knowledge system."
    
    print("LANG:", lang)
    print("QUERY:", query)
    print("CONTEXT LENGTH:", len(context))
    
    
    strict_prompt = f"""
You are a professional medicinal plant expert.

CURRENT LANGUAGE: {lang}
STRICT RULE: Respond ONLY in {'Tamil' if lang == 'ta' else 'English'}. Do NOT mix languages.

If herb_name is provided:
- Assume ALL questions refer to this herb
- Do NOT ask for herb name again

IMPORTANT:
Return clean plain text only.
Do NOT use:
- Markdown symbols (###, **, ---, etc.)
- Decorative separators
- Emojis
- Extra commentary
- Long paragraphs

Use simple structured headings in ALL CAPS.

If information is not clearly available in CONTEXT,
respond EXACTLY:
The requested information is not available in the current database.

Answer ONLY what is asked.

STRUCTURE RULES:

If MEDICINAL:
MEDICINAL USES
- Point 1
- Point 2
- Point 3
- Point 4
- Point 5
- Point 6

If CULINARY:
CULINARY USES
- Point 1
- Point 2
- Point 3
- Point 4
- Point 5


If PREPARATION:
PREPARATION METHOD
Step 1:
Step 2:
Step 3:
Step 4:
Step 5:

If SAFETY:
SAFETY INFORMATION
- Contraindications:
- Drug interactions:
- Warnings:

If GENERAL:
OVERVIEW
BOTANICAL DESCRIPTION
TRADITIONAL USES
MODERN APPLICATIONS

Keep spacing clean and aligned.
Keep each bullet short and precise.

HERB CONTEXT:
The herb being discussed is: {herb_name}

CONTEXT:
{context}

User Question:
{query}
"""

    hybrid_prompt = f"""
You are a senior botanical and herbal science expert.

CURRENT LANGUAGE: {lang}
STRICT RULE: Respond ONLY in {'Tamil' if lang == 'ta' else 'English'}. Do NOT mix languages.

Return professional, clean, structured plain text only.

If herb_name is provided:
- Assume ALL questions refer to this herb
- Do NOT ask for herb name again

Do NOT use:
- Markdown formatting
- Decorative lines
- Bold symbols
- Summary tables
- Conclusion paragraphs

Detect question type and respond accordingly.

If MEDICINAL:
MEDICINAL USES
- Short clear points
- Include active compounds if relevant

If CULINARY:
CULINARY USES
- Flavor profile:
- Cooking applications:

If PREPARATION:
PREPARATION METHOD
Ingredients:
Step 1:
Step 2:
Storage:

If SAFETY:
SAFETY INFORMATION
- Contraindications:
- Drug interactions:
- Toxicity:

If GENERAL:
OVERVIEW
BOTANICAL DESCRIPTION
TRADITIONAL USES
MODERN APPLICATIONS
GEOGRAPHIC DISTRIBUTION

Keep formatting aligned and minimal.
No long paragraphs.
No repetition.

HERB CONTEXT:
The herb being discussed is: {herb_name}

CONTEXT:
{context}

User Question:
{query}
"""

    
    def call_llm(prompt_text, temperature=0.2):

        models = [MODEL_PRIMARY, MODEL_SECONDARY]

        # 1️⃣ Try OpenRouter models
        for model in models:
            try:
                response = requests.post(
                    OPENROUTER_URL,
                    headers={
                        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": model,
                        "messages": [
                            {"role": "system", "content": (
                                f"You are a multilingual medicinal plant expert.\n"
                                f"STRICT RULE: Respond ONLY in {'Tamil' if lang == 'ta' else 'English'}.\n"
                                f"DO NOT mix languages. DO NOT translate unless the user asked for it."
                            )},
                            {"role": "user", "content": prompt_text}
                        ],
                        "temperature": temperature,
                        "max_tokens": 500
                    },
                    timeout=20
                )

                result = response.json()
                print("OpenRouter RAW:", result)

                if "choices" in result:
                    return result["choices"][0]["message"]["content"]

                elif "error" in result:
                    return f"OpenRouter error: {result['error']['message']}"

                else:
                    return f"Unexpected response: {result}"

            except Exception as e:
                print(f"OpenRouter model {model} failed:", e)
        

        return "LLM failed to generate response"

    def translate_to_tamil(text):
            translate_prompt = f"""
        Translate the following text into Tamil.
        Return ONLY Tamil text.

        Text:
        {text}
        """
            return call_llm(translate_prompt, temperature=0.2)

    
    if context.strip() != "":
        db_response = call_llm(strict_prompt, temperature=0.1)
        print("LLM RESPONSE:", db_response)
        if db_response and "not available in the current database" not in db_response.lower():
            return db_response

    fallback_response = call_llm(hybrid_prompt, temperature=0.3)
    print("FALLBACK RESPONSE:", fallback_response)
    return fallback_response


