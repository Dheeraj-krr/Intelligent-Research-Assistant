import os
import pickle
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from chunker import chunk_file

model = SentenceTransformer("all-MiniLM-L6-v2")


def update_faiss(doc_id):

    txt_file = f"documents/clean_text/{doc_id}.txt"

    if not os.path.exists(txt_file):
        print(f"Text file not found: {txt_file}")
        return

   
    # Load existing chunks
  
    with open("chunks.pkl", "rb") as f:
        existing_chunks = pickle.load(f)

  
    # Load existing FAISS index
  
    index = faiss.read_index("research_index.faiss")

  
    # Chunk ONLY this file
  
    new_chunks = chunk_file(
        txt_file,
        doc_id,
        f"{doc_id}.txt"
    )

    if len(new_chunks) == 0:
        print("No chunks generated — skipping FAISS update")
        return

  
    # Generate embeddings
   
    texts = [chunk["text"] for chunk in new_chunks]

    embeddings = model.encode(texts)
    embeddings = np.array(embeddings).astype("float32")

   
    # Add vectors to FAISS
    
    index.add(embeddings)

    
    # Add metadata
    
    existing_chunks.extend(new_chunks)

   
    # Save updated FAISS
  
    faiss.write_index(
        index,
        "research_index.faiss"
    )

    
    # Save updated metadata
    
    with open("chunks.pkl", "wb") as f:
        pickle.dump(
            existing_chunks,
            f
        )

    print("\n====================")
    print("FAISS UPDATED")
    print("====================")
    print(f"Document ID: {doc_id}")
    print(f"Chunks Added: {len(new_chunks)}")
    print(f"Total Vectors: {index.ntotal}")
    print(f"Total Chunks: {len(existing_chunks)}")


    