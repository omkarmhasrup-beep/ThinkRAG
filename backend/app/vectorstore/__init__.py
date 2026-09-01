from .pgvector_store import PGVectorStore

def get_vector_store():
    return PGVectorStore()
