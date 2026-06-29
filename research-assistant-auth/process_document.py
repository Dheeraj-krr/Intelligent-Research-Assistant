import os
import json


from utils.pdf_extractor import extract_document
from update_faiss import update_faiss


def process_document(document_id, file_path, document_type):


    extracted_text = extract_document(
        file_path,
        document_type
    )

    os.makedirs("documents/raw_text", exist_ok=True)
    os.makedirs("documents/clean_text", exist_ok=True)

    raw_json_path = f"documents/raw_text/{document_id}.json"

    with open(raw_json_path, "w", encoding="utf-8") as f:
        json.dump(
            extracted_text,
            f,
            ensure_ascii=False,
            indent=4
        )

    clean_txt_path = f"documents/clean_text/{document_id}.txt"

    with open(clean_txt_path, "w", encoding="utf-8") as f:

        for item in extracted_text:
            f.write(item["text"])
            f.write("\n\n")

    print("=" * 30)
    print("DOCUMENT PROCESSED")
    print("=" * 30)
    print(f"Document ID : {document_id}")
    print(f"Pages       : {len(extracted_text)}")

    update_faiss(document_id)

    return clean_txt_path