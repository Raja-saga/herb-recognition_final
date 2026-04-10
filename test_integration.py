import requests
import json

RAG_URL = "http://localhost:8000"
BACKEND_URL = "http://localhost:3001"

def test_rag_health():
    print("Testing RAG Service Health...")
    try:
        response = requests.get(f"{RAG_URL}/health")
        print(f"✓ Status: {response.status_code}")
        print(f"  Response: {response.json()}\n")
        return True
    except Exception as e:
        print(f"✗ Failed: {e}\n")
        return False

def test_rag_ask():
    print("Testing RAG /ask endpoint...")
    try:
        response = requests.post(
            f"{RAG_URL}/ask",
            json={"question": "What are the medicinal uses for Tulsi?"}
        )
        print(f"✓ Status: {response.status_code}")
        print(f"  Answer: {response.json()['answer'][:100]}...\n")
        return True
    except Exception as e:
        print(f"✗ Failed: {e}\n")
        return False

def test_backend_chat():
    print("Testing Backend /api/chat endpoint...")
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/chat",
            json={"herb": "Tulsi", "question": "What are the benefits?"}
        )
        print(f"✓ Status: {response.status_code}")
        print(f"  Answer: {response.json()['answer'][:100]}...\n")
        return True
    except Exception as e:
        print(f"✗ Failed: {e}\n")
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("RAG Service Integration Test")
    print("=" * 50 + "\n")
    
    results = []
    results.append(("RAG Health", test_rag_health()))
    results.append(("RAG Ask", test_rag_ask()))
    results.append(("Backend Chat", test_backend_chat()))
    
    print("=" * 50)
    print("Test Results:")
    print("=" * 50)
    for name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{name}: {status}")
    
    total = len(results)
    passed = sum(1 for _, p in results if p)
    print(f"\nTotal: {passed}/{total} tests passed")
