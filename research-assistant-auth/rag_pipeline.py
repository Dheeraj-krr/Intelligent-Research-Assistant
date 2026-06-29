from retriever import retrieve
from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


def build_prompt(query, chunks):

    context = "\n\n".join([
        chunk["text"] if isinstance(chunk, dict) else str(chunk)
        for chunk in chunks
    ])

    prompt = f"""
You are a helpful AI assistant.

Use   the context below to answer the question.
If answer is not in context, say "I don't know based on provided documents"  and if the user greets or talk something in general then answer with a friendly greeting and proper response.

CONTEXT:
{context}

QUESTION:
{query}

ANSWER:
"""

    return prompt


def generate_answer(query, user_docs):

    # Get user's file paths
    file_paths = [doc["file_path"] for doc in user_docs]

    allowed_docs = [
        str(doc["document_id"])
        for doc in user_docs
    ]

    # Retrieve chunks
    chunks = retrieve(
        query,
        file_paths=allowed_docs,
        top_k=5
    )

    # Build prompt
    prompt = build_prompt(query, chunks)

    # STREAMING RESPONSE
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        stream=True
    )

    return response

