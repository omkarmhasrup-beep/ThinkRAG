# RAG Chatbot Audit Report

## Phase 2: API & Backend Health

- ✅ /docs endpoint is accessible

## Phase 3: Authentication Testing

- ✅ Valid login successful
- ✅ Invalid password blocked
- ✅ Unauthorized access to protected route blocked

## Phase 6-8: Documents & Security

- Upload Document A: 200
- ✅ Document A correctly indexed and searchable by A
- ✅ User B cannot search User A's documents (Security PASS)

## Phase 9: Chat API

- ✅ Chat creation successful
- ✅ Message sending and RAG LLM response works (Latency: 4.46s)
- ✅ RAG successfully retrieved and answered based on document

## Phase 5 & 11: Hallucination & Injection

- 🔴 CRITICAL — HALLUCINATION: Mars does not have a capital, as it is a planet and not a country or political entity with established human settlements or governments.```rag-context[{"chunk_id": 1, "source": "NumPy_Reference_Documentation.txt", "content": "data = np.arange(12).reshape((4, 3))\nmean = data.mean(axis=0)\nnormalized = data - mean # Broadcasts (4,3) minus (3,)\nprint(\"Normalized Shape:\", normalized.shape)", "score": 10.028414727104195}, {"chunk_id": 2, "source": "NumPy_Reference_Documentation.txt", "content": "NumPy Reference Documentation\nOfficial Guide to N-Dimensional Arrays, Universal Functions, and Vectorization\n\n1. N-Dimensional Arrays (ndarray)\nNumPy provides vectorised multidimensional arrays (`ndarray`) stored in contiguous memory blocks. Memory layouts can be C-contiguous (row-major) or Fortran-contiguous (column-major).\n\nimport numpy as np\n# Create 2D Array and compute matrix operations\na = np.array([[1, 2], [3, 4]], dtype=np.float64)\nb = np.array([[5, 6], [7, 8]], dtype=np.float64)\nproduct = np.matmul(a, b)\neigenvalues, eigenvectors = np.linalg.eig(product)\nprint(\"Matrix Product:\\n\", product)\nprint(\"Eigenvalues:\", eigenvalues)\n\n2. Universal Functions & Broadcasting\nBroadcasting rules allow numpy operations on arrays with differing dimensions without copying data. Dimensions are aligned right-to-left and checked for equality or dimension size equal to 1.", "score": 9.153358911077902}, {"chunk_id": 3, "source": "dummy_a.txt", "content": "This is a secret document belonging to User A. The secret code is ALPHA-99.", "score": 6.213845497782399}, {"chunk_id": 4, "source": "Google_Gemini_API_Documentation.txt", "content": "Google Gemini API Documentation\nOfficial Guide to GenAI SDK Client, Content Generation, and Streaming\n\n1. Google GenAI SDK Client\nThe official `google-genai` Python SDK provides direct interaction with Google Gemini models (`gemini-3.6-flash`, `gemini-2.5-pro`, `gemini-embedding-001`) via `genai.Client(api_key=...)`.\n\nfrom google import genai\nimport os\nclient = genai.Client(api_key=os.getenv(\"GOOGLE_API_KEY\"))\nresponse = client.models.generate_content(\nmodel=\"gemini-3.6-flash\",\ncontents=\"Explain quantum computing in one short paragraph.\"\n)\nprint(\"Response:\", response.text)\n\n2. Real-Time Streaming & Embeddings\nGemini API supports real-time token streaming via `generate_content_stream` and vector embeddings generation via `embed_content`.\n\n# Token Streaming\nstream_resp = client.models.generate_content_stream(\nmodel=\"gemini-3.6-flash\",\ncontents=\"List 3 key benefits of Python.\"\n)\nfor chunk in stream_resp:\nif chunk.text:\nprint(chunk.text, end=\"\", flush=True)", "score": 4.9188854569529035}]```

## Phase 7: Document Deletion

- ✅ Document deletion API success
- 🔴 CRITICAL — VECTOR STORE CLEANUP BUG: Deleted doc still retrievable

Audit completed.
