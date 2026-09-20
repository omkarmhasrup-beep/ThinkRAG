from ..services.document_service import chunk_text
from ..vectorstore import get_vector_store

def process_file_and_embed(text: str, filename: str, user_id: int, file_id: int = None):
    print(f"Processing and embedding {filename} for user {user_id} (file_id={file_id})...")
    try:
        documents = chunk_text(text, filename)
    except Exception as e:
        print(f"Error processing {filename}: {e}")
        raise
        
    if not documents:
        raise ValueError(f"No valid chunks extracted from {filename}")
        
    if file_id is not None:
        for doc in documents:
            doc.metadata["file_id"] = file_id
        
    vector_store = get_vector_store()
    vector_store.add_documents(user_id, documents)
    print(f"Successfully generated vectors for {filename} and stored.")
