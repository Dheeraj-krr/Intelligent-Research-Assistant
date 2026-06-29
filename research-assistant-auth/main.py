import mysql.connector
from fastapi.responses import StreamingResponse
import json
from fastapi.responses import FileResponse
from fastapi import UploadFile, File, Form
import shutil
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware  
from jose import jwt
import bcrypt
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os
import re
from typing import Optional
from groq import Groq
from utils.pdf_extractor import extract_document , extract_metadata
from rag_pipeline import generate_answer
from process_document import process_document


import faiss
import pickle
import numpy as np
from sentence_transformers import SentenceTransformer
from chunker import chunk_file
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

from rebuild_faiss import rebuild_faiss



load_dotenv()
GROQ_API_KEY=os.getenv("GROQ_API_KEY")

DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

db = mysql.connector.connect(

    host=DB_HOST,

    user=DB_USER,

    password=DB_PASSWORD,

    database=DB_NAME


)

cursor = db.cursor(dictionary=True)

def get_db():
    return mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        connection_timeout=5
    )


def get_current_user_id(credentials: HTTPAuthorizationCredentials) -> int:
    token = credentials.credentials
    payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    return payload["user_id"]


def get_conversation_for_user(conversation_id: int, user_id: int):
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute(
        "SELECT conversation_id, user_id, title, created_at, updated_at FROM conversations WHERE conversation_id=%s AND user_id=%s",
        (conversation_id, user_id),
    )
    conversation = cursor.fetchone()
    cursor.close()
    db.close()
    return conversation


def _normalize_title(title: str) -> str:
    cleaned = re.sub(r"\s+", " ", (title or "")).strip()
    cleaned = re.sub(r"^[^A-Za-z0-9]+|[^A-Za-z0-9]+$", "", cleaned)
    if not cleaned:
        return "New Conversation"

    words = [word for word in re.split(r"[^A-Za-z0-9]+", cleaned) if word]
    if not words:
        return "New Conversation"

    if len(words) < 3:
        words = words + ["Chat"] * (3 - len(words))

    title_words = words[:7]
    title = " ".join(title_words)
    title = title[:50].rstrip()
    title = re.sub(r"^[^A-Za-z0-9]+|[^A-Za-z0-9]+$", "", title)

    if not title:
        return "New Conversation"
    return title


def generate_conversation_title(message: str) -> str:
    cleaned = " ".join((message or "").strip().split())
    if not cleaned:
        return "New Conversation"

    try:
        prompt = (
            "Create a short chat title from this user message. "
            "Rules: 3 to 7 words, summarize the intent, maximum 50 characters, no punctuation at the start or end, do not copy the full message. "
            f"User message: {cleaned}"
        )
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You generate concise chat titles."},
                {"role": "user", "content": prompt},
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.2,
            max_tokens=24,
        )
        candidate = response.choices[0].message.content.strip()
        normalized = _normalize_title(candidate)
        if normalized and normalized.lower() != cleaned.lower():
            return normalized
    except Exception:
        pass

    words = [word for word in re.findall(r"[A-Za-z0-9]+", cleaned) if word]
    if len(words) >= 7:
        fallback_words = words[:7]
    else:
        fallback_words = words[:5]

    fallback = _normalize_title(" ".join(fallback_words))
    return fallback if fallback else "New Conversation"


def initialize_chat_tables():
    db = get_db()
    cursor = db.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS conversations (
            conversation_id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )
        """
    )
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS messages (
            message_id INT AUTO_INCREMENT PRIMARY KEY,
            conversation_id INT NOT NULL,
            user_id INT NOT NULL,
            role ENUM('user', 'assistant') NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
            INDEX idx_messages_conversation_created_at (conversation_id, created_at)
        )
        """
    )
    db.commit()
    cursor.close()
    db.close()


def get_document_stats(document_id: int):
    chunk_count = 0
    character_count = 0

    document_id_str = str(document_id)
    document_id_with_ext = f"{document_id_str}.txt"
    document_id_variants = {
        document_id_str,
        document_id_with_ext,
        document_id_str.lower(),
        document_id_with_ext.lower(),
        str(document_id).replace(".txt", ""),
    }

    try:
        if os.path.exists("chunks.pkl"):
            with open("chunks.pkl", "rb") as f:
                chunks = pickle.load(f)

            matching_chunks = []
            for chunk in chunks:
                chunk_document_id = str(chunk.get("document_id", ""))
                chunk_file_name = str(chunk.get("file_name", ""))

                if (
                    chunk_document_id in document_id_variants
                    or chunk_file_name in document_id_variants
                    or chunk_document_id.replace(".txt", "") in document_id_variants
                    or chunk_file_name.replace(".txt", "") in document_id_variants
                ):
                    matching_chunks.append(chunk)

            chunk_count = len(matching_chunks)

            if matching_chunks:
                character_count = sum(
                    len(chunk.get("text", ""))
                    for chunk in matching_chunks
                )
    except Exception:
        chunk_count = 0
        character_count = 0

    if character_count == 0:
        clean_text_path = f"documents/clean_text/{document_id}.txt"
        if os.path.exists(clean_text_path):
            with open(clean_text_path, "r", encoding="utf-8") as handle:
                character_count = len(handle.read())

    return {
        "chunk_count": chunk_count,
        "character_count": character_count,
    }

app = FastAPI()

@app.on_event("startup")
def startup_event():
    initialize_chat_tables()

client = Groq(
    api_key=os.environ.get("GROQ_API_KEY"),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


SECRET_KEY = "mysecretkey"
ALGORITHM = "HS256"
security = HTTPBearer()


class QuestionRequest(BaseModel):
   question: str

class SummaryRequest(BaseModel):
    document_id: int


class CompareRequest(BaseModel):
    document_id_1: int
    document_id_2: int

class Document(BaseModel):
    file_name: str
    project_id: int
    notes: str = ""

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[int] = None

class Project(BaseModel):
    project_name: str

class UserRegister(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str 



@app.get("/stats")
def get_stats():
    return {
        "total_chunks": 0,
        "total_characters": 0,
    }

# Document Metadata API
@app.get("/documents/{doc_id}/metadata")
def get_document_metadata(

    doc_id: int,

    credentials: HTTPAuthorizationCredentials = Depends(security)

):

    token = credentials.credentials

    payload = jwt.decode(

        token,

        SECRET_KEY,

        algorithms=["HS256"]

    )

    user_id = payload["user_id"]

    db = get_db()

    cursor = db.cursor(dictionary=True)

    cursor.execute(

        """

        SELECT

            d.document_id,
            d.file_name,
            d.project_id,
            d.file_path,
            d.notes,
            d.document_type,
            d.file_size,
            d.uploaded_at,
            d.title,
            d.authors,
            d.document_type

        FROM documents d

        JOIN projects p

        ON d.project_id = p.project_id

        WHERE

            d.document_id=%s

        AND

            p.user_id=%s

        """,

        (

            doc_id,

            user_id

        )

    )

    document = cursor.fetchone()

    cursor.close()

    db.close()

    if not document:

        raise HTTPException(

            status_code=404,

            detail="Document not found"

        )

    metadata = extract_metadata(

        document["file_path"],

        document["document_type"]

    )

    stats = get_document_stats(doc_id)

    return {

        "document_id": doc_id,
        "file_name": document["file_name"],
        "project_id": document["project_id"],
        "notes": document["notes"],
        "document_type": document["document_type"],
        "file_size": document["file_size"],
        "upload_date": document["uploaded_at"],
        "title": metadata.get("title") or document.get("title") or document["file_name"],
        "authors": metadata.get("authors") or document.get("authors") or [],
        "chunk_count": stats["chunk_count"],
        "character_count": stats["character_count"],
        "file_path": document["file_path"]

    }

# Document Extraction API
@app.get("/documents/{doc_id}/extract")
def extract_document_api(
    doc_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    token = credentials.credentials

    payload = jwt.decode(
        token,
        SECRET_KEY,
        algorithms=["HS256"]
    )

    user_id = payload["user_id"]

    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT
            d.file_path,
            d.document_type
        FROM documents d
        JOIN projects p
        ON d.project_id = p.project_id
        WHERE d.document_id=%s
        AND p.user_id=%s
        """,
        (
            doc_id,
            user_id
        )
    )

    document = cursor.fetchone()

    cursor.close()
    db.close()

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

   
    # Extract text
   
    extracted_text = extract_document(
        document["file_path"],
        document["document_type"]
    )

    for item in extracted_text:
        item["file_id"] = str(doc_id)

   
    # Save raw json
   
    os.makedirs(
        "documents/raw_text",
        exist_ok=True
    )

    json_file_path = f"documents/raw_text/{doc_id}.json"

    with open(
        json_file_path,
        "w",
        encoding="utf-8"
    ) as json_file:

        json.dump(
            extracted_text,
            json_file,
            ensure_ascii=False,
            indent=4
        )

   
    # Save clean text
   
    os.makedirs(
        "documents/clean_text",
        exist_ok=True
    )

    clean_file_path = f"documents/clean_text/{doc_id}.txt"

    with open(
        clean_file_path,
        "w",
        encoding="utf-8"
    ) as clean_file:

        for item in extracted_text:
            clean_file.write(item["text"])
            clean_file.write("\n\n")

    
    # STOP DUPLICATE INDEXING
  

    with open("chunks.pkl", "rb") as f:
        old_chunks = pickle.load(f)

    already_present = any(
        chunk["source_document"] == f"{doc_id}.txt"
        for chunk in old_chunks
    )

    if already_present:

        return {
            "message": "Document already indexed",
            "document_id": doc_id
        }

    
    # Chunk only this document
   
    new_chunks = chunk_file(
        clean_file_path,
        f"{doc_id}.txt"
    )

    texts = [chunk["text"] for chunk in new_chunks]

    embeddings = embedding_model.encode(texts)

    embeddings = np.array(
        embeddings
    ).astype("float32")

    
    # Load FAISS index
    

    index = faiss.read_index(
        "research_index.faiss"
    )

    index.add(embeddings)

    faiss.write_index(
        index,
        "research_index.faiss"
    )

    
    # Update chunks.pkl
    

    old_chunks.extend(new_chunks)

    with open(
        "chunks.pkl",
        "wb"
    ) as f:

        pickle.dump(
            old_chunks,
            f
        )

    return {
        "message": "Document extracted and indexed successfully",
        "document_id": doc_id,
        "chunks_added": len(new_chunks)
    }


#Open Document API
@app.get("/documents/{doc_id}/open")
def open_document(

    doc_id: int,

    credentials: HTTPAuthorizationCredentials = Depends(security)

):

    token = credentials.credentials

    payload = jwt.decode(

        token,

        SECRET_KEY,

        algorithms=["HS256"]

    )

    user_id = payload["user_id"]

    db = get_db()

    cursor = db.cursor(dictionary=True)

    cursor.execute(

        """
        SELECT

            d.file_path

        FROM documents d

        JOIN projects p

        ON d.project_id = p.project_id

        WHERE

            d.document_id=%s

        AND

            p.user_id=%s
        """,

        (

            doc_id,

            user_id

        )

    )

    document = cursor.fetchone()

    cursor.close()

    db.close()

    if not document:

        raise HTTPException(

            status_code=404,

            detail="Document not found"

        )

    file_path = document["file_path"]

    extension = (

        file_path

        .split(".")

        [-1]

        .lower()

    )

    if extension == "pdf":

        media_type = "application/pdf"

    elif extension == "docx":

        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    elif extension == "txt":

        media_type = "text/plain"

    else:

        media_type = "application/octet-stream"

    return FileResponse(

        path=file_path,

        media_type=media_type

    )

# AI Question Answering API
@app.post("/ask-ai")
def ask_ai(data: QuestionRequest):

    response = client.chat.completions.create(
        messages=[
            {
                "role":"user",
                "content": data.question
            }
        ],
        model="llama-3.3-70b-versatile",
    )

    return{
        # "question":question,
        "answer":response.choices[0].message.content
    }


# Document Comparison API
@app.post("/compare_papers")
def compare_papers(
    request: CompareRequest
):

    return {

        "document_1":
            request.document_id_1,

        "document_2":
            request.document_id_2,

        "comparison":
            "Both documents discuss similar research topics. This is a dummy comparison response."

    }


# Document Summarization API
@app.post("/summarize")
def summarize_document(
    request: SummaryRequest
):

    return {
        "document_id":
            request.document_id,

        "summary":
            "This is a dummy summary generated for the document."
    }


# Chat API
@app.post("/chat")
def chat(request: ChatRequest, credentials: HTTPAuthorizationCredentials = Depends(security)):
    user_id = get_current_user_id(credentials)

    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT d.document_id, d.file_path
        FROM documents d
        JOIN projects p ON d.project_id = p.project_id
        WHERE p.user_id = %s
        """,
        (user_id,),
    )
    user_docs = cursor.fetchall()
    cursor.close()
    db.close()

    conversation_id = request.conversation_id
    db = get_db()
    cursor = db.cursor(dictionary=True)

    if conversation_id:
        cursor.execute(
            "SELECT conversation_id, title FROM conversations WHERE conversation_id=%s AND user_id=%s",
            (conversation_id, user_id),
        )
        conversation = cursor.fetchone()
        if not conversation:
            cursor.close()
            db.close()
            raise HTTPException(status_code=404, detail="Conversation not found")

        existing_title = (conversation.get("title") or "").strip()
        if not existing_title or existing_title.lower() in {"new conversation", "new chat", "conversation", "chat"}:
            generated_title = generate_conversation_title(request.message)
            cursor.execute(
                "UPDATE conversations SET title=%s WHERE conversation_id=%s AND user_id=%s",
                (generated_title, conversation_id, user_id),
            )
            db.commit()
    else:
        title = generate_conversation_title(request.message)
        cursor.execute(
            "INSERT INTO conversations (user_id, title) VALUES (%s, %s)",
            (user_id, title),
        )
        conversation_id = cursor.lastrowid
        db.commit()
        conversation = {"conversation_id": conversation_id, "title": title}

    cursor.execute(
        "INSERT INTO messages (conversation_id, user_id, role, content) VALUES (%s, %s, 'user', %s)",
        (conversation_id, user_id, request.message),
    )
    db.commit()
    cursor.close()
    db.close()

    def stream():
        try:
            response = generate_answer(request.message, user_docs)
            assistant_parts = []

            yield json.dumps({
                "type": "conversation_started",
                "conversation_id": conversation_id
            }) + "\n"

            for chunk in response:
                content = chunk.choices[0].delta.content
                if content:
                    assistant_parts.append(content)
                    yield json.dumps({
                        "token": content
                    }) + "\n"

            assistant_text = "".join(assistant_parts).strip()
            if assistant_text:
                db2 = get_db()
                cursor2 = db2.cursor()
                cursor2.execute(
                    "INSERT INTO messages (conversation_id, user_id, role, content) VALUES (%s, %s, 'assistant', %s)",
                    (conversation_id, user_id, assistant_text),
                )
                cursor2.execute(
                    "UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE conversation_id=%s AND user_id=%s",
                    (conversation_id, user_id),
                )
                db2.commit()
                cursor2.close()
                db2.close()

            yield json.dumps({
                "type": "done",
                "conversation_id": conversation_id
            }) + "\n"
        except Exception as exc:
            yield json.dumps({
                "type": "error",
                "message": str(exc)
            }) + "\n"

    return StreamingResponse(stream(), media_type="text/event-stream")


@app.get("/chat/conversations")
def list_conversations(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user_id = get_current_user_id(credentials)
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT c.conversation_id, c.title, c.created_at, c.updated_at,
               (SELECT m.content
                FROM messages m
                WHERE m.conversation_id = c.conversation_id
                ORDER BY m.created_at DESC, m.message_id DESC
                LIMIT 1) AS last_message_preview
        FROM conversations c
        WHERE c.user_id = %s
        ORDER BY c.updated_at DESC, c.created_at DESC
        """,
        (user_id,),
    )
    conversations = cursor.fetchall()
    cursor.close()
    db.close()
    return conversations


@app.post("/chat/conversations")
def create_conversation(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user_id = get_current_user_id(credentials)
    title = "New Conversation"
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute(
        "INSERT INTO conversations (user_id, title) VALUES (%s, %s)",
        (user_id, title),
    )
    conversation_id = cursor.lastrowid
    db.commit()
    cursor.close()
    db.close()
    return {
        "conversation_id": conversation_id,
        "title": title,
        "created_at": datetime.utcnow().isoformat(),
    }


@app.get("/chat/conversations/{conversation_id}/messages")
def get_conversation_messages(
    conversation_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    user_id = get_current_user_id(credentials)
    conversation = get_conversation_for_user(conversation_id, user_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT message_id, role, content, created_at
        FROM messages
        WHERE conversation_id = %s AND user_id = %s
        ORDER BY created_at ASC, message_id ASC
        """,
        (conversation_id, user_id),
    )
    messages = cursor.fetchall()
    cursor.close()
    db.close()
    return messages


@app.delete("/chat/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    user_id = get_current_user_id(credentials)
    conversation = get_conversation_for_user(conversation_id, user_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    db = get_db()
    cursor = db.cursor()
    cursor.execute(
        "DELETE FROM conversations WHERE conversation_id=%s AND user_id=%s",
        (conversation_id, user_id),
    )
    db.commit()
    affected = cursor.rowcount
    cursor.close()
    db.close()

    if not affected:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return {"message": "Conversation deleted"}


# Clear Chat History API
@app.delete("/chat/history")
def clear_chat_history(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user_id = get_current_user_id(credentials)
    db = get_db()
    cursor = db.cursor()
    cursor.execute("DELETE FROM conversations WHERE user_id=%s", (user_id,))
    db.commit()
    cursor.close()
    db.close()

    return {"message": "Chat history cleared"}


# Get Chat History API
@app.get("/chat/history")
def history(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user_id = get_current_user_id(credentials)
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT c.conversation_id, c.title, c.created_at, c.updated_at,
               (SELECT m.content FROM messages m WHERE m.conversation_id = c.conversation_id ORDER BY m.created_at DESC, m.message_id DESC LIMIT 1) AS last_message_preview
        FROM conversations c
        WHERE c.user_id = %s
        ORDER BY c.updated_at DESC, c.created_at DESC
        """,
        (user_id,),
    )
    data = cursor.fetchall()
    cursor.close()
    db.close()
    return data


#Upload Document API
@app.post("/documents")
def create_document(document: Document):

    db = get_db()
    cursor = db.cursor(dictionary=True)

    # Duplicate document check

    cursor.execute(
        """
        SELECT *
        FROM documents
        WHERE project_id=%s
        AND file_name=%s
        """,
        (
            document.project_id,
            document.file_name
        )
    )

    existing_document = cursor.fetchone()

    if existing_document:

        cursor.close()
        db.close()

        raise HTTPException(
            status_code=400,
            detail="Document already exists in this project"
        )

    cursor.execute(
        """
        INSERT INTO documents
        (
            project_id,
            file_name,
            notes,
            document_type,
            file_size
        )
        VALUES
        (%s,%s,%s,%s,%s)
        """,
        (
            document.project_id,
            document.file_name,
            document.notes,
            document.file_name.split(".")[-1],
            "Unknown"
        )
    )

    db.commit()

    cursor.close()
    db.close()

    return {
        "message": "Document uploaded"
    }

#Get Documents API
@app.delete("/documents/{doc_id}")
def delete_document(
    doc_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):


    # Verify User
   
    token = credentials.credentials

    payload = jwt.decode(
        token,
        SECRET_KEY,
        algorithms=["HS256"]
    )

    user_id = payload["user_id"]

    db = get_db()
    cursor = db.cursor(dictionary=True)

    
    # Check ownership
   
    cursor.execute(
        """
        SELECT
            d.file_path
        FROM documents d
        JOIN projects p
        ON d.project_id = p.project_id
        WHERE
            d.document_id = %s
        AND
            p.user_id = %s
        """,
        (
            doc_id,
            user_id
        )
    )

    document = cursor.fetchone()

    if not document:
        cursor.close()
        db.close()

        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

   
    # Delete uploaded file
   
    file_path = document["file_path"]

    if file_path and os.path.exists(file_path):
        os.remove(file_path)

    
    # Delete raw extracted JSON
    
    raw_path = f"documents/raw_text/{doc_id}.json"

    if os.path.exists(raw_path):
        os.remove(raw_path)

   
    # Delete clean text
    
    clean_path = f"documents/clean_text/{doc_id}.txt"

    if os.path.exists(clean_path):
        os.remove(clean_path)

   
    # Delete database record
    
    cursor.execute(
        """
        DELETE FROM documents
        WHERE document_id = %s
        """,
        (doc_id,)
    )

    db.commit()

    cursor.close()
    db.close()


    # Rebuild FAISS
   
    rebuild_faiss()

    return {
        "message": "Document deleted successfully"
    }

# File Upload API
@app.post("/upload-file")
def upload_file(

    credentials: HTTPAuthorizationCredentials = Depends(security),

    project_id: int = Form(...),

    notes: str = Form(""),

    file: UploadFile = File(...)

):

    token = credentials.credentials

    payload = jwt.decode(

        token,

        SECRET_KEY,

        algorithms=["HS256"]

    )

    user_id = payload["user_id"]

    db = get_db()

    cursor = db.cursor(dictionary=True)

    # Project ownership check

    cursor.execute(

        """
        SELECT *
        FROM projects
        WHERE project_id=%s
        AND user_id=%s
        """,

        (

            project_id,

            user_id

        )

    )

    project = cursor.fetchone()

    if not project:

        cursor.close()

        db.close()

        raise HTTPException(

            status_code=404,

            detail="Project not found"

        )

    # File type validation

    allowed_extensions = [

        "pdf",

        "docx",

        "txt"

    ]

    file_extension = file.filename.split(".")[-1].lower()

    if file_extension not in allowed_extensions:

        cursor.close()

        db.close()

        raise HTTPException(

            status_code=400,

            detail="Only PDF, DOCX and TXT files are allowed"

        )

   
    # File size validation (50MB)
    

    MAX_FILE_SIZE = 50 * 1024 * 1024

    file.file.seek(0, 2)

    file_size = file.file.tell()

    file.file.seek(0)

    if file_size > MAX_FILE_SIZE:

        cursor.close()

        db.close()

        raise HTTPException(

            status_code=400,

            detail="Maximum file size allowed is 50 MB"

        )

    # Duplicate file check

    cursor.execute(

        """
        SELECT *
        FROM documents
        WHERE project_id=%s
        AND file_name=%s
        """,

        (

            project_id,

            file.filename

        )

    )

    existing_doc = cursor.fetchone()

    if existing_doc:

        cursor.close()

        db.close()

        raise HTTPException(

            status_code=400,

            detail="Document already exists in this project"

        )

    # Corrupted / Fake file validation

    file.file.seek(0)

    file_content = file.file.read()

    file.file.seek(0)

    if len(file_content) == 0:

        cursor.close()

        db.close()

        raise HTTPException(

            status_code=400,

            detail="Empty or corrupted file not allowed"

        )

    if file_extension == "pdf":

        if not file_content.startswith(b"%PDF"):

            cursor.close()

            db.close()

            raise HTTPException(

                status_code=400,

                detail="Invalid PDF file (corrupted or fake)"

            )

    if file_extension == "docx":

        import zipfile

        if not zipfile.is_zipfile(file.file):

            cursor.close()

            db.close()

            raise HTTPException(

                status_code=400,

                detail="Invalid DOCX file (corrupted or fake)"

            )

    file.file.seek(0)

    # Save file to disk

    file_path = f"uploads/{file.filename}"

    with open(file_path, "wb") as buffer:

        shutil.copyfileobj(

            file.file,

            buffer

        )

    # Extract metadata

    metadata = extract_metadata(

        file_path,

        file_extension

    )

    # Insert into database

    cursor.execute(

        """

        INSERT INTO documents

        (

            project_id,

            file_name,

            file_path,

            notes,

            document_type,

            file_size,

            title,

            authors

        )

        VALUES

        (%s,%s,%s,%s,%s,%s,%s,%s)

        """,

        (

            project_id,

            file.filename,

            file_path,

            notes,

            file_extension,

            file_size,

            metadata["title"],

            metadata["authors"]

        )

    )

    db.commit()
    document_id = cursor.lastrowid

    process_document(
        document_id,
        file_path,
        file_extension
    )
    
       

    cursor.close()

    db.close()

    stats = get_document_stats(document_id)

    return {

        "message": "File uploaded and indexed successfully",
        "document_id": document_id,
        "chunk_count": stats["chunk_count"],
        "character_count": stats["character_count"]

    }



# Get Documents by Project API
@app.get("/projects/{project_id}/documents")
def get_project_documents(

    project_id: int,

    credentials: HTTPAuthorizationCredentials = Depends(security)

):

    token = credentials.credentials

    payload = jwt.decode(

        token,

        SECRET_KEY,

        algorithms=["HS256"]

    )

    user_id = payload["user_id"]

    db = get_db()

    cursor = db.cursor(dictionary=True)

    # Verify project belongs to logged in user

    cursor.execute(

        """
        SELECT *
        FROM projects
        WHERE project_id=%s
        AND user_id=%s
        """,

        (

            project_id,

            user_id

        )

    )

    project = cursor.fetchone()

    if not project:

        cursor.close()
        db.close()

        raise HTTPException(

            status_code=404,

            detail="Project not found"

        )

    cursor.execute(

        """
        SELECT

            document_id AS id,

            file_name,

            notes,

            document_type,

            file_size,

            uploaded_at AS upload_date

        FROM documents

        WHERE project_id=%s

        """,

        (

            project_id,

        )

    )

    data = cursor.fetchall()

    for document in data:
        stats = get_document_stats(document["id"])
        document["chunk_count"] = stats["chunk_count"]
        document["character_count"] = stats["character_count"]

    cursor.close()

    db.close()

    return data


# Create Project API
@app.post("/projects")
def create_project(

    project: Project,

    credentials: HTTPAuthorizationCredentials = Depends(security)

):

    token = credentials.credentials

    payload = jwt.decode(

        token,

        SECRET_KEY,

        algorithms=["HS256"]

    )

    user_id = payload["user_id"]

    db = get_db()

    cursor = db.cursor(dictionary=True)

    cursor.execute(

        """
        SELECT *
        FROM projects
        WHERE project_name=%s
        AND user_id=%s
        """,

        (

            project.project_name,

            user_id

        )

    )

    existing_project = cursor.fetchone()

    if existing_project:

        cursor.close()
        db.close()

        raise HTTPException(

            status_code=400,

            detail="Project already exists"

        )

    cursor.execute(

        """
        INSERT INTO projects
        (user_id, project_name)

        VALUES
        (%s,%s)
        """,

        (

            user_id,

            project.project_name

        )

    )

    db.commit()

    cursor.close()

    db.close()

    return {

        "message":
        "Project created successfully"

    }



# Get Projects API
@app.get("/projects")
def get_projects(

    credentials: HTTPAuthorizationCredentials = Depends(security)

):

    token = credentials.credentials

    payload = jwt.decode(

        token,

        SECRET_KEY,

        algorithms=["HS256"]

    )

    user_id = payload["user_id"]

    db = get_db()

    cursor = db.cursor(dictionary=True)

    cursor.execute(

        """
        SELECT
        project_id AS id,
        project_name

        FROM projects

        WHERE user_id=%s
        """,

        (user_id,)

    )

    data = cursor.fetchall()

    cursor.close()

    db.close()

    return data


# Delete Project API
@app.delete("/projects/{project_id}")
def delete_project(
    project_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    payload = jwt.decode(
        token,
        SECRET_KEY,
        algorithms=["HS256"]
    )

    user_id = payload["user_id"]

    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT *
        FROM projects
        WHERE project_id=%s
        AND user_id=%s
        """,
        (
            project_id,
            user_id
        )
    )

    project = cursor.fetchone()

    if not project:
        cursor.close()
        db.close()
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    cursor.execute(
        """
        SELECT document_id, file_path
        FROM documents
        WHERE project_id=%s
        """,
        (
            project_id,
        )
    )

    documents_to_delete = cursor.fetchall()

    for document in documents_to_delete:
        file_path = document.get("file_path")
        if file_path and os.path.exists(file_path):
            os.remove(file_path)

    cursor.execute(
        """
        DELETE FROM documents
        WHERE project_id=%s
        """,
        (
            project_id,
        )
    )

    cursor.execute(
        """
        DELETE FROM projects
        WHERE project_id=%s
        """,
        (
            project_id,
        )
    )

    db.commit()
    cursor.close()
    db.close()

    return {
        "message": "Project deleted successfully"
    }


# Register API
@app.post("/register")
def register(user: UserRegister):

    cursor.execute(

        "SELECT * FROM users WHERE email=%s",

        (user.email,)

    )

    existing_user = cursor.fetchone()

    if existing_user:

        raise HTTPException(

            status_code=400,

            detail="User already exists"

        )

    hashed_password = bcrypt.hashpw(

        user.password.encode("utf-8"),

        bcrypt.gensalt()

    )

    cursor.execute(

        """
        INSERT INTO users
        (name,email,password_hash)

        VALUES
        (%s,%s,%s)
        """,

        (

            user.name,

            user.email,

            hashed_password.decode("utf-8")

        )

    )

    db.commit()

    return {

        "message":
        "User registered successfully"

    }


# Login API
@app.post("/login")
def login(user: UserLogin):

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:
        cursor.execute(
            "SELECT * FROM users WHERE email=%s",
            (user.email,)
        )

        db_user = cursor.fetchone()

    finally:
        cursor.close()
        db.close()

    if not db_user:
        raise HTTPException(status_code=400, detail="User not found")

    stored_password = db_user["password_hash"]

    if not bcrypt.checkpw(
        user.password.encode("utf-8"),
        stored_password.encode("utf-8")
    ):
        raise HTTPException(status_code=400, detail="Incorrect password")

    expiration = datetime.utcnow() + timedelta(minutes=60)

    token = jwt.encode(
    {
        "user_id": db_user["user_id"],
        "email": user.email,
        "exp": expiration
    },
    SECRET_KEY,
    algorithm="HS256"
)

    return {"access_token": token, "token_type": "bearer"}
 

# Protected Profile API
@app.get("/profile")
def profile(credentials: HTTPAuthorizationCredentials = Depends(security)):

    token = credentials.credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        email = payload["email"]

        return {
            "message": "Protected profile accessed",
            "email": email
        }

    except Exception as e:
        print(e)
        raise HTTPException(status_code=401, detail="Invalid token")
    
