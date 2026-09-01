from ..services.document_service import chunk_text
from ..vectorstore import get_vector_store

def process_file_and_embed(text: str, filename: str, user_id: int, file_id: int = None):
    print(f"Processing and embedding {filename} for user {user_id} (file_id={file_id})...")
    documents = chunk_text(text, filename)
    if not documents:
        print(f"No valid chunks extracted from {filename}")
        return
        
    if file_id is not None:
        for doc in documents:
            doc.metadata["file_id"] = file_id
        
    vector_store = get_vector_store()
    vector_store.add_documents(user_id, documents)
    print(f"Successfully generated vectors for {filename} and stored.")
