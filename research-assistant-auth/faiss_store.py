import faiss
import numpy as np
import pickle
from embedding_generator import chunks, embeddings

# Convert to numpy
embeddings_np = np.array(embeddings).astype("float32")

# Dimension
dimension = embeddings_np.shape[1]

# Create FAISS index
index = faiss.IndexFlatL2(dimension)

# Add vectors
index.add(embeddings_np)



# Save chunk metadata
with open("chunks.pkl", "wb") as f:
    pickle.dump(chunks, f)

# Save index
faiss.write_index(index, "research_index.faiss")

print("FAISS index created successfully!")
print("Total vectors:", index.ntotal)