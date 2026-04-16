## 📄 Data Source for Vector DB

We use a structured JSON file:

* Tamil Data: `Tamil_data's.json` 
* English Data: `data.json` (similar structure)

Each entry contains:

```json
{
  "id": "HERB_0000",
  "document": "Full herb description...",
  "metadata": {
    "scientific_name": "Abies pindrow",
    "family": "Pinaceae"
  }
}
```

---

## 🔄 JSON → Vector DB Conversion Pipeline

### Step 1: Load JSON Data

```python
import json

with open("Tamil_data's.json", "r", encoding="utf-8") as f:
    herb_data_ta = json.load(f)
```

---

### Step 2: Initialize Embedding Model

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('all-MiniLM-L6-v2')
```

---

### Step 3: Convert JSON → Embeddings

```python
documents = []
embeddings = []

for item in herb_data_ta:
    text = item["document"]   # main text
    embedding = model.encode(text)

    documents.append({
        "id": item["id"],
        "text": text,
        "metadata": item["metadata"]
    })

    embeddings.append(embedding)
```

---

### Step 4: Create Vector DB (FAISS)

```python
import faiss
import numpy as np

dimension = len(embeddings[0])

index = faiss.IndexFlatL2(dimension)
index.add(np.array(embeddings))

# Save vector DB
faiss.write_index(index, "vector_db_ta.index")
```

---

### Step 5: Save Metadata (IMPORTANT)

```python
import pickle

with open("vector_db_ta_metadata.pkl", "wb") as f:
    pickle.dump(documents, f)
```

👉 This ensures:

* Vector DB → stores embeddings
* Metadata file → stores herb details

---

## 🔍 Step 6: Query Vector DB

```python
def search(query, index, metadata, k=3):
    query_embedding = model.encode(query)
    
    D, I = index.search(np.array([query_embedding]), k)

    results = [metadata[i] for i in I[0]]
    return results
```

---

## 🧪 Example Query

```python
index = faiss.read_index("vector_db_ta.index")

with open("vector_db_ta_metadata.pkl", "rb") as f:
    metadata = pickle.load(f)

results = search("சளி குணமாகும் மூலிகை", index, metadata)

for r in results:
    print(r["metadata"]["scientific_name"])
```

---

## 🌐 English Vector DB

Same process applies for:

```bash
data.json → vector_db.index
```

---

## 🧠 Architecture Flow

```
JSON Data → Embedding Model → FAISS Index → Metadata Mapping → Search → LLM
```

---

## ⚠️ Important Design Decision

We separate:

* `vector_db.index` → English
* `vector_db_ta.index` → Tamil

### Why?

* Better multilingual accuracy
* Avoid mixed-language embedding confusion
* Faster retrieval

---

## 🚀 Future Improvements

* Use multilingual models:

  * `paraphrase-multilingual-MiniLM`
  * LaBSE

* Use cloud vector DB:

  * Pinecone
  * Weaviate

---

## 📌 Summary

* JSON → converted into embeddings
* Stored in FAISS vector DB
* Metadata stored separately
* Used in RAG pipeline

---
