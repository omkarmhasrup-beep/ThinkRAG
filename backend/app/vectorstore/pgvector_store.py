from .base import BaseVectorStore
from ..database.database import SessionLocal
from ..models.document import DocumentChunk
from ..services.embedding_service import get_embeddings_model
from sqlalchemy import func
from sqlalchemy.orm import joinedload

class PGVectorStore(BaseVectorStore):
    def __init__(self):
        pass

    def add_documents(self, user_id: int, documents):
        embeddings = get_embeddings_model()
        db = SessionLocal()
        try:
            chunks_to_insert = []
            for idx, doc in enumerate(documents):
                vector = embeddings.embed_query(doc.page_content)
                file_id = doc.metadata.get("file_id")
                
                chunk = DocumentChunk(
                    user_id=user_id,
                    file_id=file_id,
                    content=doc.page_content,
                    embedding=vector,
                    chunk_index=idx
                )
                chunks_to_insert.append(chunk)
                
            if chunks_to_insert:
                db.add_all(chunks_to_insert)
                db.commit()
                print(f"[PGVECTOR] Uploaded {len(chunks_to_insert)} chunks for user {user_id}")
        except Exception as e:
            db.rollback()
            print(f"[PGVECTOR] Failed to add documents: {e}")
            raise e
        finally:
            db.close()

    def search(self, user_id: int, query: str, k: int = 4, db=None):
        import time
        t_embed_start = time.perf_counter()
        print(f"[PERF DIAGNOSTICS] [PERF 3] Query embedding START at {t_embed_start}")
        embeddings = get_embeddings_model()
        query_vector = embeddings.embed_query(query)
        t_embed_end = time.perf_counter()
        print(f"[PERF DIAGNOSTICS] [PERF 4] Query embedding END at {t_embed_end} (took {t_embed_end - t_embed_start:.4f}s)")
        
        t_db_conn = time.perf_counter()
        print(f"[PERF DIAGNOSTICS] [PERF 5] PostgreSQL connection START at {t_db_conn}")
        local_db = db if db else SessionLocal()
        
        t_search_start = time.perf_counter()
        print(f"[PERF DIAGNOSTICS] [PERF 6] pgvector search START at {t_search_start}")
        
        try:
            # We use pgvector's cosine distance operator (<=>).
            # The distance is 1 - cosine_similarity.
            distance_expr = DocumentChunk.embedding.cosine_distance(query_vector).label('distance')
            
            results = local_db.query(DocumentChunk, distance_expr)\
                .options(joinedload(DocumentChunk.file))\
                .filter(DocumentChunk.user_id == user_id)\
                .order_by(distance_expr)\
                .limit(k).all()
                
            t_search_end = time.perf_counter()
            print(f"[PERF DIAGNOSTICS] [PERF 7] pgvector search END at {t_search_end} (took {t_search_end - t_search_start:.4f}s)")
            
            try:
                import json
                with open("perf_pgvector.json", "w") as f:
                    json.dump({
                        "t_embed_start": t_embed_start,
                        "t_embed_end": t_embed_end,
                        "t_db_conn": t_db_conn,
                        "t_search_start": t_search_start,
                        "t_search_end": t_search_end
                    }, f)
            except Exception:
                pass
            
            t5 = time.time()
            formatted_results = []
            for chunk, dist in results:
                # Calculate similarity score percentage (0-100)
                # distance = 1 - similarity  => similarity = 1 - distance
                similarity = max(0.0, 1.0 - float(dist))
                score_pct = similarity * 100.0
                
                source_name = chunk.file.filename if chunk.file else "Unknown"
                
                formatted_results.append({
                    "content": chunk.content,
                    "source": source_name,
                    "score": score_pct
                })
            t6 = time.time()
            print(f"[PERF] Chunks processing: {(t6 - t5) * 1000:.2f} ms")
            return formatted_results
        except Exception as e:
            print(f"[PGVECTOR] Search failed: {e}")
            return []
        finally:
            if not db:
                local_db.close()

    def delete_document(self, user_id: int, file_id: int):
        # We don't necessarily need to manually delete chunks if we use ON DELETE CASCADE on the file_id ForeignKey,
        # but for explicit safety and matching the interface we delete them here.
        db = SessionLocal()
        try:
            db.query(DocumentChunk).filter(
                DocumentChunk.user_id == user_id, 
                DocumentChunk.file_id == file_id
            ).delete()
            db.commit()
            print(f"[PGVECTOR] Deleted document vectors for file_id {file_id}, user_id {user_id}")
        except Exception as e:
            db.rollback()
            print(f"[PGVECTOR] Delete document failed: {e}")
        finally:
            db.close()

    def get_stats(self, user_id: int):
        db = SessionLocal()
        stats = {
            "total_chunks": 0,
            "embeddings": 0,
            "storage_used_bytes": 0,
            "last_updated": None
        }
        
        try:
            count = db.query(func.count(DocumentChunk.id)).filter(
                DocumentChunk.user_id == user_id
            ).scalar()
            
            count = count or 0
            stats["total_chunks"] = count
            stats["embeddings"] = count
            
            # Approximate embedding storage: 384 dimensions * 4 bytes = 1536 bytes per chunk
            # + text storage and overhead, roughly 2500 bytes per chunk
            stats["storage_used_bytes"] = count * 2500
        except Exception as e:
            print(f"[PGVECTOR] Stats collection failed: {e}")
        finally:
            db.close()
            
        return stats
