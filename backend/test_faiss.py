import os
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_core.documents import Document

embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
vs_path = "test_vs"

docs1 = [Document(page_content="doc1", metadata={"source": "file1.pdf"})]
docs2 = [Document(page_content="doc2", metadata={"source": "file2.pdf"})]

print("Creating initial vector store...")
vs1 = FAISS.from_documents(docs1, embeddings)
vs1.save_local(vs_path)
print("Saved initial.")

print("Loading and adding...")
vs2 = FAISS.load_local(vs_path, embeddings, allow_dangerous_deserialization=True)
vs2.add_documents(docs2)
vs2.save_local(vs_path)
print("Saved second.")

vs3 = FAISS.load_local(vs_path, embeddings, allow_dangerous_deserialization=True)
print(f"Total docs: {vs3.index.ntotal}")
