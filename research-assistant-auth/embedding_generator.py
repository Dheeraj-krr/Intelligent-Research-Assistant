from sentence_transformers import SentenceTransformer
from chunker import process_all_documents

chunks = process_all_documents()
model = SentenceTransformer("all-MiniLM-L6-v2")

texts = [c["text"] for c in chunks]

embeddings = model.encode(texts)

texts = [c["text"] for c in chunks]

embeddings = model.encode(texts)

print("Total embeddings:", len(embeddings))
print("Embedding size:", len(embeddings[0]))