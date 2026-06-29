from langchain_text_splitters import RecursiveCharacterTextSplitter
import os


# CONFIGURATION

CLEAN_TEXT_FOLDER = "documents/clean_text"

splitter = RecursiveCharacterTextSplitter(
    chunk_size=700,
    chunk_overlap=150,
    separators=[
        "\n\n",
        "\n",
        ". ",
        " ",
        ""
    ]
)


# FUNCTION: Chunk single file

def chunk_file(file_path, document_id, file_name, start_id=0):

    with open(file_path, "r", encoding="utf-8") as f:
        text = f.read()

    chunks = splitter.split_text(text)

    chunk_data = []

    for i, chunk in enumerate(chunks):

        chunk_data.append({
            
            "chunk_id": start_id + i + 1,
            "document_id": document_id,
            "file_name": file_name,
            "text": chunk
            })


    return chunk_data



# MAIN PROCESS: All documents

def process_all_documents():

    all_chunks = []
    global_counter = 0

    # stable ordering (VERY IMPORTANT for FAISS consistency)
    files = sorted([
        f for f in os.listdir(CLEAN_TEXT_FOLDER)
        if f.endswith(".txt")
    ])

    for file_name in files:

        file_path = os.path.join(CLEAN_TEXT_FOLDER, file_name)

        file_chunks = chunk_file(file_path, file_name, global_counter)

        global_counter += len(file_chunks)

        all_chunks.extend(file_chunks)

        print(f"Processed: {file_name} | Chunks: {len(file_chunks)}")

    return all_chunks
