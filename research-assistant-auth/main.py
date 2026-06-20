import mysql.connector
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
import json 
from groq import Groq
from utils.pdf_extractor import extract_document , extract_metadata
import zipfile

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

app = FastAPI()

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

# Fake database
users = {}

# Projects Storage
projects = []

# Documents Storage
documents = []

# Chat History Storage
chat_history = []

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

class Project(BaseModel):
    project_name: str

class UserRegister(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str 


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

            d.file_path,

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

    return {

        "document_id": doc_id,

        "metadata": metadata

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

    extracted_text = extract_document(

        document["file_path"],

        document["document_type"]

    )

    # Add file_id to every page

    for item in extracted_text:

        item["file_id"] = str(doc_id)

    # Save Raw JSON

    os.makedirs(

        "documents/raw_text",

        exist_ok=True

    )

    json_file_path = (

        f"documents/raw_text/{doc_id}.json"

    )

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

    # Save Cleaned Text

    os.makedirs(

        "documents/clean_text",

        exist_ok=True

    )

    clean_file_path = (

        f"documents/clean_text/{doc_id}.txt"

    )

    with open(

        clean_file_path,

        "w",

        encoding="utf-8"

    ) as clean_file:

        for item in extracted_text:

            clean_file.write(

                item["text"]

            )

            clean_file.write(

                "\n\n"

            )

    return {

        "document_id": doc_id,

        "content": extracted_text

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
def chat(request: ChatRequest):

    ai_response = (
        f"AI response for: {request.message}"
    )

    chat_history.append({

        "user_message":
        request.message,

        "ai_response":
        ai_response

    })

    return {

        "response":
        ai_response

    }


# Clear Chat History API
@app.delete("/chat/history")
def clear_chat_history():

    global chat_history

    chat_history = []

    return {
        "message": "Chat history cleared"
    }


# Get Chat History API
@app.get("/chat/history")
def get_chat_history():

    return chat_history


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
@app.get("/documents")
def get_documents():

    return documents


#Delete Document API
@app.delete("/documents/{doc_id}")
def delete_document(

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

    if not document:

        cursor.close()
        db.close()

        raise HTTPException(

            status_code=404,

            detail="Document not found"

        )

    file_path = document["file_path"]

    if file_path and os.path.exists(file_path):

        os.remove(file_path)

    cursor.execute(

        """

        DELETE FROM documents

        WHERE document_id=%s

        """,

        (

            doc_id,

        )

    )

    db.commit()

    cursor.close()

    db.close()

    return {

        "message":

        "Deleted successfully"

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

    # -------------------------------
    # File size validation (50MB)
    # -------------------------------

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

    cursor.close()

    db.close()

    return {

        "message": "File uploaded successfully"

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

    expiration = datetime.utcnow() + timedelta(minutes=10)

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
    
