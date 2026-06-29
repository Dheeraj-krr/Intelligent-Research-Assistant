import faiss
import numpy as np
import pickle
import os
from sentence_transformers import SentenceTransformer



# Load model
model = SentenceTransformer("all-MiniLM-L6-v2")

index = faiss.read_index("research_index.faiss")

with open("chunks.pkl", "rb") as f:
    chunks = pickle.load(f)






def retrieve(query, file_paths=None, top_k=5):

    query_embedding = model.encode([query])
    query_embedding = np.array(query_embedding).astype("float32")
    # perform a search asking for more vectors to allow filtering
    distances, indices = index.search(query_embedding, top_k * 5)

    results = []

    def _normalize_variants(path_or_name: str):
        if not path_or_name:
            return set()
        raw = path_or_name.lower()
        base = os.path.basename(raw)
        stem, ext = os.path.splitext(base)
        return {raw, base, stem}

    # build allowed variants from provided file_paths (if any)
    allowed_docs = set()
    if file_paths:
        for p in file_paths:
            allowed_docs.update(_normalize_variants(p))

    # iterate over returned indices (faiss can pad with -1)
    for idx in indices[0]:
        if idx is None or int(idx) < 0:
            continue
        i = int(idx)
        if i >= len(chunks):
            continue

        chunk = chunks[i]

        # be defensive about missing metadata
        doc_name = str(chunk.get("source_document", "")).lower()


      

        # if filtering is requested, require a match against any normalized variant
        if allowed_docs:
            chunk_variants = _normalize_variants(doc_name)
            if not (chunk_variants & allowed_docs):
                continue

        results.append(chunk)
        if len(results) == top_k:
            break

    print("\n=== RETRIEVED CHUNKS ===")

    # If filtering removed all candidates but there are vectors in the index, fall back
    if not results and allowed_docs:
        print("⚠️  No chunks matched filter — falling back to unfiltered results")
        results = []
        for idx in indices[0]:
            if idx is None or int(idx) < 0:
                continue
            i = int(idx)
            if i >= len(chunks):
                continue
            results.append(chunks[i])
            if len(results) == top_k:
                break

    if not results:
        print("❌ NO CHUNKS FOUND (CHECK INDEX OR DATASET)")

    for c in results:
        print("\n---")
        print(c.get("text"))

    return results

