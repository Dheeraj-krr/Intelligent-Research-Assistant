import os
import pickle
import faiss
import numpy as np

from sentence_transformers import SentenceTransformer

from chunker import process_all_documents

# Load embedding model
model = SentenceTransformer("all-MiniLM-L6-v2")


def rebuild_faiss():

    print("\n==============================")
    print("REBUILDING FAISS INDEX...")
    print("==============================")

   
    # Step 1: Generate fresh chunks
  
    all_chunks = process_all_documents()

   
    # Step 2: Save fresh chunks.pkl
 
    with open("chunks.pkl", "wb") as f:
        pickle.dump(
            all_chunks,
            f
        )

  
    # Step 3: If no documents remain
   
    if len(all_chunks) == 0:

        print("No documents remaining.")

        # Create an empty FAISS index
        dimension = 384  # all-MiniLM-L6-v2 embedding size

        index = faiss.IndexFlatL2(dimension)

        faiss.write_index(
            index,
            "research_index.faiss"
        )

        print("Empty FAISS index created.")

        return

  
    # Step 4: Create embeddings
  
    texts = [
        chunk["text"]
        for chunk in all_chunks
    ]

    embeddings = model.encode(texts)

    embeddings = np.array(
        embeddings
    ).astype("float32")

 
    # Step 5: Create fresh FAISS index
   
    dimension = embeddings.shape[1]

    index = faiss.IndexFlatL2(
        dimension
    )

    index.add(
        embeddings
    )

  
    # Step 6: Save FAISS
   
    faiss.write_index(
        index,
        "research_index.faiss"
    )

  
    # Done
    
    print("\n==============================")
    print("FAISS REBUILT SUCCESSFULLY")
    print("==============================")
    print(f"Total Documents : {len(os.listdir('documents/clean_text'))}")
    print(f"Total Chunks    : {len(all_chunks)}")
    print(f"Total Vectors   : {index.ntotal}")